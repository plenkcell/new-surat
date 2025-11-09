<?php
// File: backend/jwt_check.php (Versi Final & Fleksibel)

require_once __DIR__ . '/../vendor/autoload.php';
require_once __DIR__ . '/config.php';

use Firebase\JWT\JWT;
use Firebase\JWT\Key;
use Firebase\JWT\ExpiredException;

// Fungsi untuk mengirim response error dalam format JSON
function send_json_error($code, $message) {
    http_response_code($code);
    echo json_encode(["message" => $message]);
    exit;
}

$token = null;

// Prioritas 1: Cek Authorization Header (Cara yang Benar)
$authHeader = $_SERVER['HTTP_AUTHORIZATION'] ?? '';
if (preg_match('/Bearer\s(\S+)/', $authHeader, $matches)) {
    $token = $matches[1];
} 
// Prioritas 2: Cek parameter URL (Untuk kompatibilitas)
else if (isset($_GET['jwt'])) {
    $token = $_GET['jwt'];
}

if (!$token) {
    send_json_error(401, 'Token otentikasi tidak ditemukan.');
}

try {
    $decoded = JWT::decode($token, new Key(JWT_SECRET, 'HS256'));
    
    // Simpan data user ke variabel global agar bisa diakses oleh file API lain
    $GLOBALS['decoded_user_data'] = $decoded->data;

} catch (ExpiredException $e) {
    send_json_error(401, 'Sesi Anda telah berakhir. Silakan login kembali.');
} catch (Exception $e) {
    send_json_error(401, 'Token tidak valid atau rusak.');
}
?>