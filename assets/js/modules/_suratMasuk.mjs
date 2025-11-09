import { openModal as openPdfModal } from './_pdfViewer.mjs';
import { openRiwayatModal } from './_riwayatModal.mjs';
import { openDetailListModal } from './_detailListModal.mjs';

let smsState = {
    allData: [],
    currentPage: 1,
    entriesPerPage: 10,
    searchTerm: '',
    filterJenis: 'all' // State baru untuk filter jenis surat
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

function renderPagination(totalEntries) {
    const totalPages = Math.ceil(totalEntries / smsState.entriesPerPage) || 1;
    const infoEl = document.getElementById('pagination-info-sms');
    const buttonsEl = document.getElementById('pagination-buttons-sms');
    if (!infoEl || !buttonsEl) return;
    if (totalEntries === 0) {
        infoEl.textContent = '';
        buttonsEl.innerHTML = '';
        return;
    }
    const startEntry = (smsState.currentPage - 1) * smsState.entriesPerPage + 1;
    const endEntry = Math.min(startEntry + smsState.entriesPerPage - 1, totalEntries);
    infoEl.textContent = `Menampilkan ${startEntry} sampai ${endEntry} dari ${totalEntries} data`;
    buttonsEl.innerHTML = '';
    const prevButton = document.createElement('button');
    prevButton.innerHTML = '&laquo;';
    prevButton.disabled = smsState.currentPage === 1;
    prevButton.onclick = () => { smsState.currentPage--; renderTable(); };
    buttonsEl.appendChild(prevButton);
    for (let i = 1; i <= totalPages; i++) {
        const pageButton = document.createElement('button');
        pageButton.textContent = i;
        if (i === smsState.currentPage) pageButton.classList.add('active');
        pageButton.onclick = () => { smsState.currentPage = i; renderTable(); };
        buttonsEl.appendChild(pageButton);
    }
    const nextButton = document.createElement('button');
    nextButton.innerHTML = '&raquo;';
    nextButton.disabled = smsState.currentPage === totalPages;
    nextButton.onclick = () => { smsState.currentPage++; renderTable(); };
    buttonsEl.appendChild(nextButton);
}

function renderTable() {
    const cardList = document.getElementById('card-list-sms');
    if (!cardList) return;

    // ### PERBAIKAN: Logika filter sekarang mencakup Jenis Surat ###
    let filteredData = smsState.allData;

    // 1. Filter berdasarkan Jenis Surat
    if (smsState.filterJenis !== 'all') {
        filteredData = filteredData.filter(s => s.j_surat === smsState.filterJenis);
    }

    // 2. Filter berdasarkan Pencarian
    const searchTerm = smsState.searchTerm.toLowerCase();
    if (searchTerm) {
        filteredData = filteredData.filter(s => 
            (s.perihal || '').toLowerCase().includes(searchTerm) ||
            (s.no_surat || '').toLowerCase().includes(searchTerm) ||
            (s.pengirim || '').toLowerCase().includes(searchTerm)
        );
    }
    
    smsState.currentPage = Math.min(smsState.currentPage, Math.ceil(filteredData.length / smsState.entriesPerPage) || 1);
    const paginatedData = filteredData.slice(
        (smsState.currentPage - 1) * smsState.entriesPerPage,
        smsState.currentPage * smsState.entriesPerPage
    );

    cardList.innerHTML = '';
    if (paginatedData.length === 0) {
        cardList.innerHTML = `<div style="text-align:center; padding: 40px; background-color: var(--bg-content); border-radius:12px;">Data tidak ditemukan.</div>`;
    } else {
        paginatedData.forEach(surat => {
            const disposisiBtn = surat.disposisi_ke 
                ? `<button class="btn-dsi btn-lihat-detail-sms" data-action="lihat_disposisi" data-detail="${surat.disposisi_ke}">Lihat Detail</button>` 
                : '<span>-</span>';
            
            const arsipBtn = surat.daftar_arsip
                ? `<button class="btn-dsi btn-lihat-detail-sms" data-action="lihat_arsip" data-detail="${surat.daftar_arsip}">Lihat Detail</button>`
                : '<span>-</span>';

            const cardHTML = `
                <div class="sms-card" data-id="${surat.id_surat}">
                    <div class="sms-card__header">
                        <div class="sms-card__icon"><i class='bx bx-check-double'></i></div>
                        <div class="sms-card__main-info">
                            <p class="sms-card__perihal">${surat.perihal}</p>
                            <div class="sms-card__meta">
                                Dari: ${surat.pengirim} &nbsp;•&nbsp; Selesai: ${new Date(surat.waktu_slse).toLocaleDateString('id-ID')}
                            </div>
                        </div>
                        <i class='bx bx-chevron-down sms-card__toggle-icon'></i>
                    </div>
                    <div class="sms-card__details">
                        <div class="detail-grid-sms">
                            <div class="detail-item-sms">
                                <h5>No. Surat & Agenda</h5>
                                <p>${surat.no_surat} (Agenda: ${surat.no_agenda})</p>
                            </div>
                            <div class="detail-item-sms">
                                <h5>Tgl. Surat / Tgl. Terima</h5>
                                <p>${surat.tgl_surat_formatted} / ${surat.tgl_terima_formatted}</p>
                            </div>
                            <div class="detail-item-sms">
                                <h5>Keterangan / RTL</h5>
                                <p>${surat.krtl || '-'}</p>
                            </div>
                            <div class="detail-item-sms">
                                <h5>Disposisi Ke</h5>
                                <p>${disposisiBtn}</p>
                            </div>
                             <div class="detail-item-sms">
                                <h5>Daftar Arsip</h5>
                                <p>${arsipBtn}</p>
                            </div>
                            <div class="detail-item-sms">
                                <h5>Verifikator</h5>
                                <p>${surat.verifikator || '-'}</p>
                            </div>
                            <div class="detail-item-sms">
                                <h5>Aksi</h5>
                                <div style="display:flex; gap:10px;">
                                    <a href="#" class="btn-dsi btn-pdf-dsi" data-action="view_pdf">Lihat File</a>
                                    <a href="#" class="btn-dsi btn-info-dsi" data-action="baca_disposisi">Baca Disposisi</a>
                                </div>
                            </div>
                        </div>
                    </div>
                </div>
            `;
            cardList.insertAdjacentHTML('beforeend', cardHTML);
        });
    }
    renderPagination(filteredData.length);
}

async function fetchData() {
    const spinner = document.getElementById('loading-spinner-sms');
    const cardList = document.getElementById('card-list-sms');
    const currentToken = localStorage.getItem('jwt_token');

    if (spinner) spinner.style.display = 'flex';
    if (cardList) cardList.innerHTML = '';
    
    try {
        const response = await fetch('backend/CRUD/api_get_surat_masuk_selesai.php', {
            headers: { 'Authorization': `Bearer ${currentToken}` }
        });
        if (!response.ok) throw new Error('Gagal mengambil data dari server.');
        smsState.allData = await response.json();
        renderTable();
    } catch (error) {
        console.error("Fetch Surat Masuk Selesai Error:", error);
        if(cardList) cardList.innerHTML = `<div style="text-align:center; padding: 40px; color:var(--error-text); background-color: var(--bg-content); border-radius:12px;">${error.message}</div>`;
    } finally {
        if (spinner) spinner.style.display = 'none';
    }
}

export function initSuratMasukPage() {
    const cardList = document.getElementById('card-list-sms');
    const searchInput = document.getElementById('search-input-sms');
    const entriesSelect = document.getElementById('entries-select-sms');
    // ### DEKLARASI ELEMEN BARU ###
    const jenisFilter = document.getElementById('filter-jenis-sms');
    const resetBtn = document.getElementById('reset-filter-sms');
    
    searchInput?.addEventListener('input', () => {
        smsState.searchTerm = searchInput.value;
        smsState.currentPage = 1;
        renderTable();
    });

    entriesSelect?.addEventListener('change', () => {
        smsState.entriesPerPage = parseInt(entriesSelect.value, 10);
        smsState.currentPage = 1;
        renderTable();
    });

    // ### EVENT LISTENER UNTUK FILTER JENIS SURAT ###
    jenisFilter?.addEventListener('change', () => {
        smsState.filterJenis = jenisFilter.value;
        smsState.currentPage = 1;
        renderTable();
    });

    // ### EVENT LISTENER UNTUK TOMBOL RESET ###
    resetBtn?.addEventListener('click', (e) => {
        e.preventDefault();
        
        // Kembalikan state ke default
        smsState.searchTerm = '';
        smsState.filterJenis = 'all';
        smsState.currentPage = 1;
        smsState.entriesPerPage = 10; // Kembali ke 10
        
        // Kembalikan nilai form ke default
        if (searchInput) searchInput.value = '';
        if (jenisFilter) jenisFilter.value = 'all';
        if (entriesSelect) entriesSelect.value = 10;
        
        // Panggil API untuk refresh data
        fetchData();
    });
    
    // ### PERBAIKAN TOTAL PADA EVENT LISTENER ###
    cardList?.addEventListener('click', e => {
        const card = e.target.closest('.sms-card');
        if (!card) return;

        const suratId = card.dataset.id;
        const surat = smsState.allData.find(s => s.id_surat == suratId);
        if (!surat) return;

        // Cek apakah yang diklik adalah sebuah tombol dengan atribut data-action
        const button = e.target.closest('[data-action]');
        
        if (button) {
            e.stopPropagation(); // Hentikan event agar card tidak ikut toggle
            const action = button.dataset.action;

            switch(action) {
                case 'view_pdf':
                    if (surat.file_token) {
                        openPdfModal(document.getElementById('pdf-modal'), `backend/view_file.php?token=${surat.file_token}`, { title: surat.file_surat, token: surat.file_token });
                    }
                    break;
                case 'baca_disposisi':
                    if (surat.no_agenda) {
                        openRiwayatModal(surat);
                    }
                    break;
                case 'lihat_disposisi':
                    openDetailListModal('Detail Disposisi Ke', button.dataset.detail, ', ');
                    break;
                case 'lihat_arsip':
                    openDetailListModal('Detail Daftar Arsip', button.dataset.detail, '||');
                    break;
            }
        } else {
            // Jika bukan tombol, berarti pengguna mengklik header untuk toggle
            const header = e.target.closest('.sms-card__header');
            if (header) {
                card.classList.toggle('is-open');
            }
        }
    });

    fetchData();
}