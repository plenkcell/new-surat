<?php
// File: backend/CRUD/api_get_units.php
//require_once '../api_headers.php';
require_once '../config.php';
require_once '../database.php';
require_once '../jwt_check.php';

// Keamanan: Hanya admin yang bisa mengakses data ini
if ($GLOBALS['decoded_user_data']->level !== 'admin') {
    send_json_error(403, "Akses ditolak.");
}

try {
    $database = new Database();
    $db = $database->getConnection();
    
    $stmt = $db->prepare("SELECT kd_unit, nm_unit FROM rsi_unit WHERE kd_unit NOT IN ('9999') ORDER BY kd_unit ASC");
    $stmt->execute();
    $units = $stmt->fetchAll(PDO::FETCH_ASSOC);

    http_response_code(200);
    echo json_encode($units);
} catch (Exception $e) {
    send_json_error(500, "Gagal mengambil data unit: " . $e->getMessage());
}
?>