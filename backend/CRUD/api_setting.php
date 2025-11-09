<?php
// File: backend/CRUD/api_setting.php
// VERSI DIPERBAIKI: Path untuk unggah dan baca logo disesuaikan ke assets/images/

require_once '../config.php';
require_once '../database.php';
require_once '../jwt_check.php';

// Keamanan: Hanya admin yang bisa mengakses
if (!isset($GLOBALS['decoded_user_data']->level) || $GLOBALS['decoded_user_data']->level !== 'admin') {
    http_response_code(403);
    echo json_encode(["message" => "Akses ditolak."]);
    exit;
}

$database = new Database();
$db = $database->getConnection();
$method = $_SERVER['REQUEST_METHOD'];

try {
    if ($method === 'GET') {
        // Aksi untuk mengambil data setting
        $stmt = $db->prepare("SELECT kota, lembaga, alamat, telpon, foto FROM tb_profile LIMIT 1");
        $stmt->execute();
        $settings = $stmt->fetch(PDO::FETCH_ASSOC);

        if ($settings) {
            // PERBAIKAN: Path disesuaikan ke assets/images/
            $default_logo = 'assets/images/placeholder.png';
            $logo_path_from_root = !empty($settings['foto']) ? 'assets/images/' . $settings['foto'] : $default_logo;
            
            // Cek apakah file logo benar-benar ada, jika tidak, gunakan placeholder
            // Path untuk file_exists relatif dari file PHP ini
            $logo_path_on_server = '../../' . $logo_path_from_root;
            if (!file_exists($logo_path_on_server)) {
                $logo_path_from_root = $default_logo;
            }

            $settings['foto_url'] = $logo_path_from_root;
            http_response_code(200);
            echo json_encode($settings);
        } else {
            throw new Exception("Data profile tidak ditemukan.", 404);
        }

    } elseif ($method === 'POST') {
        // Aksi untuk memperbarui data setting
        $kota = filter_input(INPUT_POST, 'kota', FILTER_SANITIZE_STRING);
        $lembaga = filter_input(INPUT_POST, 'lembaga', FILTER_SANITIZE_STRING);
        $alamat = filter_input(INPUT_POST, 'alamat', FILTER_SANITIZE_STRING);
        $telpon = filter_input(INPUT_POST, 'telpon', FILTER_SANITIZE_STRING);

        if (empty($kota) || empty($lembaga) || empty($alamat) || empty($telpon)) {
            throw new Exception("Semua field teks wajib diisi.", 400);
        }

        $params = [
            ':kota' => $kota,
            ':lembaga' => $lembaga,
            ':alamat' => $alamat,
            ':telpon' => $telpon,
        ];
        
        $set_clauses = ["kota = :kota", "lembaga = :lembaga", "alamat = :alamat", "telpon = :telpon"];

        // Validasi dan proses file unggahan jika ada
        if (isset($_FILES['foto']) && $_FILES['foto']['error'] === UPLOAD_ERR_OK) {
            $file = $_FILES['foto'];
            
            if ($file['size'] > 1048576) { // 1MB
                throw new Exception("Ukuran file logo tidak boleh melebihi 1MB.", 400);
            }

            $allowed_types = ['image/jpeg', 'image/png'];
            $file_info = finfo_open(FILEINFO_MIME_TYPE);
            $mime_type = finfo_file($file_info, $file['tmp_name']);
            finfo_close($file_info);

            if (!in_array($mime_type, $allowed_types)) {
                throw new Exception("Tipe file logo tidak valid. Hanya .jpg dan .png yang diizinkan.", 400);
            }

            $extension = pathinfo($file['name'], PATHINFO_EXTENSION);
            $new_filename = 'logo_' . time() . '.' . $extension;
            
            // PERBAIKAN: Path unggah disesuaikan ke assets/images/
            $upload_path = '../../assets/images/' . $new_filename;

            // Hapus foto lama jika ada
            $stmt_old_foto = $db->prepare("SELECT foto FROM tb_profile LIMIT 1");
            $stmt_old_foto->execute();
            $old_foto = $stmt_old_foto->fetchColumn();
            if ($old_foto && file_exists('../../assets/images/' . $old_foto)) {
                unlink('../../assets/images/' . $old_foto);
            }

            if (!move_uploaded_file($file['tmp_name'], $upload_path)) {
                throw new Exception("Gagal mengunggah file logo baru. Periksa izin folder.", 500);
            }
            
            $set_clauses[] = "foto = :foto";
            $params[':foto'] = $new_filename;
        }

        // Update database
        $sql = "UPDATE tb_profile SET " . implode(', ', $set_clauses);
        $stmt = $db->prepare($sql);
        $stmt->execute($params);

        http_response_code(200);
        echo json_encode(["message" => "Setting aplikasi berhasil diperbarui."]);

    } else {
        throw new Exception("Metode permintaan tidak valid.", 405);
    }
} catch (Exception $e) {
    $code = $e->getCode() >= 400 ? $e->getCode() : 500;
    http_response_code($code);
    echo json_encode(["message" => $e->getMessage()]);
}
?>

