<?php
require_once '../config.php';
require_once '../database.php';
require_once '../jwt_check.php';

try {
    if ($_SERVER['REQUEST_METHOD'] !== 'POST') {
        throw new Exception("Metode permintaan tidak valid.", 405);
    }

    $data = json_decode(file_get_contents("php://input"));
    if (empty($data->id_surat_int)) {
        throw new Exception("ID Surat tidak boleh kosong.", 400);
    }

    $database = new Database();
    $db = $database->getConnection();

    // 1. Ambil detail surat untuk isi pesan
    $stmt_surat = $db->prepare("SELECT no_surat, perihal, on_create FROM rsi_suratinternal WHERE id_surat_int = :id");
    $stmt_surat->bindParam(':id', $data->id_surat_int);
    $stmt_surat->execute();
    $surat = $stmt_surat->fetch(PDO::FETCH_ASSOC);

    if (!$surat) {
        throw new Exception("Detail surat tidak ditemukan.", 404);
    }

    // 2. Ambil daftar nomor WA admin yang akan dikirimi pesan
    // Query ini sesuai dengan yang Anda berikan
    $stmt_admin = $db->prepare("SELECT rpg.no_wa, rpg.nm_pegawai FROM rsi_pegawai rpg WHERE rpg.nip IN ('7270415', '3400402')");
    $stmt_admin->execute();
    $admins = $stmt_admin->fetchAll(PDO::FETCH_ASSOC);

    if (!$admins) {
        throw new Exception("Tidak ditemukan data admin untuk dikirimi pengingat.", 404);
    }

    // 3. Looping untuk kirim pesan ke setiap admin
    $berhasil_terkirim = 0;
    foreach ($admins as $admin) {
        if (empty($admin['no_wa'])) continue;

        $phone = $admin['no_wa'] . '@s.whatsapp.net';
        
        // Kustomisasi pesan WhatsApp
        $message = "Assalamualaikum wr.wb, Yth. *".$admin['nm_pegawai']."* \n\n";
        $message .= "*REMINDER VERIFIKASI SURAT INTERNAL* \n\n";
        $message .= "Mohon untuk segera melakukan verifikasi pada surat berikut: \n";
        $message .= "-\t *No. Surat:* ".$surat['no_surat']." \n";
        $message .= "-\t *Perihal:* ".$surat['perihal']." \n";
        $message .= "-\t *Pengirim:* ".$surat['on_create']." \n\n";
        $message .= "Terima kasih atas perhatiannya. \n\n";
        $message .= "*[Pesan Otomatis dari E-Surat]*";

        $postData = json_encode(["phone" => $phone, "message" => $message]);
        $headers = ["Content-Type: application/json"];

        $ch = curl_init();
        curl_setopt($ch, CURLOPT_URL, "http://192.168.10.11:5051/send/message"); // URL API WA Anda
        curl_setopt($ch, CURLOPT_RETURNTRANSFER, true);
        curl_setopt($ch, CURLOPT_CUSTOMREQUEST, "POST");
        curl_setopt($ch, CURLOPT_POSTFIELDS, $postData);
        curl_setopt($ch, CURLOPT_HTTPHEADER, $headers);
        curl_setopt($ch, CURLOPT_USERPWD, "admin:Pde515123_"); // Autentikasi API WA Anda

        $response = curl_exec($ch);
        if (!curl_errno($ch)) {
            $berhasil_terkirim++;
        }
        curl_close($ch);
    }

    if ($berhasil_terkirim > 0) {
        http_response_code(200);
        echo json_encode(["message" => "Pengingat berhasil dikirim ke " . $berhasil_terkirim . " admin."]);
    } else {
        throw new Exception("Gagal mengirim pengingat ke semua admin.", 500);
    }

} catch (Exception $e) {
    $code = $e->getCode() >= 400 ? $e->getCode() : 500;
    http_response_code($code);
    echo json_encode(["message" => $e->getMessage()]);
}
?>