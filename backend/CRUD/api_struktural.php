<?php
// File: backend/CRUD/api_struktural.php
// API baru untuk mengelola data jabatan (CRUD)

require_once '../config.php';
require_once '../database.php';
require_once '../jwt_check.php';

$database = new Database();
$db = $database->getConnection();
$method = $_SERVER['REQUEST_METHOD'];

try {
    switch ($method) {
        case 'GET':
            // Aksi untuk mengambil semua data jabatan
            $stmt = $db->prepare("SELECT id_jabatan, nm_jabatan FROM rsi_jabatan WHERE id_jabatan != '99' ORDER BY id_jabatan ASC");
            $stmt->execute();
            $result = $stmt->fetchAll(PDO::FETCH_ASSOC);
            http_response_code(200);
            echo json_encode($result);
            break;

        case 'POST':
            // Aksi untuk membuat jabatan baru (Hanya Admin)
            if ($GLOBALS['decoded_user_data']->level !== 'admin') throw new Exception("Akses ditolak.", 403);
            
            $data = json_decode(file_get_contents("php://input"));
            if (empty($data->nm_jabatan)) throw new Exception("Nama Jabatan tidak boleh kosong.", 400);

            $nm_jabatan = filter_var($data->nm_jabatan, FILTER_SANITIZE_STRING);

            $sql = "INSERT INTO rsi_jabatan (nm_jabatan) VALUES (:nm_jabatan)";
            $stmt = $db->prepare($sql);
            $stmt->bindParam(':nm_jabatan', $nm_jabatan);
            
            if ($stmt->execute()) {
                http_response_code(201);
                echo json_encode(["message" => "Jabatan baru berhasil ditambahkan."]);
            } else {
                throw new Exception("Gagal menambahkan jabatan baru.", 500);
            }
            break;

        case 'PUT':
            // Aksi untuk memperbarui jabatan (Hanya Admin)
            if ($GLOBALS['decoded_user_data']->level !== 'admin') throw new Exception("Akses ditolak.", 403);
            
            $data = json_decode(file_get_contents("php://input"));
            if (empty($data->id_jabatan) || empty($data->nm_jabatan)) throw new Exception("ID dan Nama Jabatan tidak boleh kosong.", 400);
            if ($data->id_jabatan == '99') throw new Exception("Jabatan ini tidak dapat diubah.", 403);

            $id_jabatan = filter_var($data->id_jabatan, FILTER_SANITIZE_NUMBER_INT);
            $nm_jabatan = filter_var($data->nm_jabatan, FILTER_SANITIZE_STRING);

            $sql = "UPDATE rsi_jabatan SET nm_jabatan = :nm_jabatan WHERE id_jabatan = :id_jabatan";
            $stmt = $db->prepare($sql);
            $stmt->bindParam(':nm_jabatan', $nm_jabatan);
            $stmt->bindParam(':id_jabatan', $id_jabatan);

            if ($stmt->execute()) {
                http_response_code(200);
                echo json_encode(["message" => "Nama Jabatan berhasil diperbarui."]);
            } else {
                throw new Exception("Gagal memperbarui jabatan.", 500);
            }
            break;

        case 'DELETE':
            // Aksi untuk menghapus jabatan (Hanya Admin)
            if ($GLOBALS['decoded_user_data']->level !== 'admin') throw new Exception("Akses ditolak.", 403);

            $data = json_decode(file_get_contents("php://input"));
            if (empty($data->id_jabatan)) throw new Exception("ID Jabatan tidak boleh kosong.", 400);
            if ($data->id_jabatan == '99') throw new Exception("Jabatan ini tidak dapat dihapus.", 403);

            $id_jabatan = filter_var($data->id_jabatan, FILTER_SANITIZE_NUMBER_INT);

            $sql = "DELETE FROM rsi_jabatan WHERE id_jabatan = :id_jabatan";
            $stmt = $db->prepare($sql);
            $stmt->bindParam(':id_jabatan', $id_jabatan);

            if ($stmt->execute()) {
                if ($stmt->rowCount() > 0) {
                    http_response_code(200);
                    echo json_encode(["message" => "Jabatan berhasil dihapus."]);
                } else {
                    throw new Exception("Jabatan dengan ID tersebut tidak ditemukan.", 404);
                }
            } else {
                throw new Exception("Gagal menghapus jabatan.", 500);
            }
            break;

        default:
            throw new Exception("Metode permintaan tidak valid.", 405);
            break;
    }
} catch (Exception $e) {
    $code = $e->getCode() >= 400 && $e->getCode() < 600 ? $e->getCode() : 500;
    http_response_code($code);
    echo json_encode(["message" => $e->getMessage()]);
}
?>