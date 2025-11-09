<?php
// File: jwt_test.php

// Set header agar output mudah dibaca
header('Content-Type: text/plain');

// 1. Muat autoloader Composer
require_once __DIR__ . '/vendor/autoload.php';
echo "✅ Composer autoloader berhasil dimuat.\n\n";

// 2. Import class yang dibutuhkan
use Firebase\JWT\JWT;
use Firebase\JWT\Key;

// 3. Definisikan kunci rahasia yang SANGAT SEDERHANA
$secretKey = 'kunci-rahasia-sederhana-untuk-tes';
echo "🔑 Menggunakan Kunci Rahasia: '" . $secretKey . "'\n\n";

// 4. Buat payload sederhana
$payload = [
    'message' => 'Jika ini berhasil, JWT berfungsi.',
    'user_id' => 1,
    'iat' => time(),
    'exp' => time() + 60 // Kedaluwarsa dalam 60 detik
];
echo "📦 Payload yang akan di-encode:\n";
print_r($payload);
echo "\n";

// 5. PROSES ENCODE (MEMBUAT TOKEN)
try {
    $jwt = JWT::encode($payload, $secretKey, 'HS256');
    echo "✅ SUKSES: Token berhasil dibuat.\n";
    echo "Generated Token: " . $jwt . "\n\n";
} catch (Exception $e) {
    echo "❌ GAGAL membuat token.\n";
    echo "Error: " . $e->getMessage() . "\n";
    exit;
}

// 6. PROSES DECODE (MEMVALIDASI TOKEN)
echo "🔍 Mencoba memvalidasi token yang baru saja dibuat...\n";
try {
    $decoded = JWT::decode($jwt, new Key($secretKey, 'HS256'));

    echo "✅ SUKSES: Token berhasil divalidasi.\n\n";
    echo "🎉 Isi Token setelah di-decode:\n";
    print_r($decoded);

} catch (Exception $e) {
    echo "❌ GAGAL memvalidasi token.\n";
    echo "Pesan Error: " . $e->getMessage() . "\n\n";
}