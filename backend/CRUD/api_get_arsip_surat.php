<?php
// File: backend/CRUD/api_get_arsip_surat.php
require_once '../config.php';
require_once '../database.php';
require_once '../jwt_check.php';
//require_once '../api_headers.php';

try {
    $database = new Database();
    $db = $database->getConnection();

    $user_data = $GLOBALS['decoded_user_data'];
    $kd_unit = $user_data->kd_unit;

    // ### PERUBAHAN: Menambahkan rs.j_surat di dalam SELECT ###
    $query = "
        SELECT 
            rs.id_surat, rs.no_surat, rs.no_agenda, rs.pengirim, rs.perihal,
            rs.s_surat, rs.j_lampiran, rs.file_surat, rs.file_dir, rs.krtl,
            rs.user_slse, rs.waktu_slse, rar.disposisi, rs.j_surat,
            DATE_FORMAT(rs.tgl_surat, '%d-%m-%Y') AS tgl_surat_formatted,
            DATE_FORMAT(rs.tgl_terima, '%d-%m-%Y') AS tgl_terima_formatted,
            (SELECT rv.user_verif FROM rsi_verif rv WHERE rv.id_surat = rs.id_surat LIMIT 1) AS verifikator,
            (SELECT GROUP_CONCAT(DISTINCT run_inner.nm_unit SEPARATOR ' || ') 
             FROM rsi_unit run_inner 
             INNER JOIN rsi_arsipkan rar_inner ON run_inner.kd_unit = rar_inner.kd_unit 
             WHERE rar_inner.id_surat = rs.id_surat) AS daftar_arsip
        FROM rsi_suratmasuk rs 
        INNER JOIN rsi_arsipkan rar ON rs.id_surat = rar.id_surat
        WHERE rar.kd_unit = :kd_unit 
          AND rar.aktif = '1' 
          AND rs.stts_surat = 'Selesai' 
        GROUP BY rs.id_surat 
        ORDER BY rs.waktu_slse DESC
    ";

    $stmt = $db->prepare($query);
    $stmt->bindParam(':kd_unit', $kd_unit);
    $stmt->execute();
    $results = $stmt->fetchAll(PDO::FETCH_ASSOC);
    
    // ... (Logika enkripsi file token tidak berubah) ...
    $encryption_key = JWT_SECRET;
    $ciphering = "AES-128-CTR";
    $iv_length = openssl_cipher_iv_length($ciphering);
    foreach ($results as $key => $row) {
        if (!empty($row['file_surat']) && !empty($row['file_dir'])) {
            $path_to_encrypt = 'file/' . $row['file_dir'] . '/' . $row['file_surat'];
            $iv = openssl_random_pseudo_bytes($iv_length);
            $encrypted_path = openssl_encrypt($path_to_encrypt, $ciphering, $encryption_key, 0, $iv);
            $results[$key]['file_token'] = urlencode(base64_encode($iv . $encrypted_path));
        } else {
            $results[$key]['file_token'] = null;
        }
    }

    http_response_code(200);
    echo json_encode($results);

} catch (Exception $e) {
    http_response_code(500);
    echo json_encode(["message" => "Gagal mengambil data arsip: " . $e->getMessage()]);
}
?>