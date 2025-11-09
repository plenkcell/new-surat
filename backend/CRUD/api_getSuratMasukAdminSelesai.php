<?php
// Daftar Surat Masuk (rsi_suratmasuk) yang sudah SELESAI
declare(strict_types=1);

require_once '../config.php';
require_once '../database.php';
require_once '../jwt_check.php';

header('Content-Type: application/json; charset=utf-8');

// === Hak akses ===
$level = $GLOBALS['decoded_user_data']->level ?? '';
if (!in_array($level, ['admin','superadmin'], true)) {
    send_json_error(403, 'Akses ditolak.');
    exit;
}

try {
    $db  = new Database();
    $pdo = $db->getConnection();

    // ===== Params =====
    $page   = max(1, (int)($_GET['page'] ?? 1));
    $limit  = (int)($_GET['entries'] ?? 10);
    $limit  = ($limit < 1 || $limit > 200) ? 10 : $limit;
    $offset = ($page - 1) * $limit;
    $search = trim((string)($_GET['search'] ?? ''));

    // ===== WHERE clause: hanya surat yang SELESAI =====
    $where  = ["s.stts_surat = 'Selesai'"];
    $params = [];

    if ($search !== '') {
        $where[] = "(s.no_surat LIKE :q OR s.pengirim LIKE :q OR s.perihal LIKE :q)";
        $params[':q'] = "%{$search}%";
    }
    $whereSql = 'WHERE ' . implode(' AND ', $where);

    // ===== Hitung total =====
    $sqlCount = "SELECT COUNT(s.id_surat)
                 FROM rsi_suratmasuk s
                 {$whereSql}";
    $stCount = $pdo->prepare($sqlCount);
    foreach ($params as $k => $v) {
        $stCount->bindValue($k, $v, is_int($v) ? PDO::PARAM_INT : PDO::PARAM_STR);
    }
    $stCount->execute();
    $totalRecords = (int)$stCount->fetchColumn();
    $totalPages   = max(1, (int)ceil($totalRecords / $limit));

    // ===== Data surat selesai =====
    $sqlData = "
        SELECT
            s.id_surat AS id_surat_masuk,
            s.no_surat AS nomor_surat,
            s.pengirim,
            s.perihal,
            TRIM(BOTH '/' FROM CONCAT(COALESCE(s.file_dir,''),'/',COALESCE(s.file_surat,''))) AS file_surat,
            CASE
              WHEN s.waktu_slse IS NOT NULL AND s.waktu_slse <> '0000-00-00 00:00:00'
                THEN DATE(s.waktu_slse)
              ELSE COALESCE(s.tgl_surat, s.tgl_terima)
            END AS tgl_surat_selesai,
            'sudah' AS status_disposisi,
            '' AS nama_jenis_surat,
            '' AS nama_prioritas,
            '' AS nama_sifat
        FROM rsi_suratmasuk s
        {$whereSql}
        ORDER BY
            CASE
              WHEN s.waktu_slse IS NOT NULL AND s.waktu_slse <> '0000-00-00 00:00:00'
                THEN DATE(s.waktu_slse)
              ELSE COALESCE(s.tgl_surat, s.tgl_terima)
            END DESC,
            s.id_surat DESC
        LIMIT :limit OFFSET :offset
    ";
    $stData = $pdo->prepare($sqlData);
    foreach ($params as $k => $v) {
        $stData->bindValue($k, $v, is_int($v) ? PDO::PARAM_INT : PDO::PARAM_STR);
    }
    $stData->bindValue(':limit',  $limit,  PDO::PARAM_INT);
    $stData->bindValue(':offset', $offset, PDO::PARAM_INT);
    $stData->execute();

    $rows = $stData->fetchAll(PDO::FETCH_ASSOC);

    // ===== Response =====
    http_response_code(200);
    echo json_encode([
        'status' => 'success',
        'data'   => $rows,
        'pagination' => [
            'currentPage'  => $page,
            'totalPages'   => $totalPages,
            'totalRecords' => $totalRecords
        ]
    ], JSON_UNESCAPED_UNICODE);

} catch (Throwable $e) {
    send_json_error(500, 'Gagal mengambil data: ' . $e->getMessage());
}