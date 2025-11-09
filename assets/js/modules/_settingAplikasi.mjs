// File: assets/js/modules/_settingAplikasi.mjs
// Modul baru untuk mengelola halaman Setting Aplikasi.

const API_URL = 'backend/CRUD/api_setting.php';

// Fungsi notifikasi standar
function swSuccess(msg) {
    Swal.fire({ icon: 'success', title: 'Berhasil', text: msg, timer: 1500, showConfirmButton: false });
}
function swError(msg) {
    Swal.fire({ icon: 'error', title: 'Gagal', text: msg });
}
function swConfirm(text) {
    return Swal.fire({ title: 'Konfirmasi', text, icon: 'warning', showCancelButton: true, confirmButtonText: 'Ya, Simpan', cancelButtonText: 'Batal' });
}

// Fungsi Fetch API standar
async function apiFetch(url, opts = {}) {
    const token = localStorage.getItem('jwt_token');
    opts.headers = opts.headers || {};
    // Tidak set Content-Type untuk FormData, browser akan menanganinya
    if (!(opts.body instanceof FormData)) {
        opts.headers['Content-Type'] = 'application/json';
    }
    if (token) opts.headers['Authorization'] = `Bearer ${token}`;

    const res = await fetch(url, opts);
    const txt = await res.text();
    let json = null;
    try { json = txt ? JSON.parse(txt) : null; } catch (e) { json = null; }

    if (!res.ok) {
        const msg = (json && json.message) ? json.message : `HTTP ${res.status}`;
        const err = new Error(msg);
        err.raw = json;
        throw err;
    }
    return json;
}

// Fungsi utama inisialisasi modul
export function initSettingAplikasiPage() {
    if (document.readyState === 'loading') {
        document.addEventListener('DOMContentLoaded', initSettingAplikasiPage);
        return;
    }

    const section = document.getElementById('setting-aplikasi-section');
    if (!section) return;

    // Elemen DOM
    const form = document.getElementById('setting-form');
    const skeleton = document.getElementById('setting-skeleton-loader');
    const inpLembaga = document.getElementById('setting-lembaga');
    const inpAlamat = document.getElementById('setting-alamat');
    const inpKota = document.getElementById('setting-kota');
    const inpTelp = document.getElementById('setting-telp');
    const logoPreview = document.getElementById('setting-logo-preview');
    const logoUpload = document.getElementById('setting-logo-upload');
    const submitBtn = form.querySelector('button[type="submit"]');

    // Fungsi untuk mengambil data dan mengisi form
    async function loadSettings() {
        try {
            const data = await apiFetch(API_URL);
            inpLembaga.value = data.lembaga || '';
            inpAlamat.value = data.alamat || '';
            inpKota.value = data.kota || '';
            inpTelp.value = data.telpon || '';
            logoPreview.src = data.foto_url || 'assets/images/placeholder.png';
            
            // Tampilkan form setelah data dimuat
            skeleton.style.display = 'none';
            form.style.display = 'grid';
        } catch (err) {
            console.error("Gagal memuat setting:", err);
            swError(err.message || 'Gagal memuat data setting dari server.');
            skeleton.innerHTML = '<p style="color:red; text-align:center;">Gagal memuat data.</p>';
        }
    }

    // Live preview untuk gambar yang di-upload
    logoUpload.addEventListener('change', (e) => {
        const file = e.target.files[0];
        if (!file) return;

        // Validasi frontend untuk UX yang lebih baik
        if (file.size > 1048576) { // 1MB
            swError('Ukuran file tidak boleh melebihi 1MB.');
            e.target.value = ''; // Reset input file
            return;
        }
        if (!['image/png', 'image/jpeg'].includes(file.type)) {
            swError('Tipe file harus .png atau .jpg/.jpeg.');
            e.target.value = ''; // Reset input file
            return;
        }

        const reader = new FileReader();
        reader.onload = (event) => {
            logoPreview.src = event.target.result;
        };
        reader.readAsDataURL(file);
    });

    // Handler untuk submit form
    form.addEventListener('submit', async (e) => {
        e.preventDefault();
        
        const conf = await swConfirm('Anda yakin ingin menyimpan perubahan pada setting aplikasi?');
        if (!conf.isConfirmed) return;

        submitBtn.disabled = true;
        submitBtn.innerHTML = "<i class='bx bx-loader-alt bx-spin'></i> Menyimpan...";

        const formData = new FormData(form);
        // Kita tidak perlu menambahkan action, karena metode POST sudah cukup

        try {
            const res = await apiFetch(API_URL, {
                method: 'POST',
                body: formData
            });
            swSuccess(res.message || 'Setting berhasil disimpan.');
            // Muat ulang data untuk menampilkan gambar baru dari server (jika ada perubahan)
            await loadSettings(); 
        } catch (err) {
            console.error("Gagal menyimpan setting:", err);
            swError(err.message || 'Terjadi kesalahan saat menyimpan data.');
        } finally {
            submitBtn.disabled = false;
            submitBtn.innerHTML = "<i class='bx bx-save'></i> Simpan Perubahan";
        }
    });


    // Observer untuk memuat data saat section menjadi aktif
    let loadedOnce = false;
    const sectionObserver = new MutationObserver((muts) => {
        if (loadedOnce) return;
        if (muts.some(m => m.attributeName === 'class' && section.classList.contains('active'))) {
            loadedOnce = true;
            loadSettings();
        }
    });
    sectionObserver.observe(section, { attributes: true });

    // Langsung muat jika sudah aktif
    if (section.classList.contains('active')) {
        loadedOnce = true;
        loadSettings();
    }
}