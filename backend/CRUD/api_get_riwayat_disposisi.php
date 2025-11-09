<?php
// File: backend/CRUD/api_get_riwayat_disposisi.php
//require_once dirname(__DIR__) . '/api_headers.php';
require_once dirname(__DIR__) . '/config.php';
require_once dirname(__DIR__) . '/database.php';
require_once dirname(__DIR__) . '/jwt_check.php';

header('Content-Type: application/json');

if (!isset($_GET['no_agenda'])) {
    http_response_code(400);
    echo json_encode(["message" => "Parameter 'no_agenda' tidak lengkap."]);
    exit();
}

$no_agenda = $_GET['no_agenda'];

try {
    $database = new Database();
    $db = $database->getConnection();

    $response = [];

    // 1. Dapatkan informasi utama surat berdasarkan no_agenda
    $query_surat = "SELECT
                        rsu.id_surat, rsu.no_surat, rsu.no_agenda, rsu.pengirim, rsu.perihal
                    FROM rsi_suratmasuk rsu 
                    WHERE rsu.no_agenda = :no_agenda";
    $stmt_surat = $db->prepare($query_surat);
    $stmt_surat->bindParam(':no_agenda', $no_agenda);
    $stmt_surat->execute();
    $surat_info = $stmt_surat->fetch(PDO::FETCH_ASSOC);

    if (!$surat_info) {
        throw new Exception("Surat dengan No. Agenda '$no_agenda' tidak ditemukan.", 404);
    }
    $response['surat_info'] = $surat_info;
    $id_surat = $surat_info['id_surat'];

    // 2. Dapatkan riwayat disposisi berdasarkan id_surat
    $query_history = "SELECT 
                          rdi.isi_disposisi, rdi.user, rdi.waktu, ru.nm_unit
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
    echo json_encode(["message" => "Terjadi kesalahan pada server: " . $e->getMessage()]);
}
?>