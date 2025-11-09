<?php
require_once '../config.php';
require_once '../database.php';
require_once '../jwt_check.php';

$data = json_decode(file_get_contents("php://input"));

// Validasi input
if (empty($data->nm_pegawai)) {
    http_response_code(400);
    echo json_encode(["message" => "Nama pegawai tidak boleh kosong."]);
    exit();
}

try {
    $database = new Database();
    $db = $database->getConnection();

    $user_login = $GLOBALS['decoded_user_data']->user_login;

    $query = "UPDATE rsi_user SET nm_pegawai = :nm_pegawai WHERE user_login = :user_login";
    
    $stmt = $db->prepare($query);
    $stmt->bindParam(':nm_pegawai', $data->nm_pegawai, PDO::PARAM_STR);
    $stmt->bindParam(':user_login', $user_login, PDO::PARAM_STR);

    if ($stmt->execute()) {
        http_response_code(200);
        echo json_encode(["message" => "Profil berhasil diperbarui."]);
    } else {
        http_response_code(500);
        echo json_encode(["message" => "Gagal memperbarui profil."]);
    }

} catch (Exception $e) {
    http_response_code(500);
    echo json_encode(["message" => "Terjadi kesalahan: " . $e->getMessage()]);
}