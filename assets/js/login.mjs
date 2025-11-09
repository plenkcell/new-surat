document.addEventListener('DOMContentLoaded', function() {
    const loginForm = document.querySelector('form.login-form');
    const togglePassword = document.getElementById('togglePassword');
    const passwordInput = document.getElementById('password');

    // Logika untuk menampilkan/menyembunyikan password
    if (togglePassword && passwordInput) {
        togglePassword.addEventListener('click', function () {
            const type = passwordInput.getAttribute('type') === 'password' ? 'text' : 'password';
            passwordInput.setAttribute('type', type);
            this.classList.toggle('fa-eye');
            this.classList.toggle('fa-eye-slash');
        });
    }

    // Logika untuk submit form login via API
    if (loginForm) {
        loginForm.addEventListener('submit', async function(e) {
            e.preventDefault(); // Mencegah form submit cara lama
            const username = this.username.value;
            const password = this.password.value;
            const errorElement = document.querySelector('.login-error-message');
            const submitButton = this.querySelector('.login-btn');

            // Tampilkan status loading di tombol
            submitButton.disabled = true;
            submitButton.textContent = 'Memproses...';
            if(errorElement) errorElement.style.display = 'none';

            try {
                const response = await fetch('backend/CRUD/api_login.php', {
                    method: 'POST',
                    headers: { 'Content-Type': 'application/json' },
                    body: JSON.stringify({ user_login: username, pass_login: password })
                });

                const result = await response.json();

                if (!response.ok) {
                    throw new Error(result.message || 'Login Gagal. Terjadi kesalahan.');
                }

                // Jika berhasil, simpan token ke localStorage
                localStorage.setItem('jwt_token', result.token);
                
                // Arahkan ke halaman utama
                window.location.href = 'index.php';

            } catch (error) {
                if (errorElement) {
                    errorElement.textContent = error.message;
                    errorElement.style.display = 'block';
                }
                // Kembalikan tombol ke keadaan semula jika error
                submitButton.disabled = false;
                submitButton.textContent = 'Login';
            }
        });
    }
});