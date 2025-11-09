<?php
// socket/index.php
require __DIR__ . '/../vendor/autoload.php';

use Ratchet\MessageComponentInterface;
use Ratchet\ConnectionInterface;
use Ratchet\Server\IoServer;
use Ratchet\Http\HttpServer;
use Ratchet\WebSocket\WsServer;
use React\EventLoop\Factory;
use React\Socket\Server as ReactServer; // Import class yang diperlukan

// Muat konfigurasi database
require_once __DIR__ . '/../backend/config.php'; 

class DisposisiUpdater implements MessageComponentInterface {
    protected $clients;
    private $db_conn;
    private $loop;

    public function __construct($loop) {
        $this->clients = new \SplObjectStorage;
        $this->loop = $loop;
        $this->connectDb();
        echo "WebSocket Server dimulai...\n";
        
        // Menambahkan timer periodik yang memeriksa database setiap 2 detik
        $this->loop->addPeriodicTimer(2, function() {
            // Pesan ini AKAN MUNCUL setiap 2 detik jika loop berjalan
            echo "TIMER AKTIF: Menjalankan pengecekan...\n";
            $this->checkForUpdates();
        });
    }

    private function connectDb() {
        try {
            $dsn = "mysql:host=" . DB_HOST . ";dbname=" . DB_NAME . ";charset=utf8mb4";
            $this->db_conn = new PDO($dsn, DB_USER, DB_PASS);
            $this->db_conn->setAttribute(PDO::ATTR_ERRMODE, PDO::ERRMODE_EXCEPTION);
            // INI ADALAH CARA KITA TAHU KONEKSI DATABASE BERHASIL
            echo "✅ Koneksi database ke WebSocket BERHASIL.\n";
        } catch(PDOException $e) {
            echo "❌ Koneksi database ke WebSocket GAGAL: " . $e->getMessage() . "\n";
            $this->db_conn = null;
        }
    }

    public function checkForUpdates() {
        if (!$this->db_conn) {
            echo "   -> Pengecekan dilewati, tidak ada koneksi database.\n";
            return;
        }

        try {
            $stmt = $this->db_conn->query("SELECT * FROM realtime_updates WHERE is_sent = 0");
            $updates = $stmt->fetchAll(PDO::FETCH_ASSOC);

            if (count($updates) > 0) {
                $ids_to_mark = [];
                foreach ($updates as $update) {
                    echo "   ✨ Pembaruan ditemukan: '{$update['message']}'. Menyiarkan ke " . count($this->clients) . " klien.\n";
                    foreach ($this->clients as $client) {
                        $client->send($update['message']);
                    }
                    $ids_to_mark[] = $update['id'];
                }

                if (!empty($ids_to_mark)) {
                    $placeholders = implode(',', array_fill(0, count($ids_to_mark), '?'));
                    $update_query = "UPDATE realtime_updates SET is_sent = 1 WHERE id IN ($placeholders)";
                    $update_stmt = $this->db_conn->prepare($update_query);
                    $update_stmt->execute($ids_to_mark);
                    echo "   ✔️ Menandai " . count($ids_to_mark) . " pesan sebagai terkirim.\n";
                }
            } else {
                echo "   -> Tidak ada pembaruan baru ditemukan.\n";
            }
        } catch(PDOException $e) {
            echo "   ❌ Error saat memeriksa pembaruan: " . $e->getMessage() . "\n";
            if (strpos($e->getMessage(), 'MySQL server has gone away') !== false) {
                $this->connectDb();
            }
        }
    }

    public function onOpen(ConnectionInterface $conn) {
        $this->clients->attach($conn);
        echo "Browser terhubung! ({$conn->resourceId})\n";
    }

    public function onMessage(ConnectionInterface $from, $msg) { /* Biarkan kosong */ }

    public function onClose(ConnectionInterface $conn) {
        $this->clients->detach($conn);
        echo "Browser terputus. ({$conn->resourceId})\n";
    }

    public function onError(ConnectionInterface $conn, \Exception $e) {
        echo "Terjadi error: {$e->getMessage()}\n";
        $conn->close();
    }
}

// --- MODIFIKASI FINAL: SETUP SERVER SECARA EKSPLISIT ---
$loop = Factory::create();
$updater = new DisposisiUpdater($loop);

$httpServer = new HttpServer(
    new WsServer(
        $updater
    )
);

$socket = new ReactServer('0.0.0.0:9909', $loop);
$server = new IoServer($httpServer, $socket, $loop);

echo "Server berjalan di port 9909. Tekan Ctrl+C untuk berhenti.\n";
$server->run();