<?php
// File: backend/CRUD/debug_agenda_api.php

// Mengaktifkan tampilan error secara paksa, ini adalah kunci utama
ini_set('display_errors', 1);
ini_set('display_startup_errors', 1);
error_reporting(E_ALL);

// Set header agar outputnya mudah dibaca di browser
header('Content-Type: application/json');

// Kerangka output untuk laporan hasil tes
$output = [
    'status' => 'OK',
    'tests' => [],
    'error' => null,
    'error_details' => null,
    'final_data' => null
];

// Fungsi bantuan untuk mencatat hasil setiap langkah tes
function add_test_result($name, $success, $message = '') {
    global $output;
    $output['tests'][] = [
        'name' => $name,
        'status' => $success ? 'SUCCESS' : 'FAILED',
        'message' => $message
    ];
    if (!$success && is_null($output['error'])) {
        $output['status'] = 'FAILED';
        $output['error'] = "Test failed at: $name";
    }
}

try {
    // Test 2: Memuat file config.php
    if (file_exists(dirname(__DIR__) . '/config.php')) {
        require_once dirname(__DIR__) . '/config.php';
        add_test_result('Load config.php', true);
    } else { throw new Exception('config.php not found.'); }

    // Test 3: Memuat file database.php
    if (file_exists(dirname(__DIR__) . '/database.php')) {
        require_once dirname(__DIR__) . '/database.php';
        add_test_result('Load database.php', true);
    } else { throw new Exception('database.php not found.'); }
    
    // Test 4: Koneksi ke Database
    $database = new Database();
    $db = $database->getConnection();
    if ($db) {
        add_test_result('Database Connection', true, 'Successfully connected to database.');
    } else { throw new Exception('Failed to get database connection.'); }
    
    // Test 5: Eksekusi Query untuk mengambil data agenda
    $start_date = $_GET['start'] ?? date('Y-m-01');
    $end_date = $_GET['end'] ?? date('Y-m-t');
    
    $query = "SELECT id, judul, deskripsi, nama_pemohon, tanggal_mulai, tanggal_selesai, jam_mulai, jam_selesai, lokasi 
              FROM agendas 
              WHERE is_aktif = 1 AND tanggal_mulai BETWEEN :start AND :end";
    
    $stmt = $db->prepare($query);
    $stmt->bindParam(':start', $start_date);
    $stmt->bindParam(':end', $end_date);
    
    if ($stmt->execute()) {
        $agendas = $stmt->fetchAll(PDO::FETCH_ASSOC);
        add_test_result('Execute Agenda Query', true, 'Query executed successfully. Found ' . count($agendas) . ' result(s).');
        $output['final_data'] = $agendas; // Simpan data hasil query
    } else {
        // Jika query gagal, tangkap dan tampilkan error SQL yang spesifik
        throw new Exception('Agenda query failed to execute: ' . implode(" ", $stmt->errorInfo()));
    }

} catch (Throwable $e) {
    // Jika ada error di langkah mana pun, catat di sini
    add_test_result('Overall Process', false, $e->getMessage());
    $output['error_details'] = $e->getTraceAsString();
}

// Tampilkan laporan hasil tes dalam format JSON yang mudah dibaca
echo json_encode($output, JSON_PRETTY_PRINT);
?>