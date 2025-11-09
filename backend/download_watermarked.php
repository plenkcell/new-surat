<?php
// Hapus config.php, karena jwt_check akan memuatnya.
// require_once 'config.php';
require_once __DIR__ . '/../vendor/autoload.php';

use setasign\Fpdi\Tcpdf\Fpdi;

// Keamanan Tingkat 1: Validasi JWT dari parameter URL
if (!isset($_GET['jwt'])) {
    http_response_code(403);
    die('Akses ditolak. Token otentikasi tidak ada.');
}
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
    http_response_code(400); // Bad Request
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

    if ($decrypted_path === false) throw new Exception('Gagal mendekripsi path file.');

    $file_path = __DIR__ . '/../' . $decrypted_path;

    if (!file_exists($file_path)) {
        http_response_code(404);
        die('File tidak ditemukan.');
    }

    // Inisialisasi FPDI
    $pdf = new Fpdi();
    $pageCount = $pdf->setSourceFile($file_path);

    // Proses setiap halaman untuk menambahkan watermark
    for ($pageNo = 1; $pageNo <= $pageCount; $pageNo++) {
        $templateId = $pdf->importPage($pageNo);
        $size = $pdf->getTemplateSize($templateId);

        // Tambahkan halaman baru dengan ukuran yang sama
        $pdf->AddPage($size['orientation'], [$size['width'], $size['height']]);
        $pdf->useTemplate($templateId);

        // Siapkan properti watermark
        $pdf->SetFont('helvetica', 'B', 50);
        $pdf->SetTextColor(220, 220, 220); // Warna abu-abu terang
        $pdf->SetAlpha(0.5); // Set transparansi

        // Posisi watermark
        $centerX = $size['width'] / 2;
        $centerY = $size['height'] / 2;
        
        $offset = 70; 

        $setWatermarkText = function($y_pos) use ($pdf, $centerX, $centerY) {
            $text = "E-SURAT RSIFC";
            $textWidth = $pdf->GetStringWidth($text);
            
            $pdf->StartTransform();
            $pdf->Rotate(45, $centerX, $centerY);
            $pdf->Text($centerX - ($textWidth / 2), $y_pos, $text);
            $pdf->StopTransform();
        };

        $setWatermarkText($centerY - $offset); // Atas
        $setWatermarkText($centerY);           // Tengah
        $setWatermarkText($centerY + $offset); // Bawah
        
        $pdf->SetAlpha(1);
    }

    // Kirim PDF yang sudah di-watermark ke browser untuk diunduh
    $pdf->Output('watermarked_' . basename($file_path), 'D');

} catch (Exception $e) {
    http_response_code(500);
    die('Terjadi kesalahan: ' . $e->getMessage());
}