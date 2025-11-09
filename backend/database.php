<?php
// Tidak perlu lagi include config.php di sini karena file yang memanggil
// database.php akan sudah menyertakan config.php terlebih dahulu.

class Database {
    private $host = DB_HOST;
    private $db_name = DB_NAME;
    private $username = DB_USER;
    private $password = DB_PASS;
    public $conn;

    public function getConnection() {
        $this->conn = null;
        try {
            $this->conn = new PDO("mysql:host=" . $this->host . ";dbname=" . $this->db_name, $this->username, $this->password);
            $this->conn->setAttribute(PDO::ATTR_ERRMODE, PDO::ERRMODE_EXCEPTION);
            $this->conn->exec("set names utf8mb4");
        } catch(PDOException $exception) {
            // Jangan tampilkan error detail ke user
            // Cukup log error atau tampilkan pesan generik
            error_log("Connection error: " . $exception->getMessage());
            // die("Database connection failed. Please try again later."); // Uncomment untuk production
            die("Connection error: " . $exception->getMessage()); // Untuk development
        }
        return $this->conn;
    }
}