<?php
// File: backend/CRUD/api_get_agenda_today.php
//require_once '../api_headers.php';
require_once '../config.php';
require_once '../database.php';
require_once '../jwt_check.php';

try {
    $database = new Database();
    $db = $database->getConnection();

    // Dapatkan tanggal hari ini dalam format Y-m-d
    $today = date('Y-m-d');

    $query = "
        SELECT 
            id, judul, lokasi, jam_mulai, jam_selesai, nama_pemohon 
        FROM agendas 
        WHERE tanggal_mulai = :today AND is_aktif = 1 
        ORDER BY jam_mulai ASC
    ";

    $stmt = $db->prepare($query);
    $stmt->bindParam(':today', $today);
    $stmt->execute();
    $results = $stmt->fetchAll(PDO::FETCH_ASSOC);

    http_response_code(200);
    echo json_encode($results);

} catch (Exception $e) {
    http_response_code(500);
    echo json_encode(["message" => "Gagal mengambil data agenda hari ini: " . $e->getMessage()]);
}
?>