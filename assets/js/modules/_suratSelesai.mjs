// File: assets/js/modules/_suratSelesai.mjs
import { openModal as openPdfModal } from './_pdfViewer.mjs';
import { openRiwayatModal } from './_riwayatModal.mjs';

let ssState = {
    allData: [],
    filteredData: [],
    currentPage: 1,
    entriesPerPage: 10,
    searchTerm: '',
};

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

function renderSelesaiPagination(totalEntries, totalPages) {
    const infoEl = document.getElementById('pagination-info-ss');
    const buttonsEl = document.getElementById('pagination-buttons-ss');
    if (!infoEl || !buttonsEl) return;
    if (totalEntries === 0) {
        infoEl.textContent = '';
        buttonsEl.innerHTML = '';
        return;
    }
    const startEntry = (ssState.currentPage - 1) * ssState.entriesPerPage + 1;
    const endEntry = Math.min(startEntry + ssState.entriesPerPage - 1, totalEntries);
    infoEl.textContent = `Menampilkan ${startEntry} sampai ${endEntry} dari ${totalEntries} data`;
    buttonsEl.innerHTML = '';
    const prevButton = document.createElement('button');
    prevButton.innerHTML = '&laquo;';
    prevButton.disabled = ssState.currentPage === 1;
    prevButton.onclick = () => { ssState.currentPage--; renderSelesaiTable(); };
    buttonsEl.appendChild(prevButton);
    for (let i = 1; i <= totalPages; i++) {
        const pageButton = document.createElement('button');
        pageButton.textContent = i;
        if (i === ssState.currentPage) pageButton.classList.add('active');
        pageButton.onclick = () => { ssState.currentPage = i; renderSelesaiTable(); };
        buttonsEl.appendChild(pageButton);
    }
    const nextButton = document.createElement('button');
    nextButton.innerHTML = '&raquo;';
    nextButton.disabled = ssState.currentPage === totalPages;
    nextButton.onclick = () => { ssState.currentPage++; renderSelesaiTable(); };
    buttonsEl.appendChild(nextButton);
}

function renderSelesaiTable() {
    const tableBody = document.getElementById('table-body-ss');
    if (!tableBody) return;
    const searchTerm = ssState.searchTerm.toLowerCase();
    ssState.filteredData = ssState.allData.filter(surat => 
        Object.values(surat).some(val => 
            String(val || '').toLowerCase().includes(searchTerm)
        )
    );
    const totalEntries = ssState.filteredData.length;
    const totalPages = Math.ceil(totalEntries / ssState.entriesPerPage) || 1;
    ssState.currentPage = Math.min(ssState.currentPage, totalPages);
    const paginatedData = ssState.filteredData.slice(
        (ssState.currentPage - 1) * ssState.entriesPerPage,
        ssState.currentPage * ssState.entriesPerPage
    );
    tableBody.innerHTML = '';
    if (paginatedData.length === 0) {
        tableBody.innerHTML = `<tr><td colspan="6" style="text-align:center;">Data tidak ditemukan.</td></tr>`;
    } else {
        paginatedData.forEach(surat => {
            const row = document.createElement('tr');
            const actionButtons = `<a href="#" class="btn-dsi btn-info-dsi" data-action="baca_disposisi" data-no-agenda="${surat.no_agenda}"><i class='bx bx-news'></i> Baca Disposisi</a>`;
            const fileDisplay = surat.file_token ? `<a href="#" class="btn-dsi btn-pdf-dsi" data-action="view_pdf" data-file-token="${surat.file_token}" data-file-name="${surat.file_surat}"><i class='bx bxs-file-pdf'></i> Lihat File</a>` : '<span>Tidak ada file</span>';
            row.innerHTML = `<td data-label="No. Surat & Agenda">${surat.no_surat}<span class="no-surat-detail-dsi">Agenda: ${surat.no_agenda || 'N/A'}</span></td><td data-label="Perihal & File">${surat.perihal}<div class="perihal-detail-dsi">[Sifat: ${surat.s_surat}]<br>${fileDisplay}</div></td><td data-label="Pengirim">${surat.asal_surat}</td><td data-label="Verifikasi">${surat.is_status}<span class="verifikasi-detail-dsi">Oleh: ${surat.is_verif || '-'}</span></td><td data-label="Disposisi & Catatan"><button class="btn-dsi btn-lihat-status-ss" data-action="lihat_status" data-status='${surat.status_disposisi || ''}' data-catatan="${surat.catatan_admin || '-'}"><i class='bx bx-detail'></i> Lihat Detail</button></td><td data-label="Aksi"><div class="action-buttons-dsi">${actionButtons}</div></td>`;
            tableBody.appendChild(row);
        });
    }
    renderSelesaiPagination(totalEntries, totalPages);
}

async function fetchSuratSelesaiData() {
    const spinner = document.getElementById('loading-spinner-ss');
    const tableBody = document.getElementById('table-body-ss');
    const currentToken = localStorage.getItem('jwt_token');
    if (spinner) spinner.style.display = 'block';
    if (tableBody) tableBody.innerHTML = '';
    try {
        const response = await fetch('backend/CRUD/api_get_surat_selesai.php', { headers: { 'Authorization': `Bearer ${currentToken}` } });
        if (!response.ok) throw new Error('Gagal mengambil data dari server.');
        ssState.allData = await response.json();
        renderSelesaiTable();
    } catch (error) {
        console.error("Fetch Surat Selesai Error:", error);
        if(tableBody) tableBody.innerHTML = `<tr><td colspan="6" style="text-align:center; color:var(--error-text);">${error.message}</td></tr>`;
    } finally {
        if (spinner) spinner.style.display = 'none';
    }
}

export function initSuratSelesaiPage() {
    const tableBody = document.getElementById('table-body-ss');
    const searchInput = document.getElementById('search-input-ss');
    const entriesSelect = document.getElementById('entries-select-ss');
    // ### DEKLARASI TOMBOL RESET BARU ###
    const resetBtn = document.getElementById('reset-filter-ss');

    searchInput?.addEventListener('input', () => {
        ssState.searchTerm = searchInput.value;
        ssState.currentPage = 1;
        renderSelesaiTable();
    });

    entriesSelect?.addEventListener('change', () => {
        ssState.entriesPerPage = parseInt(entriesSelect.value, 10);
        ssState.currentPage = 1;
        renderSelesaiTable();
    });

    // ### EVENT LISTENER UNTUK TOMBOL RESET BARU ###
    resetBtn?.addEventListener('click', (e) => {
        e.preventDefault();
        
        // Kembalikan state ke default
        ssState.searchTerm = '';
        ssState.currentPage = 1;
        ssState.entriesPerPage = 10;
        
        // Kembalikan nilai form ke default
        if (searchInput) searchInput.value = '';
        if (entriesSelect) entriesSelect.value = 10;
        
        // Panggil API untuk refresh data
        fetchSuratSelesaiData();
    });

    tableBody?.addEventListener('click', (e) => {
        const button = e.target.closest('.btn-dsi');
        if (!button) return;
        e.preventDefault();
        const action = button.dataset.action;
        
        if (action === 'view_pdf') {
            const pdfModalEl = document.getElementById('pdf-modal');
            const fileToken = button.dataset.fileToken;
            const fileName = button.dataset.fileName;
            const fileUrl = `backend/view_file.php?token=${fileToken}`;
            const title = { title: fileName, token: fileToken };
            openPdfModal(pdfModalEl, fileUrl, title);
        } else if (action === 'baca_disposisi') {
            const noAgenda = button.dataset.noAgenda;
            const surat = ssState.allData.find(s => s.no_agenda == noAgenda);
            if (surat) {
                openRiwayatModal(surat);
            }
        } 
        else if (action === 'lihat_status') {
            const statusModal = document.getElementById('status-modal-ss');
            const modalBody = statusModal.querySelector('.modal-body-status');
            const statusData = button.dataset.status;
            const catatanData = button.dataset.catatan;

            let statusHTML = '<h4>Status Disposisi:</h4>';
            if (statusData) {
                statusHTML += '<div class="status-list-dispo1">';
                statusData.split(' | ').forEach(s => {
                    const [unit, status] = s.split(' = ');
                    const statusClass = status === 'Sudah' ? 'status-sudah-text-dispo1' : 'status-belum-text-dispo1';
                    statusHTML += `<div class="status-item-dispo1"><span class="unit-name-dispo1">${unit}:</span> <span class="${statusClass}">${status}</span></div>`;
                });
                statusHTML += '</div>';
            } else {
                statusHTML += '<p>Belum ada status disposisi.</p>';
            }

            let catatanHTML = `<h4 style="margin-top: 20px;">Catatan Admin:</h4><p>${catatanData}</p>`;
            
            modalBody.innerHTML = statusHTML + catatanHTML;
            statusModal.style.display = 'flex';

            const closeModalBtn = statusModal.querySelector('.modal-close-status');
            closeModalBtn.onclick = () => { statusModal.style.display = 'none'; };
        }
    });
    
    fetchSuratSelesaiData();
}