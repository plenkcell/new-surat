// File ini berisi fungsi-fungsi utilitas yang bisa digunakan di banyak modul lain.
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

export function showFeedback(element, message, type) {
    if (!element) return;
    element.textContent = message;
    element.className = `feedback-message ${type}`;
    element.style.display = 'block';
    // Sembunyikan pesan setelah 5 detik
    setTimeout(() => {
        element.style.display = 'none';
        element.textContent = '';
        element.className = 'feedback-message';
    }, 5000);
}

export function formatIndonesianDate(dateString) {
    if (!dateString) return "Pilih tanggal...";
    const date = new Date(dateString + 'T00:00:00');
    const options = { weekday: 'long', year: 'numeric', month: 'long', day: 'numeric' };
    return new Intl.DateTimeFormat('id-ID', options).format(date);
}