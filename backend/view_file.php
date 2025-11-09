<?php
// Hapus config.php, karena jwt_check akan memuatnya.
// require_once 'config.php';

// Keamanan Tingkat 1: Validasi JWT dari parameter URL
// Kita akan memodifikasi jwt_check.php sedikit agar bisa menerima token dari GET
// Tapi untuk sekarang, kita lakukan validasi manual di sini.
if (!isset($_GET['jwt'])) {
    http_response_code(403);
    die('Akses ditolak. Token otentikasi tidak ada.');
}
require_once __DIR__ . '/../vendor/autoload.php';
require_once __DIR__ . '/config.php';

use Firebase\JWT\JWT;
use Firebase\JWT\Key;

try {
    JWT::decode($_GET['jwt'], new Key(JWT_SECRET, 'HS256'));
} catch (Exception $e) {
    http_response_code(401);
    die('Token tidak valid atau telah kedaluwarsa.');
}
// Akhir dari blok keamanan JWT

// Keamanan Tingkat 2: Pastikan parameter 'token' (untuk file) ada.
if (!isset($_GET['token'])) {
    http_response_code(400);
    die('Permintaan tidak valid.');
}

try {
    // Ambil kunci rahasia dari environment variables untuk dekripsi
    $encryption_key = JWT_SECRET; 
    $ciphering = "AES-128-CTR";
    $iv_length = openssl_cipher_iv_length($ciphering);
    
    // Dekripsi token untuk mendapatkan path file asli
    $token = urldecode($_GET['token']);
    $decoded_token = base64_decode($token);
    
    $iv = substr($decoded_token, 0, $iv_length);
    $encrypted_path = substr($decoded_token, $iv_length);
    
    $decrypted_path = openssl_decrypt($encrypted_path, $ciphering, $encryption_key, 0, $iv);

    if ($decrypted_path === false) {
        throw new Exception('Gagal mendekripsi path file.');
    }

    // GANTI BARIS INI:
    // $file_path = __DIR__ . '/../' . $decrypted_path;

    // MENJADI SEPERTI INI:
    $file_path = dirname(__DIR__) . '/' . $decrypted_path;

    if (!file_exists($file_path) || !is_readable($file_path)) {
        http_response_code(404);
        die('File tidak ditemukan atau tidak dapat diakses.');
    }

    // Kirim file ke browser
    header('Content-Type: application/pdf');
    header('Content-Disposition: inline; filename="' . basename($file_path) . '"');
    header('Content-Length: ' . filesize($file_path));
    header('Accept-Ranges: bytes');
    
    ob_clean();
    flush();
    
    readfile($file_path);
    exit;

} catch (Exception $e) {
    http_response_code(500);
    die('Terjadi kesalahan saat memproses file: ' . $e->getMessage());
}