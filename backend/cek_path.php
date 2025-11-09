<?php
// File: e-surat/backend/cek_path.php

// DOCUMENT_ROOT adalah path absolut ke folder root web server Anda (misal: C:/xampp/htdocs)
$document_root = $_SERVER['DOCUMENT_ROOT'];

// Ganti 'e-surat' dengan nama folder proyek Anda jika berbeda
$project_folder = '/e-surat'; 

$base_path = $document_root . $project_folder;

echo "Path absolut ke folder proyek Anda adalah: <br>";
echo "<strong>" . $base_path . "</strong>";

// Anda bisa meng-copy path yang ditampilkan di atas untuk langkah selanjutnya.
?>