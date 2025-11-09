<?php
require_once '../config.php';
require_once '../database.php';
require_once '../jwt_check.php';

try {
    if ($_SERVER['REQUEST_METHOD'] !== 'POST') {
        throw new Exception("Metode permintaan tidak valid.", 405);
    }

    $data = json_decode(file_get_contents("php://input"));
    if (empty($data->id_surat_int)) {
        throw new Exception("ID Surat tidak boleh kosong.", 400);
    }
    
    $database = new Database();
    $db = $database->getConnection();
    $db->beginTransaction();

    $id_surat_int = $data->id_surat_int;

    // --- LOGIKA VALIDASI & PERUBAHAN no_surat ---
    $stmt_check = $db->prepare("SELECT kd_unit, is_status FROM rsi_suratinternal WHERE id_surat_int = :id_surat_int");
    $stmt_check->bindParam(':id_surat_int', $id_surat_int);
    $stmt_check->execute();
    $surat = $stmt_check->fetch(PDO::FETCH_ASSOC);

    if (!$surat) {
        throw new Exception("Surat tidak ditemukan.", 404);
    }
    if ($surat['is_status'] === 'Sudah') {
        throw new Exception("Maaf, Status Surat Internal Anda sudah di Verifikasi Oleh Admin", 409);
    }

    // Buat format no_surat baru: NON_KODEUNIT_TIMESTAMP
    $kd_unit = $surat['kd_unit'];
    $timestamp = time(); // Unix Timestamp untuk keunikan
    $new_no_surat = "NON_" . $kd_unit . "_" . $timestamp;
    // --- AKHIR DARI LOGIKA BARU ---

    // Query utama: nonaktifkan dan ganti no_surat
    $sql = "UPDATE rsi_suratinternal SET 
                is_aktif = '0',
                no_surat = :new_no_surat
            WHERE id_surat_int = :id_surat_int";
            
    $stmt = $db->prepare($sql);
    $stmt->bindParam(':new_no_surat', $new_no_surat);
    $stmt->bindParam(':id_surat_int', $id_surat_int, PDO::PARAM_INT);
    $stmt->execute();

    $db->commit();

    http_response_code(200);
    echo json_encode(["message" => "Surat berhasil dinonaktifkan."]);

} catch (Exception $e) {
    if (isset($db) && $db->inTransaction()) $db->rollBack();
    $code = $e->getCode() >= 400 ? $e->getCode() : 500;
    http_response_code($code);
    echo json_encode(["message" => $e->getMessage()]);
}
?>