<?php
require_once '../config.php';
require_once '../database.php';
require_once '../jwt_check.php';

$data = json_decode(file_get_contents("php://input"));

// Validasi input dasar
if (empty($data->old_password) || empty($data->new_password) || empty($data->confirm_password)) {
    http_response_code(400);
    echo json_encode(["message" => "Semua field password wajib diisi."]);
    exit();
}
if ($data->new_password !== $data->confirm_password) {
    http_response_code(400);
    echo json_encode(["message" => "Password baru dan konfirmasi tidak cocok."]);
    exit();
}
if (strlen($data->new_password) < 8) {
    http_response_code(400);
    echo json_encode(["message" => "Password baru minimal harus 8 karakter."]);
    exit();
}

try {
    $database = new Database();
    $db = $database->getConnection();

    $user_login = $GLOBALS['decoded_user_data']->user_login;

    // 1. Ambil hash password saat ini dari database
    $query_get = "SELECT pass_login FROM rsi_user WHERE user_login = :user_login";
    $stmt_get = $db->prepare($query_get);
    $stmt_get->bindParam(':user_login', $user_login, PDO::PARAM_STR);
    $stmt_get->execute();
    $user = $stmt_get->fetch(PDO::FETCH_ASSOC);

    if (!$user) {
        http_response_code(404);
        echo json_encode(["message" => "Pengguna tidak ditemukan."]);
        exit();
    }

    // 2. Verifikasi password lama
    if (!password_verify($data->old_password, $user['pass_login'])) {
        http_response_code(401);
        echo json_encode(["message" => "Password lama salah."]);
        exit();
    }

    // 3. Hash password baru dan update ke database
    $new_password_hash = password_hash($data->new_password, PASSWORD_DEFAULT);
    $query_update = "UPDATE rsi_user SET pass_login = :new_password WHERE user_login = :user_login";
    $stmt_update = $db->prepare($query_update);
    $stmt_update->bindParam(':new_password', $new_password_hash, PDO::PARAM_STR);
    $stmt_update->bindParam(':user_login', $user_login, PDO::PARAM_STR);

    if ($stmt_update->execute()) {
        http_response_code(200);
        echo json_encode(["message" => "Password berhasil diubah."]);
    } else {
        http_response_code(500);
        echo json_encode(["message" => "Gagal mengubah password."]);
    }

} catch (Exception $e) {
    http_response_code(500);
    echo json_encode(["message" => "Terjadi kesalahan: " . $e->getMessage()]);
}