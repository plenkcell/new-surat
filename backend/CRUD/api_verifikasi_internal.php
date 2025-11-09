<?php
require_once '../config.php';
require_once '../database.php';
require_once '../jwt_check.php';

try {
    if ($_SERVER['REQUEST_METHOD'] !== 'POST') {
        throw new Exception("Metode permintaan tidak valid.", 405);
    }

    if (empty($_POST['id_surat_int']) || empty($_POST['tgl_terima'])) {
        throw new Exception("Data tidak lengkap.", 400);
    }

    // SEKARANG no_agenda juga wajib ada
    if (empty($_POST['id_surat_int']) || empty($_POST['tgl_terima']) || empty($_POST['no_agenda'])) {
        throw new Exception("Data tidak lengkap.", 400);
    }
    
    $user_data = $GLOBALS['decoded_user_data'];
    if ($user_data->level !== 'admin') {
        throw new Exception("Akses ditolak. Hanya untuk admin.", 403);
    }

    $database = new Database();
    $db = $database->getConnection();
    $db->beginTransaction();

    $id_surat_int = $_POST['id_surat_int'];
    $no_agenda_diterima = $_POST['no_agenda']; // Ambil no_agenda dari form
    $nama_verifikator = $user_data->nm_pegawai;

    // 1. Ambil data surat internal yang akan diverifikasi
    $stmt_get = $db->prepare("SELECT * FROM rsi_suratinternal WHERE id_surat_int = :id_surat_int");
    $stmt_get->bindParam(':id_surat_int', $id_surat_int);
    $stmt_get->execute();
    $surat_internal = $stmt_get->fetch(PDO::FETCH_ASSOC);

    if (!$surat_internal) {
        throw new Exception("Surat internal tidak ditemukan.", 404);
    }
    
    // Masukkan data ke tabel rsi_suratmasuk
    $sql_insert = "INSERT INTO rsi_suratmasuk 
        (no_surat, no_agenda, pengirim, tgl_surat, tgl_terima, j_surat, s_surat, krtl, perihal, p_surat, j_lampiran, file_surat, on_datetime, on_create, is_aktif, file_dir, stts_surat)
        VALUES
        (:no_surat, :no_agenda, :pengirim, :tgl_surat, :tgl_terima, 'Internal', :s_surat, :keterangan, :perihal, :p_surat, :j_lampiran, :file_surat, NOW(), :on_create, '1', :file_dir, 'Belum')";
    
    $stmt_insert = $db->prepare($sql_insert);
    $stmt_insert->execute([
        ':no_surat' => $surat_internal['no_surat'],
        ':no_agenda' => $no_agenda_diterima, // Gunakan no_agenda dari form
        ':pengirim' => $surat_internal['kd_unit'],
        ':tgl_surat' => $surat_internal['tgl_surat'],
        ':tgl_terima' => $_POST['tgl_terima'],
        ':s_surat' => $surat_internal['s_surat'],
        ':keterangan' => $surat_internal['keterangan'],
        ':perihal' => $surat_internal['perihal'],
        ':p_surat' => $_POST['p_surat'] ?? 'Biasa (5 Hari)',
        ':j_lampiran' => $surat_internal['j_lampiran'],
        ':file_surat' => $surat_internal['file_surat'],
        ':on_create' => $nama_verifikator,
        ':file_dir' => $surat_internal['file_dir']
    ]);
    
    // Update status surat internal
    $sql_update = "UPDATE rsi_suratinternal SET no_agenda = :no_agenda, is_status = 'Sudah', is_verif = :is_verif, is_datetime = NOW() WHERE id_surat_int = :id_surat_int";
    $stmt_update = $db->prepare($sql_update);
    $stmt_update->execute([
        ':no_agenda' => $no_agenda_diterima, // Gunakan no_agenda dari form
        ':is_verif' => $nama_verifikator,
        ':id_surat_int' => $id_surat_int
    ]);

    $db->commit();
    http_response_code(200);
    echo json_encode(["message" => "Surat berhasil diverifikasi dengan No. Agenda: " . $no_agenda_diterima]);

} catch (Exception $e) {
    if (isset($db) && $db->inTransaction()) $db->rollBack();
    $code = $e->getCode() >= 400 ? $e->getCode() : 500;
    http_response_code($code);
    echo json_encode(["message" => "Terjadi kesalahan: " . $e->getMessage()]);
}
?>