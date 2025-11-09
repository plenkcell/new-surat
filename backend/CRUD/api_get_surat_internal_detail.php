<?php
require_once '../config.php';
require_once '../database.php';
require_once '../jwt_check.php';

if (!isset($_GET['id'])) {
    http_response_code(400);
    echo json_encode(["message" => "ID Surat tidak disediakan."]);
    exit();
}

try {
    $database = new Database();
    $db = $database->getConnection();
    $id_surat_int = $_GET['id'];

    $query = "SELECT no_surat, tgl_surat, s_surat, perihal, keterangan, j_lampiran, file_surat 
              FROM rsi_suratinternal 
              WHERE id_surat_int = :id_surat_int";
    
    $stmt = $db->prepare($query);
    $stmt->bindParam(':id_surat_int', $id_surat_int, PDO::PARAM_INT);
    $stmt->execute();

    $surat = $stmt->fetch(PDO::FETCH_ASSOC);

    if ($surat) {
        http_response_code(200);
        echo json_encode($surat);
    } else {
        http_response_code(404);
        echo json_encode(["message" => "Data surat tidak ditemukan."]);
    }

} catch (Exception $e) {
    http_response_code(500);
    echo json_encode(["message" => "Gagal mengambil data detail: " . $e->getMessage()]);
}