<?php
require_once '../config.php';
require_once '../database.php';
require_once '../jwt_check.php';

try {
    if ($_SERVER['REQUEST_METHOD'] !== 'POST') {
        throw new Exception("Metode permintaan tidak valid.", 405);
    }
    
    $required_fields = ['no_surat', 'tgl_surat', 's_surat', 'perihal', 'keterangan', 'j_lampiran'];
    foreach ($required_fields as $field) {
        if (!isset($_POST[$field])) {
            throw new Exception("Semua field wajib diisi.", 400);
        }
    }

    $database = new Database();
    $db = $database->getConnection();
    
    $user_data = $GLOBALS['decoded_user_data'];
    $nama_user = $user_data->nm_pegawai;
    $kd_unit_user = $user_data->kd_unit;

    // --- PENAMBAHAN: Validasi Duplikasi No. Surat ---
    $no_surat_to_check = $_POST['no_surat'];
    $check_sql = "SELECT COUNT(*) FROM rsi_suratinternal WHERE no_surat = :no_surat";
    $check_stmt = $db->prepare($check_sql);
    $check_stmt->bindParam(':no_surat', $no_surat_to_check);
    $check_stmt->execute();
    
    if ($check_stmt->fetchColumn() > 0) {
        http_response_code(409); // 409 Conflict adalah status yang tepat
        echo json_encode(["message" => "Nomor Surat Sudah Ada."]);
        exit();
    }
    // --- AKHIR DARI BLOK VALIDASI ---

    $file_surat_db = null;
    $file_dir_db = null;

    $db->beginTransaction();

    // MODIFIKASI: Seluruh blok kode untuk generate No. Agenda dari rsi_count DIHAPUS.

    if (isset($_FILES['foto']) && $_FILES['foto']['error'] === UPLOAD_ERR_OK) {
        $file = $_FILES['foto'];
        if ($file['size'] > 5 * 1024 * 1024) {
            throw new Exception("Ukuran file tidak boleh melebihi 5MB.", 400);
        }
        
        $file_extension = strtolower(pathinfo($file['name'], PATHINFO_EXTENSION));
        if ($file_extension !== 'pdf') {
            throw new Exception("Hanya file format PDF yang diizinkan.", 400);
        }

        $file_dir_db = date('Y-m'); // Nama folder berdasarkan Tahun-Bulan
        $upload_dir = __DIR__ . '/../../file/' . $file_dir_db;
        if (!is_dir($upload_dir)) {
            if (!mkdir($upload_dir, 0777, true)) {
                 throw new Exception("Gagal membuat direktori file.", 500);
            }
        }
        
        $file_surat_db = 'internal_' . uniqid() . '.pdf';
        $destination = $upload_dir . '/' . $file_surat_db;

        if (!move_uploaded_file($file['tmp_name'], $destination)) {
            throw new Exception("Gagal memindahkan file yang di-upload.", 500);
        }
    } else {
        throw new Exception("File surat wajib di-upload.", 400);
    }

    // MODIFIKASI: Query INSERT diubah, menghapus 'no_agenda'
    $sql = "INSERT INTO rsi_suratinternal 
            (no_surat, kd_unit, perihal, keterangan, tgl_surat, s_surat, j_lampiran, file_surat, file_dir, on_create, on_datetime)
            VALUES
            (:no_surat, :kd_unit, :perihal, :keterangan, :tgl_surat, :s_surat, :j_lampiran, :file_surat, :file_dir, :on_create, NOW())";

    $stmt = $db->prepare($sql);
    
    $stmt->bindParam(':no_surat', $_POST['no_surat']);
    $stmt->bindParam(':kd_unit', $kd_unit_user);
    $stmt->bindParam(':perihal', $_POST['perihal']);
    $stmt->bindParam(':keterangan', $_POST['keterangan']);
    $stmt->bindParam(':tgl_surat', $_POST['tgl_surat']);
    $stmt->bindParam(':s_surat', $_POST['s_surat']);
    $stmt->bindParam(':j_lampiran', $_POST['j_lampiran']);
    $stmt->bindParam(':file_surat', $file_surat_db);
    $stmt->bindParam(':file_dir', $file_dir_db);
    $stmt->bindParam(':on_create', $nama_user);
    
    $stmt->execute();
    
    $db->commit();

    http_response_code(200);
    echo json_encode(["message" => "Surat internal berhasil dikirim."]);

} catch (Exception $e) {
    if (isset($db) && $db->inTransaction()) {
        $db->rollBack();
    }
    $code = $e->getCode() >= 400 ? $e->getCode() : 500;
    http_response_code($code);
    echo json_encode(["message" => "Terjadi kesalahan: " . $e->getMessage()]);
}