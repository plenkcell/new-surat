<?php
require_once '../config.php';
require_once '../database.php';
require_once '../jwt_check.php';

try {
    $database = new Database();
    $db = $database->getConnection();

    $query = "SELECT judul_artikel, isi_artikel FROM artikel_app WHERE is_aktif = '1' ORDER BY id_artikel";
    
    $stmt = $db->prepare($query);
    $stmt->execute();

    $articles = $stmt->fetchAll(PDO::FETCH_ASSOC);

    http_response_code(200);
    echo json_encode($articles);

} catch (Exception $e) {
    http_response_code(500);
    echo json_encode(["message" => "Gagal mengambil data artikel: " . $e->getMessage()]);
}