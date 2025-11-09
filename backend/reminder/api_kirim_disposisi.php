<?php
// File: backend/reminder/api_kirim_disposisi.php

require_once '../config.php';
require_once '../database.php';
require_once '../jwt_check.php';

try {
    if ($_SERVER['REQUEST_METHOD'] !== 'POST') {
        throw new Exception("Metode permintaan tidak valid.", 405);
    }

    $data = json_decode(file_get_contents("php://input"));
    if (empty($data->id_surat) || empty($data->kd_unit)) {
        throw new Exception("Param id_surat dan kd_unit dibutuhkan.", 400);
    }

    $database = new Database();
    $db = $database->getConnection();

    // Perhatikan: kolom WhatsApp adalah "no_wa" (SAMA dengan DB Anda)
    $sql = "SELECT 
                rsm.no_agenda, 
                ru.nm_unit, 
                rsm.perihal, 
                DATE_FORMAT(rdu.waktu, '%d %M %Y %H:%i') AS ondatetime, 
                rp.no_wa
            FROM rsi_disposisi_unit rdu
                INNER JOIN rsi_suratmasuk rsm ON rdu.id_surat = rsm.id_surat
                INNER JOIN rsi_unit ru ON rdu.kd_unit = ru.kd_unit
                INNER JOIN rsi_user rus ON rdu.kd_unit = rus.kd_unit
                INNER JOIN rsi_pegawai rp ON rus.nip = rp.nip
            WHERE rdu.id_surat = :id_surat AND rdu.kd_unit = :kd_unit 
            LIMIT 1";
    
    $stmt = $db->prepare($sql);
    $stmt->execute([
        ':id_surat' => $data->id_surat,
        ':kd_unit'  => $data->kd_unit
    ]);
    $item = $stmt->fetch(PDO::FETCH_ASSOC);

    if (!$item || empty($item['no_wa'])) {
        throw new Exception("Data/unit/WA tidak ditemukan untuk id_surat/kd_unit yang diberikan.", 404);
    }
    
    $phone = $item['no_wa'] . '@s.whatsapp.net';
    $pesan = "Assalamualaikum wr.wb\n"
           . "Kepada Unit/Bagian {$item['nm_unit']} \nReminder Nomor Agenda {$item['no_agenda']} "
           . ", Ada surat masuk yang belum di disposisi sejak tanggal {$item['ondatetime']}, perihal {$item['perihal']}.\n\n"
           . "Mohon untuk segera di disposisi. Terima kasih, ini adalah pesan otomatis dari E-Surat RSIFC.\nSalam Care\nWassalamualaikum wr.wb";

    $postData = json_encode(["phone" => $phone, "message" => $pesan]);
    $headers = ["Content-Type: application/json"];

    $ch = curl_init();
    curl_setopt($ch, CURLOPT_URL, "http://192.168.10.11:5051/send/message"); 
    curl_setopt($ch, CURLOPT_RETURNTRANSFER, true);
    curl_setopt($ch, CURLOPT_CUSTOMREQUEST, "POST");
    curl_setopt($ch, CURLOPT_POSTFIELDS, $postData);
    curl_setopt($ch, CURLOPT_HTTPHEADER, $headers);
    curl_setopt($ch, CURLOPT_USERPWD, "admin:Pde515123_"); // Ganti password WA API Anda jika perlu!

    $response = curl_exec($ch);
    $httpcode = curl_getinfo($ch, CURLINFO_HTTP_CODE);
    $error = curl_error($ch);
    curl_close($ch);

    if ($httpcode >= 200 && $httpcode < 300) {
        // Log reminder
        $sql2 = "INSERT INTO rsi_wa_remindispos (id_surat, kd_unit, waktu_remin, respon_ws, user_remin)
                 VALUES (:id_surat, :kd_unit, NOW(), :respon_ws, :user_remin)";
        $stmt2 = $db->prepare($sql2);
        $stmt2->execute([
            ':id_surat'   => $data->id_surat,
            ':kd_unit'    => $data->kd_unit,
            ':respon_ws'  => $response,
            ':user_remin' => $GLOBALS['decoded_user_data']->username ?? 'system'
        ]);
        http_response_code(200);
        echo json_encode(['message' => 'Pesan pengingat WA berhasil dikirim ke ' . $item['nm_unit'] . '.']);
    } else {
        throw new Exception("Gagal mengirim pesan WA. Status: " . $httpcode . ". Response: " . $response . ". Error: " . $error);
    }

} catch (Exception $e) {
    $code = $e->getCode() >= 400 ? $e->getCode() : 500;
    http_response_code($code);
    echo json_encode(["message" => "Gagal: " . $e->getMessage()]);
}
?>
