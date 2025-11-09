<?php
require_once '../config.php';
require_once '../database.php';
require_once '../jwt_check.php';

try {
    $database = new Database();
    $db = $database->getConnection();

    // Ambil data user_login dari token yang sudah divalidasi
    $user_login = $GLOBALS['decoded_user_data']->user_login;

    // Query untuk mengambil data profil, HINDARI mengambil kolom password
    $query = "SELECT nip, nm_pegawai, user_login, level FROM rsi_user WHERE user_login = :user_login LIMIT 1";
    
    $stmt = $db->prepare($query);
    $stmt->bindParam(':user_login', $user_login, PDO::PARAM_STR);
    $stmt->execute();

    $user = $stmt->fetch(PDO::FETCH_ASSOC);

    if ($user) {
        http_response_code(200);
        echo json_encode($user);
    } else {
        http_response_code(404);
        echo json_encode(["message" => "Pengguna tidak ditemukan."]);
    }

} catch (Exception $e) {
    http_response_code(500);
    echo json_encode(["message" => "Gagal mengambil data profil: " . $e->getMessage()]);
}