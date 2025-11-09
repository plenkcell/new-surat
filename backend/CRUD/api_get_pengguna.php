<?php
// File: backend/CRUD/api_get_pengguna.php
//require_once '../api_headers.php';
require_once '../config.php';
require_once '../database.php';
require_once '../jwt_check.php';

// Keamanan: Hanya admin yang bisa mengakses data ini
if ($GLOBALS['decoded_user_data']->level !== 'admin') {
    http_response_code(403);
    echo json_encode(["message" => "Akses ditolak."]);
    exit;
}

try {
    $database = new Database();
    $db = $database->getConnection();
    
    $stmt = $db->prepare("
        SELECT 
            u.nip, p.nm_pegawai, u.user_login, u.level, 
            IF(u.is_aktif='1', 'Aktif', 'Non-Aktif') as is_aktif, 
            j.nm_jabatan, un.nm_unit, p.no_wa, u.id_jabatan, u.kd_unit, u.pelihat
        FROM rsi_user u
        LEFT JOIN rsi_pegawai p ON u.nip = p.nip
        LEFT JOIN rsi_jabatan j ON u.id_jabatan = j.id_jabatan
        LEFT JOIN rsi_unit un ON u.kd_unit = un.kd_unit
        ORDER BY p.nm_pegawai ASC
    ");
    $stmt->execute();
    $users = $stmt->fetchAll(PDO::FETCH_ASSOC);

    http_response_code(200);
    echo json_encode($users);

} catch (Exception $e) {
    http_response_code(500);
    echo json_encode(["message" => "Gagal mengambil data pengguna: " . $e->getMessage()]);
}
?>