<?php
// Contoh: Tes path mapping network
$networkPath = '\\\\192.168.9.12\esurat\file';
$testSubPath = '\test.pdf'; // ganti dengan sub-folder/file test kamu, atau kosongkan

$targetPath = $networkPath . $testSubPath;

// Cek ada atau tidak
echo "<b>Testing: $targetPath</b><br>\n";

if (file_exists($targetPath)) {
    echo "<span style='color:green'>file_exists: OK</span><br>\n";
    echo "Permission: ";
    echo is_readable($targetPath) ? "readable, " : "unreadable, ";
    echo is_writable($targetPath) ? "writable<br>" : "unwritable<br>";
    // Jika folder, coba scan isi:
    if (is_dir($targetPath)) {
        echo "Isi folder:<br><pre>";
        print_r(scandir($targetPath));
        echo "</pre>";
    }
} else {
    echo "<span style='color:red'>file_exists: TIDAK BISA DIAKSES!</span><br>\n";
    // Coba debug permission dan user
    echo 'Script dijalankan oleh user: <b>' . get_current_user() . "</b><br>\n";
    echo 'Safe mode: '. (ini_get('safe_mode') ? 'ON' : 'OFF') . "<br>\n";
    if (function_exists('posix_getpwuid')) {
        $a = posix_getpwuid(posix_geteuid());
        echo "Username (posix): ".print_r($a,1)."<br/>";
    }
}
?>
