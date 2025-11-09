<?php
require_once '../config.php';
require_once '../database.php';
require_once '../jwt_check.php';

if (!isset($_GET['id_surat_int'])) {
    http_response_code(400);
    echo json_encode(["message" => "ID Surat tidak disediakan."]);
    exit();
}

try {
    $database = new Database();
    $db = $database->getConnection();
    $id_surat_int = $_GET['id_surat_int'];

    $query = "SELECT catatan FROM rsi_catatinternal WHERE id_surat_int = :id_surat_int ORDER BY waktu_dibuat DESC LIMIT 1";
    
    $stmt = $db->prepare($query);
    $stmt->bindParam(':id_surat_int', $id_surat_int, PDO::PARAM_INT);
    $stmt->execute();

    $result = $stmt->fetch(PDO::FETCH_ASSOC);

    http_response_code(200);
    // Jika ada catatan, kirim catatan tersebut. Jika tidak, kirim objek kosong.
    echo json_encode($result ? $result : new stdClass());

} catch (Exception $e) {
    http_response_code(500);
    echo json_encode(["message" => "Gagal mengambil data catatan: " . $e->getMessage()]);
}