<?php
require_once '../config.php';
require_once '../database.php';
require_once '../jwt_check.php';

try {
    $database = new Database();
    $db = $database->getConnection();

    // 1. Tentukan awalan untuk bulan dan tahun saat ini (misal: '2025-09_')
    $prefix = date('Y-m') . '_';

    // 2. Cari nomor agenda terakhir untuk bulan ini
    $sql = "SELECT no_agenda FROM rsi_suratmasuk 
            WHERE no_agenda LIKE :prefix 
            ORDER BY no_agenda DESC LIMIT 1";
            
    $stmt = $db->prepare($sql);
    $search_prefix = $prefix . '%';
    $stmt->bindParam(':prefix', $search_prefix);
    $stmt->execute();

    $last_agenda = $stmt->fetch(PDO::FETCH_ASSOC);
    $next_number = 1;

    if ($last_agenda) {
        // 3. Jika ditemukan, ambil nomor urutnya, tambah 1
        $parts = explode('_', $last_agenda['no_agenda']);
        $last_number = (int)end($parts);
        $next_number = $last_number + 1;
    }

    // 4. Format nomor urut menjadi 3 digit dengan angka nol di depan (misal: 001, 012)
    $formatted_number = str_pad($next_number, 3, '0', STR_PAD_LEFT);
    $next_agenda_number = $prefix . $formatted_number;

    http_response_code(200);
    echo json_encode(['next_agenda_number' => $next_agenda_number]);

} catch (Exception $e) {
    http_response_code(500);
    echo json_encode(["message" => "Gagal membuat nomor agenda: " . $e->getMessage()]);
}
?>