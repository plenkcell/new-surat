<?php
require_once '../config.php';
require_once '../database.php';
require_once '../jwt_check.php';

if ($GLOBALS['decoded_user_data']->level !== 'admin') {
    http_response_code(403);
    echo json_encode(["message" => "Akses ditolak."]);
    exit;
}

try {
    $database = new Database();
    $db = $database->getConnection();
    $stmt = $db->prepare("SELECT id_jabatan, nm_jabatan FROM rsi_jabatan ORDER BY nm_jabatan ASC");
    $stmt->execute();
    $jabatan = $stmt->fetchAll(PDO::FETCH_ASSOC);

    http_response_code(200);
    echo json_encode($jabatan);
} catch (Exception $e) {
    http_response_code(500);
    echo json_encode(["message" => "Gagal mengambil data jabatan: " . $e->getMessage()]);
}
?>
