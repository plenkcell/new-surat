<?php
// File: backend/reminder/api_kirim_wa_pengguna.php
// VERSI DISEMPURNAKAN: Mengadopsi metode modern dari api_ingatkan_admin.php

require_once '../config.php';
require_once '../database.php';
require_once '../jwt_check.php';

// Keamanan: Hanya admin yang bisa mengirim pesan ini
if (!isset($GLOBALS['decoded_user_data']->level) || $GLOBALS['decoded_user_data']->level !== 'admin') {
    http_response_code(403);
    echo json_encode(["message" => "Akses ditolak."]);
    exit;
}

try {
    // Menggunakan metode POST yang lebih aman
    if ($_SERVER['REQUEST_METHOD'] !== 'POST') {
        throw new Exception("Metode permintaan tidak valid.", 405);
    }
    
    $data = json_decode(file_get_contents("php://input"));
    if (empty($data->nip)) {
        throw new Exception("NIP pengguna tidak disediakan.", 400);
    }

    $database = new Database();
    $db = $database->getConnection();

    // Query untuk mengambil detail lengkap pengguna, diadaptasi dari wauser.php ke PDO
    $sql = "SELECT
                u.nm_pegawai,
                j.nm_jabatan,
                un.nm_unit,
                u.user_login,
                p.no_wa
            FROM
                rsi_user u 
            INNER JOIN rsi_pegawai p ON u.nip = p.nip
            LEFT JOIN rsi_jabatan j ON u.id_jabatan = j.id_jabatan
            LEFT JOIN rsi_unit un ON u.kd_unit = un.kd_unit
            WHERE
                u.nip = :nip";
    
    $stmt = $db->prepare($sql);
    $stmt->bindParam(':nip', $data->nip);
    $stmt->execute();
    $user = $stmt->fetch(PDO::FETCH_ASSOC);

    if (!$user || empty($user['no_wa'])) {
        throw new Exception("Nomor WA untuk pengguna dengan NIP ini tidak ditemukan atau tidak valid.", 404);
    }
    
    // Format nomor telepon dan pesan
    $phone = $user['no_wa'] . '@s.whatsapp.net';
    $message  = " *Assalamu'alaikum wr.wb*\n\n";
    $message .= "Yth, ".$user['nm_pegawai'].", ".$user['nm_jabatan'].", ".$user['nm_unit']."\n";
    $message .= "Detail akun anda untuk aplikasi E-Surat:\n\n";
    $message .= "   - Username : *".$user['user_login']."*\n";
    $message .= "   - Password : *#Juanda20* (*Silahkan ubah password anda untuk keamanan*)\n\n";
    $message .= "Silahkan login ke alamat : https://rsifc.com/esurat\n\n";
    $message .= "*Mohon untuk segera mengganti password anda dengan cara klik nama anda di pojok kanan atas, lalu pilih Profile, kemudian klik Ubah Password.*\n\n";
    $message .= "*Dengan anda merubah password secara berkala berarti anda sudah ikut berpartisipasi dalam hal mengamankan data Rumah Sakit Islam Fatimah Cilacap.*\n\n";
    $message .= "Terima kasih, ini adalah pesan automatis tidak perlu di balas.\n";
    $message .= "*Salam Care*\n\n";
    $message .= "*Wassalamu'alaikum wr.wb*";

    // Menggunakan metode cURL yang lebih modern dari api_ingatkan_admin.php
    $postData = json_encode(["phone" => $phone, "message" => $message]);
    $headers = ["Content-Type: application/json"];

    $ch = curl_init();
    curl_setopt($ch, CURLOPT_URL, "http://192.168.10.11:5051/send/message"); // Pastikan URL, Port, dan Auth sesuai
    curl_setopt($ch, CURLOPT_RETURNTRANSFER, true);
    curl_setopt($ch, CURLOPT_CUSTOMREQUEST, "POST");
    curl_setopt($ch, CURLOPT_POSTFIELDS, $postData);
    curl_setopt($ch, CURLOPT_HTTPHEADER, $headers);
    curl_setopt($ch, CURLOPT_USERPWD, "admin:Pde515123_"); // Ganti dengan kredensial API WA Anda
    
    $response = curl_exec($ch);
    $httpcode = curl_getinfo($ch, CURLINFO_HTTP_CODE);
    $error = curl_error($ch);
    curl_close($ch);

    if ($httpcode >= 200 && $httpcode < 300) {
        http_response_code(200);
        echo json_encode(['message' => 'Pesan informasi akun berhasil dikirim ke ' . $user['nm_pegawai'] . '.']);
    } else {
        // Memberikan pesan error yang lebih deskriptif
        throw new Exception("Gagal mengirim pesan WA. Status: " . $httpcode . ". Error: " . $error);
    }

} catch (Exception $e) {
    $code = $e->getCode() >= 400 ? $e->getCode() : 500;
    http_response_code($code);
    echo json_encode(["message" => "Gagal: " . $e->getMessage()]);
}
?>
