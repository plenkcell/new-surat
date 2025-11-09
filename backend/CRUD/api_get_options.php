<?php
// File: backend/CRUD/api_get_options.php
//require_once '../api_headers.php';
require_once '../config.php';
require_once '../database.php';
require_once '../jwt_check.php';

if ($GLOBALS['decoded_user_data']->level !== 'admin') { exit; }

try {
    $database = new Database();
    $db = $database->getConnection();
    
    $type = $_GET['type'] ?? '';
    $data = [];

    if ($type === 'pegawai') {
        // Ambil pegawai yang BELUM memiliki akun user
        $stmt = $db->prepare("SELECT p.nip, p.nm_pegawai FROM rsi_pegawai p WHERE p.is_aktif = 'Aktif' AND p.nip NOT IN (SELECT u.nip FROM rsi_user u)");
        $stmt->execute();
        $data = $stmt->fetchAll(PDO::FETCH_ASSOC);
    } elseif ($type === 'jabatan') {
        $stmt = $db->prepare("SELECT id_jabatan, nm_jabatan FROM rsi_jabatan ORDER BY nm_jabatan");
        $stmt->execute();
        $data = $stmt->fetchAll(PDO::FETCH_ASSOC);
    } elseif ($type === 'unit') {
        $stmt = $db->prepare("SELECT kd_unit, nm_unit FROM rsi_unit ORDER BY nm_unit");
        $stmt->execute();
        $data = $stmt->fetchAll(PDO::FETCH_ASSOC);
    }
    
    http_response_code(200);
    echo json_encode($data);

} catch (Exception $e) {
    http_response_code(500);
    echo json_encode(["message" => "Gagal mengambil data: " . $e->getMessage()]);
}
?>