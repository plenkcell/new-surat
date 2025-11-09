<?php
require_once '../config.php';
require_once '../database.php';
require_once '../jwt_check.php';

if (!isset($_GET['id_surat']) || !isset($_GET['id_dispo_unit'])) {
    http_response_code(400);
    echo json_encode(["message" => "Parameter tidak lengkap."]);
    exit();
}

$id_surat = $_GET['id_surat'];
$id_dispo_unit = $_GET['id_dispo_unit'];

try {
    $database = new Database();
    $db = $database->getConnection();
    $db->setAttribute(PDO::ATTR_EMULATE_PREPARES, false);

    $response = [];

    // Query untuk informasi detail surat (tidak berubah)
    $query_surat = "SELECT
                        rsu.id_surat, rsu.no_surat, rsu.no_agenda, rsu.pengirim,
                        DATE_FORMAT(rsu.tgl_terima, '%d %M %Y') AS tgl_terima,
                        rsu.perihal, rsu.on_create, rsu.stts_surat,
                        rve.user_verif, DATE_FORMAT(rve.on_datetime, '%d-%m-%Y %H:%i:%s') AS wkt_verif, rve.keterangan
                    FROM rsi_suratmasuk rsu 
                    INNER JOIN rsi_verif rve ON rsu.id_surat = rve.id_surat
                    WHERE rsu.id_surat = :id_surat";
    $stmt_surat = $db->prepare($query_surat);
    $stmt_surat->bindParam(':id_surat', $id_surat, PDO::PARAM_INT);
    $stmt_surat->execute();
    $response['surat_info'] = $stmt_surat->fetch(PDO::FETCH_ASSOC);

    // MODIFIKASI: Query untuk riwayat disposisi sekarang mengambil data lampiran
    $query_history = "SELECT 
                          rdi.isi_disposisi, rdi.id_surat, rdi.user, rdi.waktu, ru.nm_unit, rdi.is_aktif,
                          rdi.attachment_path, rdi.attachment_name
                      FROM rsi_disposisi_isi rdi 
                      INNER JOIN rsi_unit ru ON rdi.kd_unit = ru.kd_unit 
                      WHERE rdi.id_surat = :id_surat 
                      ORDER BY rdi.waktu ASC";
    $stmt_history = $db->prepare($query_history);
    $stmt_history->bindParam(':id_surat', $id_surat, PDO::PARAM_INT);
    $stmt_history->execute();
    $response['history_disposisi'] = $stmt_history->fetchAll(PDO::FETCH_ASSOC);

    http_response_code(200);
    echo json_encode($response);

} catch (Exception $e) {
    http_response_code(500);
    echo json_encode(["message" => "Gagal mengambil data detail: " . $e->getMessage()]);
}