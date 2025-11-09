<?php
// File: backend/CRUD/api_get_unit.php
require_once '../config.php';
require_once '../database.php';
require_once '../jwt_check.php';

// Hanya admin yang boleh
if ($GLOBALS['decoded_user_data']->level !== 'admin') {
    http_response_code(403);
    echo json_encode(["message" => "Akses ditolak."]);
    exit;
}

try {
    $database = new Database();
    $db = $database->getConnection();

    $stmt = $db->prepare("SELECT kd_unit, nm_unit FROM rsi_unit ORDER BY nm_unit ASC");
    $stmt->execute();
    $units = $stmt->fetchAll(PDO::FETCH_ASSOC);

    http_response_code(200);
    echo json_encode($units);
} catch (Exception $e) {
    http_response_code(500);
    echo json_encode(["message" => "Gagal mengambil data unit: " . $e->getMessage()]);
}
?>
