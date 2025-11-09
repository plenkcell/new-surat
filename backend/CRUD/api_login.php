<?php
require_once '../init.php';
require_once '../database.php';
require_once '../config.php';
require_once '../../vendor/autoload.php';

use Firebase\JWT\JWT;

$issuedat_claim = time();
$expire_claim = $issuedat_claim + 3600;

$data = json_decode(file_get_contents("php://input"));

if (empty($data->user_login) || empty($data->pass_login)) {
    http_response_code(400);
    echo json_encode(["message" => "Login gagal. Username dan password harus diisi."]);
    exit();
}

$database = new Database();
$db = $database->getConnection();

$query = "SELECT nip, nm_pegawai, user_login, pass_login, level, pelihat, kd_unit, id_jabatan FROM rsi_user WHERE user_login = :user_login AND is_aktif = '1' LIMIT 0,1";
$stmt = $db->prepare($query);
$stmt->bindParam(':user_login', $data->user_login);
$stmt->execute();
$user = $stmt->fetch(PDO::FETCH_ASSOC);

if ($user && password_verify($data->pass_login, $user['pass_login'])) {
    $payload = [
        "iat" => $issuedat_claim,
        "exp" => $expire_claim,
        "nip" => $user['nip'], // <-- tambahkan nip di root
        "data" => [
            "nip"        => $user['nip'],
            "user_login" => $user['user_login'],
            "nm_pegawai" => $user['nm_pegawai'],
            "level"      => $user['level'],
            "pelihat"    => $user['pelihat'],
            "kd_unit"    => $user['kd_unit'],
            "id_jabatan" => $user['id_jabatan']
        ]
    ];

    $jwt = JWT::encode($payload, JWT_SECRET, 'HS256');

    http_response_code(200);
    echo json_encode(["message" => "Login berhasil.", "token" => $jwt]);

} else {
    http_response_code(401);
    echo json_encode(["message" => "Login gagal. Username atau password salah."]);
}