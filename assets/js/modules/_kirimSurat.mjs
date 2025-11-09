import { activateSection } from './_navigation.mjs';
import { showFeedback, formatIndonesianDate } from './_utils.mjs';

const token = localStorage.getItem('jwt_token');

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

export function initKirimSuratPage() {
    const form = document.getElementById('form-kirim-surat-ksi');
    if (!form) return;

    // --- LOKASI VARIABEL YANG DIPERBAIKI ---
    const today = new Date().toISOString().split('T')[0];

    const feedbackEl = document.getElementById('feedback-ksi');
    const tglSuratInput = document.getElementById('tgl-surat-ksi');
    const dateDisplay = document.getElementById('date-display-ksi');
    const successModal = document.getElementById('success-modal-ksi');
    const successModalOkBtn = document.getElementById('success-modal-ok-btn-ksi');
    const successModalMessage = document.getElementById('success-modal-message-ksi');
    
    // --- Logika Disederhanakan ---
    if (tglSuratInput && dateDisplay) {
        // 'today' sekarang bisa diakses dari sini
        tglSuratInput.value = today;
        dateDisplay.textContent = formatIndonesianDate(today);

        tglSuratInput.addEventListener('input', () => {
            dateDisplay.textContent = formatIndonesianDate(tglSuratInput.value);
        });
    }

    form.addEventListener('submit', async (e) => {
        e.preventDefault();
        const submitButton = form.querySelector('button[type="submit"]');
        const noSuratInput = document.getElementById('no-surat-ksi');

        if (noSuratInput.value.includes(' ')) {
            showFeedback(feedbackEl, 'Nomor Surat Tidak Boleh ada SPASI.', 'error');
            noSuratInput.focus();
            return;
        }

        const formData = new FormData(form);
        
        submitButton.disabled = true;
        submitButton.innerHTML = `<span class="btn-spinner-ksi"><i class='bx bx-loader-alt'></i></span><span class="btn-text-ksi">Kirim Surat</span>`;
        submitButton.classList.add('loading');
        feedbackEl.style.display = 'none';

        try {
            const response = await fetch('backend/CRUD/api_kirim_surat_internal.php', {
                method: 'POST',
                headers: { 'Authorization': `Bearer ${token}` },
                body: formData
            });

            const result = await response.json();
            if (!response.ok) throw new Error(result.message);

            successModalMessage.textContent = result.message;
            successModal.style.display = 'flex';
            form.reset();
            
            // 'today' sekarang bisa diakses dari sini juga
            tglSuratInput.value = today;
            dateDisplay.textContent = formatIndonesianDate(today);
            
            // renderCalendar(); // <-- Lihat Poin Penyempurnaan di bawah

        } catch (error) {
            showFeedback(feedbackEl, error.message, 'error');
        } finally {
            submitButton.classList.remove('loading');
            submitButton.innerHTML = `<span class="btn-text-ksi">Kirim Surat</span>`;
            submitButton.disabled = false;
        }
    });

    successModalOkBtn?.addEventListener('click', () => {
        successModal.style.display = 'none';
        activateSection('daftar-surat-internal-section');
    });
}