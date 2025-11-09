<?php
// File: backend/CRUD/api_process_unit.php
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
    $kd_unit = $data->kd_unit ?? '';
    $nm_unit = $data->nm_unit ?? '';

    switch ($action) {
        case 'create':
            if (empty($kd_unit) || empty($nm_unit)) throw new Exception("Kode dan Nama Unit tidak boleh kosong.");
            $sql = "INSERT INTO rsi_unit (kd_unit, nm_unit) VALUES (:kd_unit, :nm_unit)";
            $stmt = $db->prepare($sql);
            $stmt->execute([':kd_unit' => $kd_unit, ':nm_unit' => $nm_unit]);
            echo json_encode(['message' => 'Unit baru berhasil ditambahkan.']);
            break;

        case 'update':
            if (empty($kd_unit) || empty($nm_unit)) throw new Exception("Kode dan Nama Unit tidak boleh kosong.");
            $sql = "UPDATE rsi_unit SET nm_unit = :nm_unit WHERE kd_unit = :kd_unit";
            $stmt = $db->prepare($sql);
            $stmt->execute([':nm_unit' => $nm_unit, ':kd_unit' => $kd_unit]);
            echo json_encode(['message' => 'Data unit berhasil diperbarui.']);
            break;
        
        default:
            throw new Exception("Aksi tidak valid.", 400);
    }
    http_response_code(200);

} catch (Exception $e) {
    send_json_error(500, "Gagal memproses data unit: " . $e->getMessage());
}
?>