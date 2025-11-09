<?php
require_once '../config.php';
require_once '../database.php';
require_once '../jwt_check.php';

try {
    if ($_SERVER['REQUEST_METHOD'] !== 'POST') {
        throw new Exception("Metode permintaan tidak valid.", 405);
    }
    
    if (empty($_POST['isi_dispos']) || !isset($_POST['id_surat']) || !isset($_POST['id_dispo_unit'])) {
        throw new Exception("Data teks tidak lengkap.", 400);
    }

    $database = new Database();
    $db = $database->getConnection();
    
    $user_data = $GLOBALS['decoded_user_data'];
    $nama_user = $user_data->nm_pegawai;
    $kd_unit_user = $user_data->kd_unit;

    $attachment_path_db = null;
    $attachment_name_db = null;

    if (isset($_FILES['attachment']) && $_FILES['attachment']['error'] === UPLOAD_ERR_OK) {
        $file = $_FILES['attachment'];
        if ($file['size'] > 5 * 1024 * 1024) {
            throw new Exception("Ukuran file tidak boleh melebihi 5MB.", 400);
        }
        
        $upload_dir = __DIR__ . '/../../file/pendukung/';
        if (!is_dir($upload_dir)) mkdir($upload_dir, 0777, true);
        
        $file_extension = strtolower(pathinfo($file['name'], PATHINFO_EXTENSION));
        $new_filename = uniqid('attachment_', true) . '.' . $file_extension;
        $destination = $upload_dir . $new_filename;

        if (!move_uploaded_file($file['tmp_name'], $destination)) {
            throw new Exception("Gagal memindahkan file yang di-upload.", 500);
        }

        $attachment_path_db = 'file/pendukung/' . $new_filename;
        $attachment_name_db = basename($file['name']);
    }

    $db->beginTransaction();

    $query_insert = "INSERT INTO rsi_disposisi_isi (id_surat, isi_disposisi, user, kd_unit, waktu, attachment_path, attachment_name) 
                     VALUES (:id_surat, :isi_dispos, :user, :kd_unit, NOW(), :attachment_path, :attachment_name)";
    $stmt_insert = $db->prepare($query_insert);
    $stmt_insert->execute([
        ':id_surat' => $_POST['id_surat'],
        ':isi_dispos' => $_POST['isi_dispos'],
        ':user' => $nama_user,
        ':kd_unit' => $kd_unit_user,
        ':attachment_path' => $attachment_path_db,
        ':attachment_name' => $attachment_name_db
    ]);

    $query_update = "UPDATE rsi_disposisi_unit SET is_balas = '1' WHERE id = :id_dispo_unit";
    $stmt_update = $db->prepare($query_update);
    $stmt_update->execute([':id_dispo_unit' => $_POST['id_dispo_unit']]);
    
    // MODIFIKASI: Baris untuk INSERT ke realtime_updates sudah dihapus karena sekarang ditangani oleh Trigger.

    $db->commit();

    http_response_code(200);
    echo json_encode(["message" => "Disposisi berhasil disimpan."]);

} catch (Exception $e) {
    if (isset($db) && $db->inTransaction()) {
        $db->rollBack();
    }
    $code = $e->getCode() >= 400 ? $e->getCode() : 500;
    http_response_code($code);
    echo json_encode(["message" => "Terjadi kesalahan: " . $e->getMessage()]);
}