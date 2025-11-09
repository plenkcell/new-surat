<?php
require_once '../config.php';
require_once '../database.php';
require_once '../jwt_check.php';
require_once '../../vendor/autoload.php';

$database = new Database();
$db = $database->getConnection();

// PATCH: Generate Agenda Otomatis
if (isset($_GET['action']) && $_GET['action'] === 'generate_no_agenda') {
    $tahun = isset($_GET['tahun']) ? intval($_GET['tahun']) : date('Y');
    $bulan = isset($_GET['bulan']) ? str_pad($_GET['bulan'], 2, '0', STR_PAD_LEFT) : date('m');
    $prefix = "{$tahun}-{$bulan}_";
    $stmt = $db->prepare("SELECT no_agenda FROM rsi_suratmasuk WHERE no_agenda LIKE :prefix ORDER BY no_agenda DESC LIMIT 1");
    $stmt->execute([':prefix' => $prefix . '%']);
    $row = $stmt->fetch(PDO::FETCH_ASSOC);

    $urut = 1;
    if ($row) {
        $last_no_agenda = $row['no_agenda'];
        $last_urut = intval(substr($last_no_agenda, -3));
        $urut = $last_urut + 1;
    }
    do {
        $no_agenda = $prefix . str_pad($urut, 3, '0', STR_PAD_LEFT);
        $stmtCek = $db->prepare("SELECT 1 FROM rsi_suratmasuk WHERE no_agenda=:no_agenda LIMIT 1");
        $stmtCek->execute([':no_agenda' => $no_agenda]);
        $is_exist = $stmtCek->fetchColumn();
        if (!$is_exist) break;
        $urut++;
    } while (true);

    header('Content-Type: application/json');
    echo json_encode(['no_agenda' => $no_agenda]);
    exit;
}

// PATCH: Cek Duplikat Agenda
if (isset($_GET['action']) && $_GET['action'] === 'cek_duplikat_agenda' && isset($_GET['no_agenda'])) {
    $no_agenda = $_GET['no_agenda'];
    $stmtCek = $db->prepare("SELECT COUNT(*) FROM rsi_suratmasuk WHERE no_agenda=:no_agenda");
    $stmtCek->execute([':no_agenda' => $no_agenda]);
    $exists = $stmtCek->fetchColumn() > 0;
    header('Content-Type: application/json');
    echo json_encode(['exists'=>$exists]);
    exit;
}

// ========== PATCH: GET detail disposisi bubble (MODAL CHAT) ==========
if ($_SERVER['REQUEST_METHOD'] === 'GET' && isset($_GET['action']) && $_GET['action'] === 'disposisi_detail' && isset($_GET['id_surat'])) {
    $id = $_GET['id_surat'];
    $sql = "SELECT 
        rdi.isi_disposisi,
        rdi.id_surat,
        rdi.user,
        rdi.attachment_path,
        rdi.attachment_name,
        DATE_FORMAT(rdi.waktu, '%d-%m-%Y %H:%i:%s') AS waktu,
        ru.nm_unit,
        rdi.is_aktif
    FROM rsi_disposisi_isi rdi 
        INNER JOIN rsi_disposisi_unit rdu 
        INNER JOIN rsi_unit ru 
        ON rdi.id_surat=rdu.id_surat 
        AND rdi.kd_unit=ru.kd_unit 
        AND rdu.kd_unit=ru.kd_unit 
    WHERE rdi.id_surat=:id
    GROUP BY rdi.isi_disposisi
    ORDER BY rdi.waktu ASC";
    $stmt = $db->prepare($sql);
    $stmt->execute([':id' => $id]);
    $out = $stmt->fetchAll(PDO::FETCH_ASSOC);
    header('Content-Type: application/json');
    echo json_encode($out);
    exit;
}

// Helper: JWT Properti
function jwtprop($prop, $default = null) {
    if (isset($GLOBALS['decoded_user_data']->$prop)) {
        return $GLOBALS['decoded_user_data']->$prop;
    } elseif (isset($GLOBALS['decoded_user_data']->data) && isset($GLOBALS['decoded_user_data']->data->$prop)) {
        return $GLOBALS['decoded_user_data']->data->$prop;
    } else {
        return $default;
    }
}

// Validasi admin
if (jwtprop('level') !== 'admin') {
    http_response_code(403);
    echo json_encode(["message" => "Akses ditolak. Modul ini hanya untuk admin."]);
    exit;
}

$nip_pengguna = jwtprop('nip');
if (!$nip_pengguna) {
    http_response_code(401);
    echo json_encode(["message" => "Properti 'nip' tidak ditemukan di dalam token otentikasi."]);
    exit;
}

// Patch: Path file
$projectRoot = dirname(__DIR__, 2); // dari /backend/CRUD/ -> root project
$fileStorageRoot = $projectRoot . DIRECTORY_SEPARATOR . 'file' . DIRECTORY_SEPARATOR;

// Helper: Buat file token
function createFileToken($filePath) {
    $ciphering = "AES-128-CTR";
    $iv_length = openssl_cipher_iv_length($ciphering);
    $iv = openssl_random_pseudo_bytes($iv_length);
    $encrypted_path = openssl_encrypt($filePath, $ciphering, JWT_SECRET, 0, $iv);
    return urlencode(base64_encode($iv . $encrypted_path));
}

// CRUD Utama
$method = $_SERVER['REQUEST_METHOD'];
try {
    $stmt_user = $db->prepare("SELECT nm_pegawai FROM rsi_pegawai WHERE nip = :nip");
    $stmt_user->execute([':nip' => $nip_pengguna]);
    $user_info = $stmt_user->fetch(PDO::FETCH_ASSOC);
    if (!$user_info) {
        throw new Exception("Data pegawai untuk pengguna yang login tidak ditemukan.", 404);
    }
    $username = $user_info['nm_pegawai'];

    if ($method === 'GET') {
        $sql = "SELECT
            sm.id_surat, sm.no_agenda, sm.no_surat, sm.pengirim, sm.tgl_surat, sm.tgl_terima,
            sm.perihal, sm.file_surat, sm.file_dir, sm.verifikasi, sm.stts_surat, sm.is_aktif,
            sm.j_surat, sm.s_surat, sm.krtl, sm.p_surat, sm.j_lampiran,
            (SELECT GROUP_CONCAT(CONCAT(ru.nm_unit, ':', rdu.is_balas) SEPARATOR ';')
                FROM rsi_disposisi_unit rdu
                JOIN rsi_unit ru ON rdu.kd_unit = ru.kd_unit
                WHERE rdu.id_surat = sm.id_surat) AS disposisi_summary,
            v.user_verif, v.on_datetime AS waktu_verif
            FROM rsi_suratmasuk sm
            LEFT JOIN rsi_verif v ON sm.id_surat = v.id_surat
            ORDER BY sm.tgl_terima DESC, sm.no_agenda DESC";

        $stmt = $db->prepare($sql);
        $stmt->execute();
        $results = $stmt->fetchAll(PDO::FETCH_ASSOC);

        foreach ($results as &$row) {
            if (!empty($row['file_surat']) && !empty($row['file_dir'])) {
                $filePath = 'file/' . $row['file_dir'] . '/' . $row['file_surat'];
                $relativePath = $fileStorageRoot . $row['file_dir'] . DIRECTORY_SEPARATOR . $row['file_surat'];
                $row['debug_path_checked'] = $relativePath;
                $row['debug_exists'] = file_exists($relativePath) ? 'ADA' : 'TIDAK ADA';
                $row['file_token'] = file_exists($relativePath) ? createFileToken($filePath) : null;
            } else {
                $row['file_token'] = null;
            }
        }
        
        http_response_code(200);
        echo json_encode($results);

    } elseif ($method === 'POST') {
        if (isset($_POST['action'])) {
            $action = $_POST['action'];
            // CREATE/UPDATE surat masuk
            if ($action === 'create' || $action === 'update') {
                $required_fields = [
                    'no_agenda', 'no_surat', 'pengirim', 'tgl_surat', 'tgl_terima',
                    'j_surat', 's_surat', 'krtl', 'perihal', 'p_surat', 'j_lampiran'
                ];
                foreach ($required_fields as $field) {
                    if (empty($_POST[$field])) throw new Exception("Field '$field' tidak boleh kosong.", 400);
                }
                $params = [
                    ':no_agenda'  => $_POST['no_agenda'],
                    ':no_surat'   => $_POST['no_surat'],
                    ':pengirim'   => $_POST['pengirim'],
                    ':tgl_surat'  => $_POST['tgl_surat'],
                    ':tgl_terima' => $_POST['tgl_terima'],
                    ':j_surat'    => $_POST['j_surat'],
                    ':s_surat'    => $_POST['s_surat'],
                    ':krtl'       => $_POST['krtl'],
                    ':perihal'    => $_POST['perihal'],
                    ':p_surat'    => $_POST['p_surat'],
                    ':j_lampiran' => $_POST['j_lampiran'],
                    ':on_create'  => $username,
                ];

                if ($action === 'create') {
                    $cekStmt = $db->prepare("SELECT COUNT(*) FROM rsi_suratmasuk WHERE no_agenda=:no_agenda");
                    $cekStmt->execute([':no_agenda' => $_POST['no_agenda']]);
                    if ($cekStmt->fetchColumn() > 0) {
                        http_response_code(400);
                        echo json_encode(["message" => "Nomor Agenda sudah dipakai oleh surat lain, silakan klik Tambah Surat lagi."]);
                        exit;
                    }
                    if (!isset($_FILES['file_surat']) || $_FILES['file_surat']['error'] !== UPLOAD_ERR_OK)
                        throw new Exception("File surat wajib diunggah.", 400);
                    $ext = strtolower(pathinfo($_FILES['file_surat']['name'], PATHINFO_EXTENSION));
                    $dtstr = date('Ymd_His');
                    $rand = rand(100,999);
                    $newFileName = "surat_" . $dtstr . "_$rand." . $ext;
                    $subDir = date('Ym');
                    $uploadDir = $fileStorageRoot . $subDir . DIRECTORY_SEPARATOR;
                    if (!is_dir($uploadDir)) {
                        if (!mkdir($uploadDir, 0777, true)) throw new Exception("Gagal membuat folder upload!", 500);
                    }
                    $fullDest = $uploadDir . $newFileName;
                    if (!move_uploaded_file($_FILES['file_surat']['tmp_name'], $fullDest)) {
                        throw new Exception("Gagal memindahkan file.", 500);
                    }
                    $params[':file_surat'] = $newFileName;
                    $params[':file_dir'] = $subDir;
                    $sql = "INSERT INTO rsi_suratmasuk
                        (no_agenda, no_surat, pengirim, tgl_surat, tgl_terima, j_surat, s_surat, krtl, perihal, p_surat, j_lampiran, on_create, on_datetime, file_surat, file_dir, is_aktif, stts_surat, verifikasi)
                        VALUES (:no_agenda, :no_surat, :pengirim, :tgl_surat, :tgl_terima, :j_surat, :s_surat, :krtl, :perihal, :p_surat, :j_lampiran, :on_create, NOW(), :file_surat, :file_dir, '1', 'Belum', '0')";
                    $stmt = $db->prepare($sql);
                    $stmt->execute($params);
                    http_response_code(201);
                    echo json_encode(["message" => "Surat masuk berhasil ditambahkan."]);
                } else { // Update
                    if (empty($_POST['id_surat'])) throw new Exception("ID Surat diperlukan.", 400);
                    $id_surat = $_POST['id_surat'];
                    $params[':id_surat'] = $id_surat;
                    $set_clauses = "no_agenda=:no_agenda, no_surat=:no_surat, pengirim=:pengirim, tgl_surat=:tgl_surat, tgl_terima=:tgl_terima, j_surat=:j_surat, s_surat=:s_surat, krtl=:krtl, perihal=:perihal, p_surat=:p_surat, j_lampiran=:j_lampiran, on_create=:on_create, on_datetime=NOW()";
                    if (isset($_FILES['file_surat']) && $_FILES['file_surat']['error'] === UPLOAD_ERR_OK) {
                        $ext = strtolower(pathinfo($_FILES['file_surat']['name'], PATHINFO_EXTENSION));
                        $dtstr = date('Ymd_His');
                        $rand = rand(100,999);
                        $newFileName = "surat_" . $dtstr . "_$rand." . $ext;
                        $subDir = date('Ym');
                        $uploadDir = $fileStorageRoot . $subDir . DIRECTORY_SEPARATOR;
                        if (!is_dir($uploadDir)) {
                            if (!mkdir($uploadDir, 0777, true)) throw new Exception("Gagal membuat folder upload!", 500);
                        }
                        $fullDest = $uploadDir . $newFileName;
                        if (!move_uploaded_file($_FILES['file_surat']['tmp_name'], $fullDest)) {
                            throw new Exception("Gagal memindahkan file.", 500);
                        }
                        $set_clauses .= ", file_surat=:file_surat, file_dir=:file_dir";
                        $params[':file_surat'] = $newFileName;
                        $params[':file_dir']   = $subDir;
                    }
                    $sql = "UPDATE rsi_suratmasuk SET $set_clauses WHERE id_surat=:id_surat";
                    $stmt = $db->prepare($sql);
                    $stmt->execute($params);
                    http_response_code(200);
                    echo json_encode(["message" => "Surat masuk berhasil diperbarui."]);
                }
            }
        } else { // JSON body, fitur lain
            $data = json_decode(file_get_contents("php://input"));
            $action = $data->action ?? '';
            switch ($action) {
                case 'validate':
                    if (empty($data->id_surat)) throw new Exception("ID Surat diperlukan.", 400);
                    $keterangan = $data->keterangan ?? '';
                    $db->beginTransaction();
                    $stmt = $db->prepare("UPDATE rsi_suratmasuk SET verifikasi='1' WHERE id_surat=:id_surat");
                    $stmt->execute([':id_surat' => $data->id_surat]);
                    $stmt = $db->prepare("INSERT INTO rsi_verif (id_surat, user_verif, on_datetime, keterangan)
                        VALUES (:id_surat, :user_verif, NOW(), :keterangan)
                        ON DUPLICATE KEY UPDATE user_verif=:user_verif, on_datetime=NOW(), keterangan=:keterangan");
                    $stmt->execute([
                        ':id_surat' => $data->id_surat,
                        ':user_verif' => $username,
                        ':keterangan' => $keterangan
                    ]);
                    $db->commit();
                    http_response_code(200);
                    echo json_encode(["message" => "Surat berhasil divalidasi."]);
                    break;
                case 'toggle_final':
                    if (empty($data->id_surat)) throw new Exception("ID Surat diperlukan.", 400);
                    $stmt = $db->prepare("SELECT stts_surat FROM rsi_suratmasuk WHERE id_surat=:id_surat");
                    $stmt->execute([':id_surat' => $data->id_surat]);
                    $current_status = $stmt->fetchColumn();
                    if ($current_status === 'Belum') {
                        $sql = "UPDATE rsi_suratmasuk SET stts_surat='Selesai', waktu_slse=NOW(), user_slse=:username WHERE id_surat=:id_surat";
                        $stmt = $db->prepare($sql);
                        $stmt->execute([':username' => $username, ':id_surat' => $data->id_surat]);
                        $message = "Status surat diubah menjadi SELESAI.";
                    } else {
                        $sql = "UPDATE rsi_suratmasuk SET stts_surat='Belum', waktu_slse='0000-00-00 00:00:00', user_slse=NULL WHERE id_surat=:id_surat";
                        $stmt = $db->prepare($sql);
                        $stmt->execute([':id_surat' => $data->id_surat]);
                        $message = "Status SELESAI dibatalkan.";
                    }
                    http_response_code(200);
                    echo json_encode(["message" => $message]);
                    break;
                case 'toggle_active':
                    if (empty($data->id_surat)) throw new Exception("ID Surat diperlukan.", 400);
                    $stmt = $db->prepare("SELECT is_aktif FROM rsi_suratmasuk WHERE id_surat=:id_surat");
                    $stmt->execute([':id_surat' => $data->id_surat]);
                    $new_status = $stmt->fetchColumn() === '1' ? '0' : '1';
                    $stmt = $db->prepare("UPDATE rsi_suratmasuk SET is_aktif=:new_status WHERE id_surat=:id_surat");
                    $stmt->execute([':new_status' => $new_status, ':id_surat' => $data->id_surat]);
                    $message = $new_status === '1' ? "Surat berhasil diaktifkan kembali." : "Surat berhasil dinonaktifkan.";
                    http_response_code(200);
                    echo json_encode(["message" => $message]);
                    break;
                case 'get_disposisi':
                    if (empty($data->id_surat)) throw new Exception("ID Surat diperlukan.", 400);
                    $stmt = $db->prepare("SELECT rdu.kd_unit, ru.nm_unit, rdu.user, rdu.waktu
                        FROM rsi_disposisi_unit rdu
                        JOIN rsi_unit ru ON rdu.kd_unit=ru.kd_unit
                        WHERE rdu.id_surat=:id_surat
                        ORDER BY rdu.waktu DESC");
                    $stmt->execute([':id_surat' => $data->id_surat]);
                    http_response_code(200);
                    echo json_encode($stmt->fetchAll(PDO::FETCH_ASSOC));
                    break;
                case 'add_disposisi':
                    if (empty($data->id_surat) || empty($data->kd_unit)) throw new Exception("ID Surat dan Kode Unit diperlukan.", 400);
                    $stmt = $db->prepare("INSERT INTO rsi_disposisi_unit
                    (id_surat, kd_unit, waktu, user)
                    VALUES (:id_surat, :kd_unit, NOW(), :user)
                    ON DUPLICATE KEY UPDATE waktu=NOW(), user=:user");
                    $stmt->execute([
                        ':id_surat' => $data->id_surat,
                        ':kd_unit' => $data->kd_unit,
                        ':user' => $username
                    ]);
                    http_response_code(201);
                    echo json_encode(["message" => "Disposisi berhasil ditambahkan."]);
                    break;
                case 'delete_disposisi':
                    if (empty($data->id_surat) || empty($data->kd_unit)) throw new Exception("ID Surat dan Kode Unit diperlukan.", 400);
                    $stmt = $db->prepare("DELETE FROM rsi_disposisi_unit WHERE id_surat=:id_surat AND kd_unit=:kd_unit");
                    $stmt->execute([':id_surat' => $data->id_surat, ':kd_unit' => $data->kd_unit]);
                    http_response_code(200);
                    echo json_encode(["message" => "Disposisi berhasil dihapus."]);
                    break;
                case 'get_disposisi_units':
                    if (empty($data->id_surat)) throw new Exception("ID Surat diperlukan.", 400);
                    $sql = "SELECT 
                            ru.kd_unit, ru.nm_unit, rdu.is_balas, rdu.waktu, rdu.id_surat,
                            rdu.user,
                            (
                                SELECT COUNT(*) FROM rsi_wa_remindispos rwr
                                WHERE rwr.id_surat = rdu.id_surat AND rwr.kd_unit = rdu.kd_unit AND rwr.respon_ws REGEXP 'success'
                            ) as remind_count
                        FROM rsi_disposisi_unit rdu
                        INNER JOIN rsi_unit ru ON rdu.kd_unit=ru.kd_unit
                        WHERE rdu.id_surat = :id_surat
                        ORDER BY rdu.waktu ASC";
                    $stmt = $db->prepare($sql);
                    $stmt->execute([':id_surat'=>$data->id_surat]);
                    http_response_code(200);
                    echo json_encode($stmt->fetchAll(PDO::FETCH_ASSOC));
                    break;
                default:
                    throw new Exception("Aksi tidak dikenal.", 400);
            }
        }
    } else {
        throw new Exception("Metode permintaan tidak valid.", 405);
    }

} catch (Exception $e) {
    if ($db->inTransaction()) $db->rollBack();
    $code = $e->getCode() >= 400 && $e->getCode() < 600 ? $e->getCode() : 500;
    http_response_code($code);
    echo json_encode(["message" => "Terjadi Kesalahan: " . $e->getMessage()]);
}
?>