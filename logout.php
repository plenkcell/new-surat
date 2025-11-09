<?php
// Selalu panggil config.php untuk memastikan sesi aktif sebelum dimanipulasi.
require_once 'backend/config.php';

// 1. Hapus semua variabel data di dalam sesi
$_SESSION = [];

// 2. Hancurkan cookie sesi di sisi browser.
// Ini adalah langkah penting untuk memastikan browser "melupakan" sesi tersebut.
if (ini_get("session.use_cookies")) {
    $params = session_get_cookie_params();
    setcookie(session_name(), '', time() - 42000,
        $params["path"], $params["domain"],
        $params["secure"], $params["httponly"]
    );
}

// 3. Hancurkan sesi secara permanen di sisi server.
session_destroy();

// 4. Tambahkan header keamanan untuk mencegah browser menyimpan cache halaman.
// Ini mencegah pengguna menekan tombol "Back" dan melihat halaman yang seharusnya sudah tidak bisa diakses.
header("Cache-Control: no-store, no-cache, must-revalidate, max-age=0");
header("Cache-Control: post-check=0, pre-check=0", false);
header("Pragma: no-cache");
header("Expires: Sat, 26 Jul 1997 05:00:00 GMT"); // Tanggal di masa lalu

// 5. Arahkan pengguna kembali ke halaman login.
// Menambahkan parameter status bisa berguna untuk menampilkan pesan "Anda telah berhasil logout".
header('Location: login.php?status=logout_success');
exit(); // Pastikan tidak ada kode lain yang dieksekusi setelah redirect.