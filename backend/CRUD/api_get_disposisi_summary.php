<?php
require_once '../config.php';
require_once '../database.php';
require_once '../jwt_check.php';

try {
    $database = new Database();
    $db = $database->getConnection();

    // Ambil kd_unit dari token JWT yang sudah divalidasi
    $kd_unit = $GLOBALS['decoded_user_data']->kd_unit;

    $query = "
        SELECT 
            COUNT(CASE WHEN rdu.is_balas = '0' THEN 1 END) AS perlu_dijawab, 
            COUNT(rdu.id) AS total_disposisi
        FROM 
            rsi_disposisi_unit rdu 
        INNER JOIN 
            rsi_suratmasuk rs ON rdu.id_surat = rs.id_surat 
        WHERE 
            rdu.kd_unit = :kd_unit AND rs.stts_surat = 'Belum'
    ";

    $stmt = $db->prepare($query);
    $stmt->bindParam(':kd_unit', $kd_unit, PDO::PARAM_STR);
    $stmt->execute();

    $summary = $stmt->fetch(PDO::FETCH_ASSOC);

    // Hitung jumlah yang sudah dijawab
    $summary['sudah_dijawab'] = $summary['total_disposisi'] - $summary['perlu_dijawab'];

    http_response_code(200);
    echo json_encode($summary);

} catch (Exception $e) {
    http_response_code(500);
    echo json_encode(["message" => "Gagal mengambil data ringkasan: " . $e->getMessage()]);
}