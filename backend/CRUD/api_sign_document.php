<?php
// File: backend/CRUD/api_sign_document.php
require_once '../config.php';
require_once '../database.php';
require_once '../jwt_check.php';
//require_once '../api_headers.php';

// Mengatur batas waktu eksekusi lebih lama karena proses TTE bisa memakan waktu
set_time_limit(120); // 2 menit

try {
    // 1. Validasi Input
    if ($_SERVER['REQUEST_METHOD'] !== 'POST') {
        throw new Exception("Metode permintaan tidak valid.", 405);
    }
    if (empty($_FILES['pdfFile'])) {
        throw new Exception("File PDF wajib diunggah.", 400);
    }
    if (empty($_POST['passphrase'])) {
        throw new Exception("Passphrase wajib diisi.", 400);
    }

    $user_data = $GLOBALS['decoded_user_data'];
    $passphrase = $_POST['passphrase'];
    $pdfFile = $_FILES['pdfFile'];

    // 2. Persiapan cURL ke API Tanda Tangan Digital
    // Logika ini diambil dari process_upload.php Anda
    $cFile = new CURLFile($pdfFile['tmp_name'], $pdfFile['type'], $pdfFile['name']);
    $postData = ['file' => $cFile, 'passphrase' => $passphrase];
    
    // Ganti URL dan kredensial ini jika berbeda
    $apiUrl = 'https://api.digitalsignature.id/sign/pdf'; 
    $apiUser = '6285155333535'; 
    $apiPass = 'Pde515123$'; 

    $ch = curl_init();
    curl_setopt($ch, CURLOPT_URL, $apiUrl);
    curl_setopt($ch, CURLOPT_USERPWD, $apiUser . ":" . $apiPass);
    curl_setopt($ch, CURLOPT_POST, 1);
    curl_setopt($ch, CURLOPT_POSTFIELDS, $postData);
    curl_setopt($ch, CURLOPT_RETURNTRANSFER, true);
    
    // 3. Eksekusi dan Tangani Respons
    $response = curl_exec($ch);
    $http_code = curl_getinfo($ch, CURLINFO_HTTP_CODE);
    $curl_error = curl_error($ch);
    curl_close($ch);

    if ($curl_error) {
        throw new Exception("cURL Error: " . $curl_error, 500);
    }

    if ($http_code == 200) {
        // Jika berhasil, kirim file PDF yang sudah ditandatangani kembali ke browser
        header('Content-Type: application/pdf');
        header('Content-Disposition: attachment; filename="signed_' . basename($pdfFile['name']) . '"');
        echo $response;
        exit;
    } else {
        // Jika gagal, teruskan pesan error dari API TTE
        $error_data = json_decode($response, true);
        $error_message = $error_data['error'] ?? 'Gagal menandatangani dokumen. Silakan coba lagi.';
        throw new Exception($error_message, $http_code);
    }

} catch (Exception $e) {
    // Tangani semua error lain dalam format JSON
    http_response_code($e->getCode() >= 400 ? $e->getCode() : 500);
    echo json_encode(["message" => $e->getMessage()]);
}
?>