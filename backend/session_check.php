<?php
// Pastikan file config sudah di-include sebelumnya.
// File ini akan dipanggil di setiap halaman yang butuh login.

// Jika session 'user' tidak ada, berarti belum login
if (!isset($_SESSION['user'])) {
    // Simpan pesan error untuk ditampilkan di halaman login
    $_SESSION['error'] = 'Anda harus login untuk mengakses halaman ini.';
    // Redirect ke halaman login
    header('Location: login.php');
    exit(); // Pastikan script berhenti setelah redirect
}