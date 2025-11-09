<?php
require_once __DIR__ . '/config.php';
// Kita tidak pakai jwt_check.php di sini karena token dikirim via GET untuk kemudahan akses file
// Sebagai gantinya, kita akan validasi manual.

use Firebase\JWT\JWT;
use Firebase\JWT\Key;

// Keamanan Tingkat 1: Pastikan pengguna sudah mengirim token JWT
if (!isset($_GET['jwt'])) {
    http_response_code(403);
    die('Akses ditolak. Token otentikasi tidak ada.');
}

// Keamanan Tingkat 2: Validasi token JWT
try {
    JWT::decode($_GET['jwt'], new Key(JWT_SECRET, 'HS256'));
} catch (Exception $e) {
    http_response_code(401);
    die('Token tidak valid atau telah kedaluwarsa.');
}

// Keamanan Tingkat 3: Pastikan parameter 'path' ada
if (!isset($_GET['path'])) {
    http_response_code(400);
    die('Permintaan tidak valid, path file tidak ada.');
}

try {
    $file_rel_path = $_GET['path']; // Contoh: 'file/pendukung/attachment_xxxx.pdf'

    // Keamanan Tingkat 4: Pastikan path tidak mencoba mengakses direktori lain (directory traversal)
    if (strpos($file_rel_path, '..') !== false || !preg_match('/^file\/pendukung\//', $file_rel_path)) {
        http_response_code(400);
        die('Path file tidak valid.');
    }

    $file_path_server = __DIR__ . '/../' . $file_rel_path;

    if (!file_exists($file_path_server) || !is_readable($file_path_server)) {
        http_response_code(404);
        die('File tidak ditemukan atau tidak dapat diakses.');
    }

    // Tentukan Content-Type berdasarkan ekstensi file
    $finfo = finfo_open(FILEINFO_MIME_TYPE);
    $mime_type = finfo_file($finfo, $file_path_server);
    finfo_close($finfo);

    // Kirim header yang sesuai
    header('Content-Type: ' . $mime_type);
    header('Content-Length: ' . filesize($file_path_server));
    header('Content-Disposition: inline; filename="' . basename($file_path_server) . '"');
    header('Accept-Ranges: bytes');
    
    ob_clean();
    flush();
    
    readfile($file_path_server);
    exit;

} catch (Exception $e) {
    http_response_code(500);
    die('Terjadi kesalahan saat memproses file: ' . $e->getMessage());
}