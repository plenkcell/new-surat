import { openModal } from './_pdfViewer.mjs';
import { openJawabModal } from './_jawabModal.mjs';
// ### KODE BARU: Impor modul riwayat ###
import { openRiwayatModal } from './_riwayatModal.mjs';

let disposisiState = {
    allData: [],
    filteredData: [],
    currentPage: 1,
    entriesPerPage: 10,
    searchTerm: '',
    filterStatus: 'all'
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

function renderDisposisiTable() {
    const tableBody = document.getElementById('disposisi-table-body');
    if (!tableBody) return;

    let dataToProcess = disposisiState.allData;
    if (disposisiState.filterStatus !== 'all') {
        dataToProcess = disposisiState.allData.filter(surat => surat.is_balas === disposisiState.filterStatus);
    }

    const searchTerm = disposisiState.searchTerm.toLowerCase();
    disposisiState.filteredData = dataToProcess.filter(surat => {
        const searchFields = [surat.no_agenda, surat.no_surat, surat.pengirim, surat.perihal, surat.s_surat];
        return searchFields.some(field => String(field || '').toLowerCase().includes(searchTerm));
    });

    const totalEntries = disposisiState.filteredData.length;
    const totalPages = Math.ceil(totalEntries / disposisiState.entriesPerPage) || 1;
    if (disposisiState.currentPage > totalPages && totalPages > 0) disposisiState.currentPage = totalPages;
    else if (totalPages === 0) disposisiState.currentPage = 1;
    
    const startIndex = (disposisiState.currentPage - 1) * disposisiState.entriesPerPage;
    const paginatedData = disposisiState.filteredData.slice(startIndex, startIndex + disposisiState.entriesPerPage);

    tableBody.innerHTML = '';
    if (paginatedData.length === 0) {
        tableBody.innerHTML = `<tr><td colspan="7" style="text-align:center;">Data tidak ditemukan.</td></tr>`;
    } else {
        paginatedData.forEach(surat => {
            const noSuratPengirim = `<div class="text-primary-dispo1">${surat.no_surat || ''}</div><div class="text-secondary-dispo1">${surat.pengirim || 'Pengirim tidak diketahui'}</div>`;
            const fileButton = surat.file_token ? `<button class="btn-lihat-file-dispo1" data-token="${surat.file_token}" data-filename="${surat.file_surat}"><i class='bx bxs-file-pdf'></i> Lihat File</button>` : 'Tidak Ada File';
            const statusButton = `<button class="btn-lihat-status-dispo1" data-status='${JSON.stringify(surat.status_disposisi_all)}'>Lihat Status</button>`;
            const btnJawabText = surat.is_balas === '0' ? 'Jawab' : 'Jawab Lagi';
            const btnJawabClass = surat.is_balas === '0' ? 'btn-jawab-dispo1' : 'btn-jawab-lagi-dispo1';
            
            // ### PERUBAHAN UTAMA: Menambahkan tombol "Baca Disposisi" di sini ###
            const actionButtons = `
                <div class="action-buttons-group-dispo1">
                    <button class="${btnJawabClass}" data-action="jawab" data-id-surat="${surat.id_surat}">
                        ${btnJawabText}
                    </button>
                    <button class="btn-baca-dispo1" data-action="baca_disposisi" data-no-agenda="${surat.no_agenda}">
                        Baca Disposisi
                    </button>
                </div>
            `;
            const row = `<tr><td data-label="No. Agenda">${surat.no_agenda}</td><td data-label="No. Surat & Pengirim">${noSuratPengirim}</td><td data-label="Sifat Surat">${surat.s_surat}</td><td data-label="Perihal">${surat.perihal}</td><td data-label="File Surat">${fileButton}</td><td data-label="Detail Status">${statusButton}</td><td data-label="Aksi">${actionButtons}</td></tr>`;
            tableBody.insertAdjacentHTML('beforeend', row);
        });
    }
    
    const info = document.getElementById('pagination-info-dispo1');
    if (info) {
        const startEntry = totalEntries > 0 ? startIndex + 1 : 0;
        const endEntry = Math.min(startIndex + disposisiState.entriesPerPage, totalEntries);
        info.textContent = `Menampilkan ${startEntry} sampai ${endEntry} dari ${totalEntries} data`;
    }
    renderPaginationButtons(totalPages);
}

function renderPaginationButtons(totalPages) {
    const container = document.getElementById('pagination-buttons-dispo1');
    if (!container) return;
    container.innerHTML = '';
    if (totalPages <= 1) return;
    const prevButton = document.createElement('button');
    prevButton.innerHTML = '&laquo;';
    prevButton.disabled = disposisiState.currentPage === 1;
    prevButton.onclick = () => { if (disposisiState.currentPage > 1) { disposisiState.currentPage--; renderDisposisiTable(); } };
    container.appendChild(prevButton);
    for (let i = 1; i <= totalPages; i++) {
        const pageButton = document.createElement('button');
        pageButton.textContent = i;
        if (i === disposisiState.currentPage) pageButton.classList.add('active');
        pageButton.onclick = () => { disposisiState.currentPage = i; renderDisposisiTable(); };
        container.appendChild(pageButton);
    }
    const nextButton = document.createElement('button');
    nextButton.innerHTML = '&raquo;';
    nextButton.disabled = disposisiState.currentPage === totalPages;
    nextButton.onclick = () => { if (disposisiState.currentPage < totalPages) { disposisiState.currentPage++; renderDisposisiTable(); } };
    container.appendChild(nextButton);
}

export async function fetchDisposisiData() {
    const tableBody = document.getElementById('disposisi-table-body');
    const skeletonLoader = document.getElementById('disposisi-skeleton-loader');
    const currentToken = localStorage.getItem('jwt_token');

    if (!currentToken) {
        if(skeletonLoader) skeletonLoader.style.display = 'none';
        if(tableBody) {
            tableBody.style.display = 'table-row-group';
            tableBody.innerHTML = `<tr><td colspan="7" style="text-align:center; color: var(--error-text);">Otentikasi gagal. Silakan login kembali.</td></tr>`;
        }
        return;
    }

    if (skeletonLoader) skeletonLoader.style.display = 'table-row-group';
    if (tableBody) tableBody.style.display = 'none';

    try {
        const response = await fetch('backend/CRUD/api_get_disposisi.php', {
            method: 'GET',
            headers: { 'Authorization': `Bearer ${currentToken}` }
        });

        if (!response.ok) {
            if (response.status === 401) {
                localStorage.removeItem('jwt_token');
                window.location.href = 'login.php?status=session_expired';
            }
            throw new Error(`HTTP error! status: ${response.status}`);
        }
        
        const data = await response.json();
        disposisiState.allData = data;
        
        if (tableBody) tableBody.style.display = 'table-row-group';
        renderDisposisiTable();

    } catch (error) {
        console.error("DEBUG: Terjadi error saat fetch data:", error);
        if (tableBody) {
            tableBody.style.display = 'table-row-group';
            tableBody.innerHTML = `<tr><td colspan="7" style="text-align:center; color: var(--error-text);">Gagal memuat data. Cek console untuk detail.</td></tr>`;
        }
    } finally {
        if (skeletonLoader) skeletonLoader.style.display = 'none';
    }
}

export function initDisposisiPage() {
    document.getElementById('entries-select-dispo1')?.addEventListener('change', (e) => { disposisiState.entriesPerPage = parseInt(e.target.value, 10); disposisiState.currentPage = 1; renderDisposisiTable(); });
    document.getElementById('search-input-dispo1')?.addEventListener('input', (e) => { disposisiState.searchTerm = e.target.value; disposisiState.currentPage = 1; renderDisposisiTable(); });
    document.getElementById('filter-select-dispo2')?.addEventListener('change', (e) => { disposisiState.filterStatus = e.target.value; disposisiState.currentPage = 1; renderDisposisiTable(); });
    document.getElementById('reset-filter-dispo3')?.addEventListener('click', () => { disposisiState.searchTerm = ''; disposisiState.filterStatus = 'all'; disposisiState.currentPage = 1; if(document.getElementById('search-input-dispo1')) { document.getElementById('search-input-dispo1').value = ''; } if(document.getElementById('filter-select-dispo2')) { document.getElementById('filter-select-dispo2').value = 'all'; } fetchDisposisiData(); });
    
    document.getElementById('disposisi-table-body')?.addEventListener('click', function(e) {
        const target = e.target.closest('button');
        if (!target) return;

        // ### PERUBAHAN UTAMA: Menangani klik tombol baru ###
        const action = target.dataset.action;
        
        const statusModal = document.getElementById('status-modal');
        const pdfModal = document.getElementById('pdf-modal');

        if (target.classList.contains('btn-lihat-status-dispo1')) {
            try {
                const statusData = JSON.parse(target.dataset.status);
                const modalContent = (statusData || 'Belum Ada Status').split(' | ').map(s => {
                    const [unit, status] = s.split(' = ');
                    const statusClass = status === 'Sudah' ? 'status-sudah-text-dispo1' : 'status-belum-text-dispo1';
                    return `<div class="status-item-dispo1"><span class="unit-name-dispo1">${unit}:</span> <span class="${statusClass}">${status}</span></div>`;
                }).join('');
                openModal(statusModal, `<div class="status-list-dispo1">${modalContent}</div>`);
            } catch(error) {
                openModal(statusModal, `<div class="status-list-dispo1">Gagal menampilkan detail status.</div>`);
            }
        } else if (target.classList.contains('btn-lihat-file-dispo1')) {
            const tokenFile = target.dataset.token;
            const fileName = target.dataset.filename;
            const filePath = `backend/view_file.php?token=${tokenFile}`;
            openModal(pdfModal, filePath, { title: `Dokumen: ${fileName}`, token: tokenFile });
        }
        else if (action === 'jawab') { // Aksi 'Jawab' atau 'Jawab Lagi'
            const idSurat = target.dataset.idSurat; 
            const suratData = disposisiState.allData.find(d => d.id_surat == idSurat);
            if (suratData) {
                openJawabModal(suratData);
            } else {
                console.error('Data surat tidak ditemukan untuk baris ini.');
                alert('Gagal menemukan data surat yang sesuai.');
            }
        }
        else if (action === 'baca_disposisi') { // Aksi 'Baca Disposisi'
            const noAgenda = target.dataset.noAgenda;
            const suratData = disposisiState.allData.find(s => s.no_agenda == noAgenda);
            if (suratData) {
                openRiwayatModal(suratData);
            } else {
                console.error('Data surat tidak ditemukan untuk no agenda ini.');
                alert('Gagal menemukan data surat yang sesuai.');
            }
        }
    });
}