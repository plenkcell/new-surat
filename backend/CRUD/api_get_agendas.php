<?php
// File: backend/CRUD/api_get_agendas.php
//require_once '../api_headers.php';
require_once '../config.php';
require_once '../database.php';
require_once '../jwt_check.php';

try {
    $database = new Database();
    $db = $database->getConnection();
    $start_date = $_GET['start'] ?? date('Y-m-01');
    $end_date = $_GET['end'] ?? date('Y-m-t');

    // ### PERBAIKAN: Menghapus 'tanggal_selesai' dari SELECT ###
    $stmt = $db->prepare(
        "SELECT id, judul, deskripsi, nama_pemohon, tanggal_mulai, jam_mulai, jam_selesai, lokasi 
         FROM agendas 
         WHERE is_aktif = 1 AND tanggal_mulai BETWEEN :start AND :end"
    );
    $stmt->bindParam(':start', $start_date);
    $stmt->bindParam(':end', $end_date);
    $stmt->execute();
    $agendas = $stmt->fetchAll(PDO::FETCH_ASSOC);

    $formatted_agendas = [];
    foreach ($agendas as $agenda) {
        $start_datetime = $agenda['tanggal_mulai'] . 'T' . $agenda['jam_mulai'];
        $end_datetime = ($agenda['jam_selesai']) ? $agenda['tanggal_mulai'] . 'T' . $agenda['jam_selesai'] : null;
        
        $hash = crc32($agenda['judul']);
        $hue = $hash % 360;
        
        $formatted_agendas[] = [
            'id' => $agenda['id'],
            'title' => $agenda['judul'],
            'start' => $start_datetime,
            'end' => $end_datetime,
            'backgroundColor' => "hsl($hue, 70%, 60%)",
            'borderColor' => "hsl($hue, 70%, 50%)",
            'textColor' => '#ffffff',
            'extendedProps' => [
                'deskripsi' => $agenda['deskripsi'],
                'pemohon' => $agenda['nama_pemohon'],
                'lokasi' => $agenda['lokasi'],
                'waktu' => substr($agenda['jam_mulai'], 0, 5) . ($agenda['jam_selesai'] ? ' - ' . substr($agenda['jam_selesai'], 0, 5) : '')
            ]
        ];
    }

    http_response_code(200);
    echo json_encode($formatted_agendas);
} catch (Exception $e) {
    http_response_code(500);
    echo json_encode(["message" => "Gagal mengambil data agenda: " . $e->getMessage()]);
}
?>