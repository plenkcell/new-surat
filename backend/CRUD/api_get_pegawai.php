<?php
// File: backend/CRUD/api_get_pegawai.php
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
    
    $stmt = $db->prepare("
        SELECT rp.nip, rp.nm_pegawai, DATE_FORMAT(rp.tgl_lahir, '%d-%m-%Y') as tgl_lahir, rp.email, rp.no_wa, rp.is_aktif
        FROM rsi_pegawai rp 
        ORDER BY rp.nm_pegawai ASC
    ");
    $stmt->execute();
    $pegawai = $stmt->fetchAll(PDO::FETCH_ASSOC);

    http_response_code(200);
    echo json_encode($pegawai);

} catch (Exception $e) {
    send_json_error(500, "Gagal mengambil data pegawai: " . $e->getMessage());
}
?>