<?php
// Mengatur zona waktu
date_default_timezone_set('Asia/Jakarta');

// Mengatur header umum untuk respons JSON dan CORS
header("Access-Control-Allow-Origin: *");
header("Content-Type: application/json; charset=UTF-8");
header("Access-Control-Allow-Methods: GET, POST, OPTIONS");
header("Access-Control-Max-Age: 3600");
header("Access-Control-Allow-Headers: Content-Type, Authorization, X-Requested-With");