<?php
// File: backend/CRUD/api_process_pegawai.php
//require_once '../api_headers.php';
require_once '../config.php';
require_once '../database.php';
require_once '../jwt_check.php';

// Keamanan: Hanya admin yang bisa memproses data ini
if ($GLOBALS['decoded_user_data']->level !== 'admin') {
    send_json_error(403, "Akses ditolak.");
}

try {
    $database = new Database();
    $db = $database->getConnection();
    $data = json_decode(file_get_contents("php://input"));

    $action = $data->action ?? '';

    switch ($action) {
        case 'create':
            // Logika untuk tambah pegawai baru
            $sql = "INSERT INTO rsi_pegawai (nip, nm_pegawai, tgl_lahir, email, no_wa, is_aktif) VALUES (:nip, :nm_pegawai, :tgl_lahir, :email, :no_wa, 'Aktif')";
            $stmt = $db->prepare($sql);
            $stmt->execute([
                ':nip' => $data->nip,
                ':nm_pegawai' => $data->nm_pegawai,
                ':tgl_lahir' => $data->tgl_lahir,
                ':email' => $data->email,
                ':no_wa' => $data->no_wa
            ]);
            echo json_encode(['message' => 'Pegawai baru berhasil ditambahkan.']);
            break;

        case 'update':
            // Logika untuk ubah data pegawai
            $sql = "UPDATE rsi_pegawai SET nm_pegawai = :nm_pegawai, tgl_lahir = :tgl_lahir, email = :email, no_wa = :no_wa WHERE nip = :nip";
            $stmt = $db->prepare($sql);
            $stmt->execute([
                ':nm_pegawai' => $data->nm_pegawai,
                ':tgl_lahir' => $data->tgl_lahir,
                ':email' => $data->email,
                ':no_wa' => $data->no_wa,
                ':nip' => $data->nip
            ]);
            echo json_encode(['message' => 'Data pegawai berhasil diperbarui.']);
            break;

        case 'toggle_status':
            // Logika untuk aktif/non-aktif pegawai
            $current_status = $data->current_status;
            $new_status = ($current_status === 'Aktif') ? 'Non_Aktif' : 'Aktif';
            
            $sql = "UPDATE rsi_pegawai SET is_aktif = :new_status WHERE nip = :nip";
            $stmt = $db->prepare($sql);
            $stmt->execute([':new_status' => $new_status, ':nip' => $data->nip]);
            echo json_encode(['message' => "Status pegawai berhasil diubah menjadi {$new_status}."]);
            break;
        
        default:
            throw new Exception("Aksi tidak valid.", 400);
    }
    http_response_code(200);

} catch (Exception $e) {
    send_json_error(500, "Gagal memproses data pegawai: " . $e->getMessage());
}
?>