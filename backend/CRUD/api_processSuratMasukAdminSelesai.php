<?php
// Aksi: reactivate (ubah ke 'Belum' + reset waktu_slse) & delete (hapus data + file)
declare(strict_types=1);

require_once '../config.php';
require_once '../database.php';
require_once '../jwt_check.php';

header('Content-Type: application/json; charset=utf-8');

$level = $GLOBALS['decoded_user_data']->level ?? '';
if (!in_array($level, ['admin','superadmin'], true)) {
    send_json_error(403, 'Akses ditolak.');
    exit;
}

try {
    $db  = new Database();
    $pdo = $db->getConnection();

    $body   = json_decode(file_get_contents('php://input'), true);
    $action = $body['action'] ?? '';
    $id     = (int)($body['id_surat_masuk'] ?? 0); // dari frontend

    if (!in_array($action, ['reactivate','delete'], true) || $id < 1) {
        send_json_error(400, 'Parameter aksi tidak lengkap atau ID tidak valid.');
        exit;
    }

    if ($action === 'reactivate') {
        $pdo->beginTransaction();

        // Pastikan ada datanya
        $st = $pdo->prepare("SELECT stts_surat FROM rsi_suratmasuk WHERE id_surat = :id FOR UPDATE");
        $st->execute([':id' => $id]);
        $row = $st->fetch(PDO::FETCH_ASSOC);
        if (!$row) {
            $pdo->rollBack();
            send_json_error(400, 'Data tidak ditemukan.');
            exit;
        }

        // Ubah status ke Belum + reset waktu_slse + kosongkan user_slse
        $up = $pdo->prepare("
            UPDATE rsi_suratmasuk
               SET stts_surat = 'Belum',
                   waktu_slse = '0000-00-00 00:00:00',
                   user_slse  = ''
             WHERE id_surat   = :id
        ");
        $up->execute([':id' => $id]);

        $pdo->commit();

        http_response_code(200);
        echo json_encode(['status' => 'success', 'message' => 'Surat berhasil diaktifkan kembali.']);
        exit;
    }

    if ($action === 'delete') {
        $pdo->beginTransaction();

        // Ambil path file
        $st = $pdo->prepare("SELECT file_surat, file_dir FROM rsi_suratmasuk WHERE id_surat = :id FOR UPDATE");
        $st->execute([':id' => $id]);
        $row = $st->fetch(PDO::FETCH_ASSOC);
        if (!$row) {
            $pdo->rollBack();
            send_json_error(400, 'Data tidak ditemukan.');
            exit;
        }

        // Hapus file fisik secara aman
        if (!empty($row['file_surat'])) {
            $base   = realpath(dirname(__DIR__, 2)); // root proyek dari backend/CRUD
            $rel    = trim((string)($row['file_dir'] ?? ''), "/\\");
            $fname  = trim((string)$row['file_surat'], "/\\");
            $target = realpath($base . DIRECTORY_SEPARATOR . ($rel ? $rel . DIRECTORY_SEPARATOR : '') . $fname);
            if ($target !== false && strpos($target, $base) === 0 && is_file($target)) {
                @unlink($target);
            }
        }

        // Hapus rekod utama
        $del = $pdo->prepare("DELETE FROM rsi_suratmasuk WHERE id_surat = :id");
        $del->execute([':id' => $id]);

        $pdo->commit();

        http_response_code(200);
        echo json_encode(['status' => 'success', 'message' => 'Surat berhasil dihapus permanen.']);
        exit;
    }

    // fallback
    send_json_error(400, 'Aksi tidak valid.');

} catch (Throwable $e) {
    if (isset($pdo) && $pdo->inTransaction()) $pdo->rollBack();
    send_json_error(500, 'Gagal memproses: ' . $e->getMessage());
}