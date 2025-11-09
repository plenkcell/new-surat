<?php
// $id_admin = $user_data->nm_pegawai;
// File: backend/CRUD/api_process_agenda.php
//require_once '../api_headers.php';
require_once '../config.php';
require_once '../database.php';
require_once '../jwt_check.php';

try {
    $user_data = $GLOBALS['decoded_user_data'];
    if ($user_data->level !== 'admin') {
        throw new Exception("Akses ditolak. Hanya admin yang dapat mengelola agenda.", 403);
    }
    
    $id_admin = $user_data->nm_pegawai;

    $database = new Database();
    $db = $database->getConnection();
    $data = json_decode(file_get_contents("php://input"));
    $action = $data->action ?? '';

    switch ($action) {
        case 'create':
            // ### PERBAIKAN: Menghapus 'tanggal_selesai' dari INSERT ###
            $sql = "INSERT INTO agendas (judul, deskripsi, nama_pemohon, tanggal_mulai, jam_mulai, jam_selesai, lokasi, id_admin) 
                    VALUES (:title, :desc, :pemohon, :start, :startTime, :endTime, :location, :id_admin)";
            $stmt = $db->prepare($sql);
            $stmt->execute([
                ':title' => $data->title, ':desc' => $data->desc, ':pemohon' => $data->pemohon,
                ':start' => $data->start, ':startTime' => $data->startTime, ':endTime' => $data->endTime, 
                ':location' => $data->location, ':id_admin' => $id_admin
            ]);
            echo json_encode(['status' => 'success', 'message' => 'Agenda berhasil dibuat.']);
            break;

        case 'update_meta':
            // ### PERBAIKAN: Menghapus 'tanggal_selesai' dari UPDATE ###
            $sql = "UPDATE agendas SET judul = :title, deskripsi = :desc, nama_pemohon = :pemohon, jam_mulai = :startTime, jam_selesai = :endTime, lokasi = :location, tanggal_mulai = :start WHERE id = :id";
            $stmt = $db->prepare($sql);
            $stmt->execute([
                ':title' => $data->title, ':desc' => $data->desc, ':pemohon' => $data->pemohon,
                ':startTime' => $data->startTime, ':endTime' => $data->endTime, ':location' => $data->location,
                ':start' => $data->start,
                ':id' => $data->id
            ]);
            echo json_encode(['status' => 'success', 'message' => 'Detail agenda berhasil diperbarui.']);
            break;

        case 'update_date':
            // ### PERBAIKAN: Menghapus 'tanggal_selesai' dari UPDATE ###
            $sql = "UPDATE agendas SET tanggal_mulai = :start WHERE id = :id";
            $stmt = $db->prepare($sql);
            $stmt->execute([':start' => $data->start, ':id' => $data->id]);
            echo json_encode(['status' => 'success', 'message' => 'Tanggal agenda berhasil dipindahkan.']);
            break;

        case 'delete':
            $sql = "UPDATE agendas SET is_aktif = 0 WHERE id = :id";
            $stmt = $db->prepare($sql);
            $stmt->execute([':id' => $data->id]);
            echo json_encode(['status' => 'success', 'message' => 'Agenda berhasil dihapus.']);
            break;
            
        default:
            throw new Exception("Aksi tidak valid.", 400);
    }
    http_response_code(200);

} catch (Exception $e) {
    http_response_code(500);
    echo json_encode(["message" => "Gagal memproses agenda: " . $e->getMessage()]);
}
?>