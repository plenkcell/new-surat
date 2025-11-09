<?php
require_once 'backend/config.php';

if (isset($_SESSION['user'])) {
    header('Location: index.php');
    exit();
}

if (empty($_SESSION['csrf_token'])) {
    $_SESSION['csrf_token'] = bin2hex(random_bytes(32));
}

$error_message = '';
if (isset($_SESSION['error'])) {
    $error_message = $_SESSION['error'];
    unset($_SESSION['error']);
}
?>
<!DOCTYPE html>
<html lang="id">
<head>
    <meta charset="UTF-8">
    <meta name="viewport" content="width=device-width, initial-scale=1.0">
    <title>Login - E-Surat</title>
    
    <link rel="stylesheet" href="assets/css/login.css">
    
    <link rel="stylesheet" href="https://cdnjs.cloudflare.com/ajax/libs/font-awesome/6.5.1/css/all.min.css">
    <link href="https://fonts.googleapis.com/css2?family=Poppins:wght@400;500;600;700&display=swap" rel="stylesheet">
</head>
<body class="login-body">
    <div class="shape shape-1"></div>
    <div class="shape shape-2"></div>
    <div class="login-split-container">
        <div class="login-branding">
            <div class="branding-content">
                <i class="fa-solid fa-envelope-open-text"></i>
                <h1>Selamat Datang di E-SURAT</h1>
                <p>Manajemen persuratan digital terpadu untuk efisiensi dan keamanan data.</p>
            </div>
        </div>
        <div class="login-form-wrapper">
            <div class="login-card">
                <div class="login-logo">
                    <i class="fa-solid fa-hospital-user"></i>
                </div>
                <h2>Login Akun</h2>
                <p class="login-subtitle">Silakan masukkan kredensial Anda.</p>
                
                <p class="login-error-message" style="<?php echo empty($error_message) ? 'display: none;' : ''; ?>"><?php echo htmlspecialchars($error_message, ENT_QUOTES, 'UTF-8'); ?></p>

                <form action="backend/CRUD/api_login.php" method="post" class="login-form">
                    <input type="hidden" name="csrf_token" value="<?php echo htmlspecialchars($_SESSION['csrf_token'], ENT_QUOTES, 'UTF-8'); ?>">

                    <div class="form-group">
                        <i class="fa-solid fa-user form-icon"></i>
                        <input type="text" id="username" name="username" placeholder="Username" required>
                    </div>
                    <div class="form-group">
                        <i class="fa-solid fa-lock form-icon"></i>
                        <input type="password" id="password" name="password" placeholder="Password" required>
                        <i class="fa-regular fa-eye password-toggle-btn" id="togglePassword"></i>
                    </div>
                    <div class="form-options">
                        <label class="remember-me">
                            <input type="checkbox" name="remember"> Ingat Saya
                        </label>
                    </div>
                    <button type="submit" class="login-btn">Login</button>
                </form>
            </div>
        </div>
    </div>

    <script src="assets/js/login.mjs" type="module"></script>
</body>
</html>