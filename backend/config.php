<?php
if (session_status() === PHP_SESSION_NONE) {
    session_start();
}

// Muat autoloader Composer
require_once __DIR__ . '/../vendor/autoload.php';

// Muat variabel environment dari file .env
$dotenv = Dotenv\Dotenv::createImmutable(__DIR__ . '/../');
$dotenv->load();

// Definisikan konstanta dari .env
define('DB_HOST', $_ENV['DB_HOST']);
define('DB_NAME', $_ENV['DB_NAME']);
define('DB_USER', $_ENV['DB_USER']);
define('DB_PASS', $_ENV['DB_PASS']);

// MODIFIKASI FINAL: Membersihkan nilai JWT_SECRET dari spasi
define('JWT_SECRET', trim($_ENV['JWT_SECRET']));

// Set zona waktu default
date_default_timezone_set('Asia/Jakarta');