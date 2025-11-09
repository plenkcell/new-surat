const token = localStorage.getItem('jwt_token');

// Fungsi untuk menampilkan pesan feedback di form
function showFeedback(element, message, type) {
    element.textContent = message;
    element.className = `feedback-message ${type}`; // type bisa 'success' atau 'error'
    
    // Sembunyikan pesan setelah 3 detik
    setTimeout(() => {
        element.style.display = 'none';
    }, 3000);
}

async function apiFetch(url, opts = {}) {
    const token = localStorage.getItem('jwt_token');
    opts.headers = opts.headers || {};
    if (!(opts.body instanceof FormData)) opts.headers['Content-Type'] = 'application/json';
    if (token) opts.headers['Authorization'] = `Bearer ${token}`;
    const res = await fetch(url, opts);
    const txt = await res.text();
    let json = null;
    try { json = txt ? JSON.parse(txt) : null; } catch (e) { json = null; }
    
    // Tambahan untuk redirect jika sesi berakhir
    const expireMsg = "Sesi Anda telah berakhir. Silakan login kembali.";
    if (json && json.message && json.message === expireMsg) {
        Swal.fire({
            title: 'Sesi Berakhir',
            text: expireMsg,
            icon: 'warning',
            timer: 1500,
            showConfirmButton: false,
            willClose: () => { window.location.href = 'login.php'; }
        });
        throw new Error(expireMsg);
    }

    if (!res.ok) {
        const msg = (json && json.message) ? json.message : `HTTP ${res.status}: ${txt}`;
        const err = new Error(msg);
        err.raw = json;
        throw err;
    }
    return json;
}

// Fungsi untuk memuat data profil awal
async function loadProfileData() {
    if (!token) return;
    const profileFeedback = document.getElementById('profile-feedback');
    
    try {
        const response = await fetch('backend/CRUD/api_get_profile.php', {
            headers: { 'Authorization': `Bearer ${token}` }
        });
        if (!response.ok) throw new Error('Gagal memuat data profil.');
        
        const data = await response.json();
        document.getElementById('profile-nip').value = data.nip || '';
        document.getElementById('profile-username').value = data.user_login || '';
        document.getElementById('profile-name').value = data.nm_pegawai || '';

    } catch (error) {
        showFeedback(profileFeedback, error.message, 'error');
    }
}

// Fungsi untuk menangani update profil
function handleProfileUpdate() {
    const profileForm = document.getElementById('profile-form');
    const profileFeedback = document.getElementById('profile-feedback');

    if (profileForm) {
        profileForm.addEventListener('submit', async (e) => {
            e.preventDefault();
            const formData = new FormData(profileForm);
            const data = { nm_pegawai: formData.get('nm_pegawai') };
            
            try {
                const response = await fetch('backend/CRUD/api_update_profile.php', {
                    method: 'POST',
                    headers: {
                        'Authorization': `Bearer ${token}`,
                        'Content-Type': 'application/json'
                    },
                    body: JSON.stringify(data)
                });
                const result = await response.json();
                if (!response.ok) throw new Error(result.message);

                showFeedback(profileFeedback, result.message, 'success');
                
                // Perbarui juga nama di header (panggil fungsi dari global scope jika perlu)
                // Untuk sementara, kita reload saja halaman untuk melihat perubahan nama di header
                // Ini bisa dioptimalkan nanti
                window.location.reload(); 

            } catch (error) {
                showFeedback(profileFeedback, error.message, 'error');
            }
        });
    }
}

// Fungsi untuk menangani ganti password
function handleChangePassword() {
    const passwordForm = document.getElementById('password-form');
    const passwordFeedback = document.getElementById('password-feedback');

    if (passwordForm) {
        passwordForm.addEventListener('submit', async (e) => {
            e.preventDefault();
            const formData = new FormData(passwordForm);
            const data = Object.fromEntries(formData.entries());

            try {
                const response = await fetch('backend/CRUD/api_change_password.php', {
                    method: 'POST',
                    headers: {
                        'Authorization': `Bearer ${token}`,
                        'Content-Type': 'application/json'
                    },
                    body: JSON.stringify(data)
                });
                const result = await response.json();
                if (!response.ok) throw new Error(result.message);

                showFeedback(passwordFeedback, result.message, 'success');
                passwordForm.reset();

            } catch (error) {
                showFeedback(passwordFeedback, error.message, 'error');
            }
        });
    }
}

// Fungsi inisialisasi utama untuk modul ini
export function initProfilePage() {
    // Fungsi ini akan dipanggil dari navigation.js saat halaman profil diaktifkan
    // Kita akan memuat data saat pertama kali halaman diaktifkan
    loadProfileData(); 
    handleChangePassword();
    handleProfileUpdate();
}

// Ekspor loadProfileData agar bisa dipanggil dari navigation.js
export { loadProfileData };