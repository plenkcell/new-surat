<?php
require_once '../config.php';
require_once '../database.php';
require_once '../jwt_check.php';

try {
    $database = new Database();
    $db = $database->getConnection();

    $user_data = $GLOBALS['decoded_user_data'];
    $kd_unit = $user_data->kd_unit;
    $level = $user_data->level;

    // ### QUERY DENGAN SUB-QUERY YANG SUDAH DIPERBAIKI TOTAL ###
    $sql = "
        SELECT
            rsi.id_surat_int, rsi.no_surat, rsi.no_agenda,
            run.nm_unit AS asal_surat, rsi.perihal, rsi.s_surat,
            rsi.j_lampiran, rsi.file_surat, rsi.file_dir,
            rsi.keterangan, rsi.on_create, rsi.on_datetime,
            rsi.is_status, rsi.is_verif, rsi.is_datetime, rsi.is_aktif,
            
            -- Sub-query untuk mengambil status disposisi (jika ada)
            (SELECT 
                GROUP_CONCAT(DISTINCT ru_inner.nm_unit, ' = ', IF(rdu_inner.is_balas='1','Sudah','Belum') SEPARATOR ' | ') 
             FROM rsi_disposisi_unit rdu_inner
             INNER JOIN rsi_unit ru_inner ON rdu_inner.kd_unit = ru_inner.kd_unit
             INNER JOIN rsi_suratmasuk rsm_inner ON rdu_inner.id_surat = rsm_inner.id_surat
             WHERE rsm_inner.no_agenda = rsi.no_agenda
            ) AS status_disposisi,
            
            -- Sub-query untuk mengambil catatan admin terbaru (INI YANG SEBELUMNYA HILANG)
            (SELECT 
                cti.catatan 
             FROM rsi_catatinternal cti 
             WHERE cti.id_surat_int = rsi.id_surat_int 
             ORDER BY cti.waktu_dibuat DESC LIMIT 1
            ) AS catatan_admin

        FROM rsi_suratinternal rsi
        LEFT JOIN rsi_unit run ON rsi.kd_unit = run.kd_unit
        WHERE rsi.stts_surat = 'Belum' 
    ";
    // Klausa 'is_aktif' sengaja dihilangkan dari sini agar datanya bisa difilter di JavaScript

    if ($level == "user" || $level == "direktur") {
        $sql .= " AND rsi.kd_unit = :kd_unit ORDER BY rsi.id_surat_int DESC";
        $stmt = $db->prepare($sql);
        $stmt->bindParam(':kd_unit', $kd_unit, PDO::PARAM_STR);
    } else { // Admin
        $sql .= " ORDER BY rsi.on_datetime ASC";
        $stmt = $db->prepare($sql);
    }

    $stmt->execute();
    $results = $stmt->fetchAll(PDO::FETCH_ASSOC);

    // Logika enkripsi token file (tidak berubah)
    $encryption_key = JWT_SECRET;
    $ciphering = "AES-128-CTR";
    $iv_length = openssl_cipher_iv_length($ciphering);
    
    foreach ($results as $key => $row) {
        if (!empty($row['file_dir']) && !empty($row['file_surat'])) {
            $path_to_encrypt = 'file/' . $row['file_dir'] . '/' . $row['file_surat'];
            $iv = openssl_random_pseudo_bytes($iv_length);
            $encrypted_path = openssl_encrypt($path_to_encrypt, $ciphering, $encryption_key, 0, $iv);
            $token = base64_encode($iv . $encrypted_path);
            $results[$key]['file_token'] = urlencode($token);
        } else {
            $results[$key]['file_token'] = null;
        }
    }

    http_response_code(200);
    echo json_encode($results);

} catch (Exception $e) {
    http_response_code(500);
    echo json_encode(["message" => "Gagal mengambil data surat internal: " . $e->getMessage()]);
}
?>