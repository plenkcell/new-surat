<?php
require_once '../config.php';
require_once '../database.php';
require_once '../jwt_check.php';

$data = json_decode(file_get_contents("php://input"));

if (empty($data->id_surat_int) || !isset($data->catatan)) {
    http_response_code(400);
    echo json_encode(["message" => "ID Surat dan Catatan tidak boleh kosong."]);
    exit();
}

try {
    $database = new Database();
    $db = $database->getConnection();

    $user_data = $GLOBALS['decoded_user_data'];
    $nama_user = $user_data->nm_pegawai;
    $level_user = $user_data->level;

    if ($level_user !== 'admin') {
        http_response_code(403);
        echo json_encode(["message" => "Akses ditolak. Fitur ini hanya untuk admin."]);
        exit();
    }

    $id_surat_int = $data->id_surat_int;
    $catatan = $data->catatan;

    // --- MODIFIKASI: Menggunakan COUNT(*) untuk memeriksa keberadaan data ---
    $check_sql = "SELECT COUNT(*) FROM rsi_catatinternal WHERE id_surat_int = :id_surat_int";
    $check_stmt = $db->prepare($check_sql);
    $check_stmt->bindParam(':id_surat_int', $id_surat_int, PDO::PARAM_INT);
    $check_stmt->execute();
    $note_exists = $check_stmt->fetchColumn() > 0;

    if ($note_exists) {
        // Jika ada, lakukan UPDATE
        $sql = "UPDATE rsi_catatinternal 
                SET dibuat_oleh = :dibuat_oleh, waktu_dibuat = NOW(), catatan = :catatan 
                WHERE id_surat_int = :id_surat_int";
        $message = "Catatan berhasil diperbarui.";
    } else {
        // Jika tidak ada, lakukan INSERT
        $sql = "INSERT INTO rsi_catatinternal (id_surat_int, dibuat_oleh, waktu_dibuat, catatan) 
                VALUES (:id_surat_int, :dibuat_oleh, NOW(), :catatan)";
        $message = "Catatan berhasil disimpan.";
    }
    
    $stmt = $db->prepare($sql);
    
    $stmt->bindParam(':id_surat_int', $id_surat_int, PDO::PARAM_INT);
    $stmt->bindParam(':dibuat_oleh', $nama_user, PDO::PARAM_STR);
    $stmt->bindParam(':catatan', $catatan, PDO::PARAM_STR);
    
    if ($stmt->execute()) {
        http_response_code(200);
        echo json_encode(["message" => $message]);
    } else {
        http_response_code(500);
        echo json_encode(["message" => "Gagal menyimpan catatan ke database."]);
    }

} catch (Exception $e) {
    http_response_code(500);
    echo json_encode(["message" => "Terjadi kesalahan: " . $e->getMessage()]);
}