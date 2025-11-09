const detailModal = document.getElementById('detail-list-modal');
const modalTitle = document.getElementById('detail-list-title');
const modalBody = document.getElementById('detail-list-body');
const closeModalBtn = detailModal?.querySelector('.modal-close-status');

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

export function openDetailListModal(title, dataString, separator = '||') {
    if (!detailModal) return;
    modalTitle.textContent = title;
    if (!dataString || dataString.trim() === '' || dataString === 'null') {
        modalBody.innerHTML = '<p style="text-align:center;">Tidak ada detail untuk ditampilkan.</p>';
    } else {
        const items = dataString.split(separator);
        let listHTML = '<div class="status-list-dispo1">';
        items.forEach(item => {
            const parts = item.split('=');
            const unit = parts[0]?.trim() || '';
            const status = parts[1]?.trim() || '';
            const statusClass = status.includes('Disposisi') ? 'status-sudah-text-dispo1' : '';
            listHTML += `<div class="status-item-dispo1"><span class="unit-name-dispo1">${unit}:</span> <span class="${statusClass}">${status}</span></div>`;
        });
        listHTML += '</div>';
        modalBody.innerHTML = listHTML;
    }
    detailModal.style.display = 'flex';
}

export function initDetailListModal() {
    closeModalBtn?.addEventListener('click', () => {
        if(detailModal) detailModal.style.display = 'none';
    });
}