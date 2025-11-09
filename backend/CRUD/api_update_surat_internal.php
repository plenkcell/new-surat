<?php
require_once '../config.php';
require_once '../database.php';
require_once '../jwt_check.php';

try {
    if ($_SERVER['REQUEST_METHOD'] !== 'POST') {
        throw new Exception("Metode permintaan tidak valid.", 405);
    }
    
    $required_fields = ['id_surat_int', 'no_surat', 'tgl_surat', 's_surat', 'perihal', 'keterangan', 'j_lampiran'];
    foreach ($required_fields as $field) {
        if (!isset($_POST[$field])) {
            throw new Exception("Data formulir tidak lengkap.", 400);
        }
    }

    $database = new Database();
    $db = $database->getConnection();
    
    $user_data = $GLOBALS['decoded_user_data'];
    $nama_user = $user_data->nm_pegawai;
    $id_surat_int = $_POST['id_surat_int'];
    
    $file_surat_db = null; // Variabel untuk nama file baru
    $db->beginTransaction();

    // --- KODE BARU: VALIDASI SEBELUM EKSEKUSI ---
    $stmt_check = $db->prepare("SELECT is_status FROM rsi_suratinternal WHERE id_surat_int = :id_surat_int");
    $stmt_check->bindParam(':id_surat_int', $id_surat_int);
    $stmt_check->execute();
    $surat = $stmt_check->fetch(PDO::FETCH_ASSOC);

    if (!$surat) {
        throw new Exception("Surat tidak ditemukan.", 404);
    }

    if ($surat['is_status'] === 'Sudah') {
        throw new Exception("Maaf, Status Surat Internal Anda sudah di Verifikasi Oleh Admin", 409); // 409 Conflict
    }
    // --- AKHIR DARI KODE BARU ---

    // MODIFIKASI: Logika upload file diperbaiki
    if (isset($_FILES['foto']) && $_FILES['foto']['error'] === UPLOAD_ERR_OK) {
        $file = $_FILES['foto'];
        if ($file['size'] > 5 * 1024 * 1024) throw new Exception("Ukuran file melebihi 5MB.", 400);
        
        $file_extension = strtolower(pathinfo($file['name'], PATHINFO_EXTENSION));
        if ($file_extension !== 'pdf') throw new Exception("Hanya file PDF yang diizinkan.", 400);

        // Ambil file_dir (no_agenda) dari surat yang ada di database untuk konsistensi folder
        $stmt_dir = $db->prepare("SELECT file_dir FROM rsi_suratinternal WHERE id_surat_int = :id_surat_int");
        $stmt_dir->bindParam(':id_surat_int', $id_surat_int, PDO::PARAM_INT);
        $stmt_dir->execute();
        $surat_lama = $stmt_dir->fetch(PDO::FETCH_ASSOC);
        $file_dir_db = $surat_lama['file_dir'];

        $upload_dir = __DIR__ . '/../../file/' . $file_dir_db;
        if (!is_dir($upload_dir)) {
            if (!mkdir($upload_dir, 0777, true)) throw new Exception("Gagal membuat direktori.", 500);
        }
        
        // Buat nama file unik baru dan simpan
        $file_surat_db = 'internal_' . uniqid() . '.pdf';
        $destination = $upload_dir . '/' . $file_surat_db;

        if (!move_uploaded_file($file['tmp_name'], $destination)) {
            throw new Exception("Gagal memindahkan file baru.", 500);
        }
    }

    $sql = "UPDATE rsi_suratinternal SET
                no_surat = :no_surat,
                tgl_surat = :tgl_surat,
                s_surat = :s_surat,
                perihal = :perihal,
                keterangan = :keterangan,
                j_lampiran = :j_lampiran,
                on_create = :on_create,
                on_datetime = NOW()";
    
    // Hanya tambahkan update file_surat ke query jika ada file baru
    if ($file_surat_db) {
        $sql .= ", file_surat = :file_surat";
    }
    $sql .= " WHERE id_surat_int = :id_surat_int";
    
    $stmt = $db->prepare($sql);

    $stmt->bindParam(':no_surat', $_POST['no_surat']);
    $stmt->bindParam(':tgl_surat', $_POST['tgl_surat']);
    $stmt->bindParam(':s_surat', $_POST['s_surat']);
    $stmt->bindParam(':perihal', $_POST['perihal']);
    $stmt->bindParam(':keterangan', $_POST['keterangan']);
    $stmt->bindParam(':j_lampiran', $_POST['j_lampiran']);
    $stmt->bindParam(':on_create', $nama_user);
    $stmt->bindParam(':id_surat_int', $id_surat_int, PDO::PARAM_INT);

    if ($file_surat_db) {
        $stmt->bindParam(':file_surat', $file_surat_db);
    }
    
    $stmt->execute();
    $db->commit();

    http_response_code(200);
    echo json_encode(["message" => "Surat internal berhasil diperbarui."]);

} catch (Exception $e) {
    if(isset($db) && $db->inTransaction()) $db->rollBack();
    $code = $e->getCode() >= 400 ? $e->getCode() : 500;
    http_response_code($code);
    echo json_encode(["message" => "Terjadi kesalahan: " . $e->getMessage()]);
}