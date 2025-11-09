<?php
// File: backend/CRUD/api_process_pengguna.php
// VERSI DISEMPURNAKAN: Menggunakan user_login sebagai Kunci Unik untuk update dan toggle status.

require_once '../config.php';
require_once '../database.php';
require_once '../jwt_check.php';

// Keamanan: hanya admin
if (!isset($GLOBALS['decoded_user_data']->level) || $GLOBALS['decoded_user_data']->level !== 'admin') {
    http_response_code(403);
    echo json_encode(["message" => "Akses ditolak."]);
    exit;
}

try {
    $database = new Database();
    $db = $database->getConnection();
    $dataRaw = file_get_contents("php://input");
    $data = json_decode($dataRaw ?? '{}');
    $action = $data->action ?? '';

    // 🔒 Password default (tidak terekspos di frontend)
    $DEFAULT_PASS_HASH = '$2y$10$Esu6J0hlpaDNkMRT5MgvHuD8RzKLgeOQDU.XHBBlG5S4x7U2UR1jK';

    switch ($action) {
        case 'create':
            if (empty($data->nip) || empty($data->nm_pegawai) || empty($data->user_login)) {
                http_response_code(400);
                echo json_encode(["message" => "Field wajib (nip, nm_pegawai, user_login) belum lengkap."]);
                exit;
            }

            // Cek user_login duplikat
            $stmt = $db->prepare("SELECT COUNT(*) FROM rsi_user WHERE user_login = :user_login");
            $stmt->execute([':user_login' => $data->user_login]);
            if ((int)$stmt->fetchColumn() > 0) {
                http_response_code(409);
                echo json_encode(["message" => "User login sudah digunakan."]);
                exit;
            }

            $pass_login = $DEFAULT_PASS_HASH;
            $level = $data->level ?? 'user';
            $pelihat = $data->pelihat ?? 'TERBATAS';
            $id_jabatan = isset($data->id_jabatan) ? (int)$data->id_jabatan : 0;
            $kd_unit = $data->kd_unit ?? '';
            $is_aktif = '1';

            $sql = "INSERT INTO rsi_user 
                        (nip, nm_pegawai, user_login, pass_login, level, pelihat, id_jabatan, kd_unit, is_aktif)
                    VALUES 
                        (:nip, :nm_pegawai, :user_login, :pass_login, :level, :pelihat, :id_jabatan, :kd_unit, :is_aktif)";
            $stmt = $db->prepare($sql);
            $stmt->execute([
                ':nip' => $data->nip,
                ':nm_pegawai' => $data->nm_pegawai,
                ':user_login' => $data->user_login,
                ':pass_login' => $pass_login,
                ':level' => $level,
                ':pelihat' => $pelihat,
                ':id_jabatan' => $id_jabatan,
                ':kd_unit' => $kd_unit,
                ':is_aktif' => $is_aktif
            ]);

            http_response_code(201);
            echo json_encode(['message' => 'Pengguna baru berhasil ditambahkan dengan password default.']);
            break;

        case 'update':
            // Menggunakan user_login sebagai kunci WHERE yang unik
            if (empty($data->user_login)) {
                http_response_code(400);
                echo json_encode(["message" => "User login diperlukan untuk update."]);
                exit;
            }

            $updates = [];
            $params = [':user_login' => $data->user_login];

            if (isset($data->level)) { $updates[] = "level = :level"; $params[':level'] = $data->level; }
            if (isset($data->id_jabatan)) { $updates[] = "id_jabatan = :id_jabatan"; $params[':id_jabatan'] = (int)$data->id_jabatan; }
            if (isset($data->kd_unit)) { $updates[] = "kd_unit = :kd_unit"; $params[':kd_unit'] = $data->kd_unit; }
            
            // Selalu reset password ke default setiap kali data diubah
            $updates[] = "pass_login = :pass_login";
            $params[':pass_login'] = $DEFAULT_PASS_HASH;

            if (count($updates) <= 1) { // Hanya ada pass_login
                http_response_code(400);
                echo json_encode(["message" => "Tidak ada field yang diupdate."]);
                exit;
            }

            $sql = "UPDATE rsi_user SET " . implode(', ', $updates) . " WHERE user_login = :user_login";
            $stmt = $db->prepare($sql);
            $stmt->execute($params);

            http_response_code(200);
            echo json_encode(['message' => 'Data pengguna berhasil diperbarui & password direset ke default.']);
            break;

        case 'toggle_status':
            // Logika disederhanakan dan diamankan
            if (empty($data->user_login)) {
                http_response_code(400);
                echo json_encode(["message" => "Parameter user_login diperlukan."]);
                exit;
            }

            // 1. Ambil status saat ini dari DB (lebih aman daripada percaya data dari frontend)
            $stmt = $db->prepare("SELECT is_aktif FROM rsi_user WHERE user_login = :user_login");
            $stmt->execute([':user_login' => $data->user_login]);
            $current_is_aktif = $stmt->fetchColumn();

            if ($current_is_aktif === false) {
                 http_response_code(404);
                 echo json_encode(["message" => "User login '{$data->user_login}' tidak ditemukan."]);
                 exit;
            }

            // 2. Balik statusnya
            $new_status = ($current_is_aktif === '1') ? '0' : '1';
            
            // 3. Update database menggunakan user_login sebagai kunci
            $sql = "UPDATE rsi_user SET is_aktif = :new_status WHERE user_login = :user_login";
            $stmt = $db->prepare($sql);
            $stmt->execute([':new_status' => $new_status, ':user_login' => $data->user_login]);

            $status_text = $new_status === '1' ? 'Aktif' : 'Non-Aktif';
            http_response_code(200);
            echo json_encode(['message' => "Status pengguna '{$data->user_login}' berhasil diubah menjadi {$status_text}."]);
            break;

        case 'check_user_login':
            if (empty($data->user_login)) {
                http_response_code(400);
                echo json_encode(["message" => "Parameter user_login diperlukan."]);
                exit;
            }
            $stmt = $db->prepare("SELECT COUNT(*) FROM rsi_user WHERE user_login = :user_login");
            $stmt->execute([':user_login' => $data->user_login]);
            $exists = ((int)$stmt->fetchColumn() > 0);
            http_response_code(200);
            echo json_encode(['exists' => $exists]);
            break;

        default:
            http_response_code(400);
            echo json_encode(["message" => "Aksi tidak valid."]);
            break;
    }

} catch (PDOException $e) {
    http_response_code(500);
    echo json_encode(["message" => "Database Error: " . $e->getMessage()]);
} catch (Exception $e) {
    http_response_code(500);
    echo json_encode(["message" => "Gagal: " . $e->getMessage()]);
}
?>

