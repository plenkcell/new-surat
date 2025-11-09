import { openModal as openPdfModal } from './_pdfViewer.mjs';
import { openRiwayatModal } from './_riwayatModal.mjs';
import { openDetailListModal } from './_detailListModal.mjs';

// State management khusus untuk halaman arsip
let arsipState = {
    allData: [],
    currentPage: 1,
    entriesPerPage: 10,
    searchTerm: '',
    filterJenis: 'all' // State baru untuk filter jenis surat
};

function renderArsipPagination(totalEntries) {
    const totalPages = Math.ceil(totalEntries / arsipState.entriesPerPage) || 1;
    const infoEl = document.getElementById('pagination-info-arsip');
    const buttonsEl = document.getElementById('pagination-buttons-arsip');
    if (!infoEl || !buttonsEl) return;
    if (totalEntries === 0) {
        infoEl.textContent = '';
        buttonsEl.innerHTML = '';
        return;
    }
    const startEntry = (arsipState.currentPage - 1) * arsipState.entriesPerPage + 1;
    const endEntry = Math.min(startEntry + arsipState.entriesPerPage - 1, totalEntries);
    infoEl.textContent = `Menampilkan ${startEntry} sampai ${endEntry} dari ${totalEntries} data`;
    buttonsEl.innerHTML = '';
    const prevButton = document.createElement('button');
    prevButton.innerHTML = '&laquo;';
    prevButton.disabled = arsipState.currentPage === 1;
    prevButton.onclick = () => { arsipState.currentPage--; renderArsipTable(); };
    buttonsEl.appendChild(prevButton);
    for (let i = 1; i <= totalPages; i++) {
        const pageButton = document.createElement('button');
        pageButton.textContent = i;
        if (i === arsipState.currentPage) pageButton.classList.add('active');
        pageButton.onclick = () => { arsipState.currentPage = i; renderArsipTable(); };
        buttonsEl.appendChild(pageButton);
    }
    const nextButton = document.createElement('button');
    nextButton.innerHTML = '&raquo;';
    nextButton.disabled = arsipState.currentPage === totalPages;
    nextButton.onclick = () => { arsipState.currentPage++; renderArsipTable(); };
    buttonsEl.appendChild(nextButton);
}

function renderArsipTable() {
    const cardList = document.getElementById('card-list-arsip');
    if (!cardList) return;

    // ### PERBAIKAN: Logika filter sekarang mencakup Jenis Surat ###
    let filteredData = arsipState.allData;

    // 1. Filter berdasarkan Jenis Surat
    if (arsipState.filterJenis !== 'all') {
        filteredData = filteredData.filter(s => s.j_surat === arsipState.filterJenis);
    }

    // 2. Filter berdasarkan Pencarian
    const searchTerm = arsipState.searchTerm.toLowerCase();
    if (searchTerm) {
        filteredData = filteredData.filter(s => 
            (s.perihal || '').toLowerCase().includes(searchTerm) ||
            (s.no_surat || '').toLowerCase().includes(searchTerm) ||
            (s.pengirim || '').toLowerCase().includes(searchTerm)
        );
    }
    
    const paginatedData = filteredData.slice(
        (arsipState.currentPage - 1) * arsipState.entriesPerPage,
        arsipState.currentPage * arsipState.entriesPerPage
    );

    cardList.innerHTML = '';
    if (paginatedData.length === 0) {
        cardList.innerHTML = `<div style="text-align:center; padding: 40px; background-color: var(--bg-content); border-radius:12px;">Arsip tidak ditemukan.</div>`;
    } else {
        paginatedData.forEach(surat => {
            const aksiContent = surat.disposisi === '1'
                ? `<a href="#" class="btn-dsi btn-info-dsi" data-action="baca_disposisi">Baca Disposisi</a>`
                : '';
            
            const arsipBtn = surat.daftar_arsip
                ? `<button class="btn-dsi btn-lihat-detail-sms" data-action="lihat_arsip" data-detail="${surat.daftar_arsip}">Lihat Detail</button>`
                : '<span>-</span>';

            const cardHTML = `
                <div class="sms-card" data-id="${surat.id_surat}">
                    <div class="sms-card__header">
                        <div class="sms-card__icon"><i class='bx bxs-archive-in'></i></div>
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
                            <div class="detail-item-sms"><h5>No. Surat & Agenda</h5><p>${surat.no_surat} (Agenda: ${surat.no_agenda})</p></div>
                            <div class="detail-item-sms"><h5>Jenis Surat</h5><p>${surat.j_surat || '-'}</p></div>
                            <div class="detail-item-sms"><h5>Daftar Arsip</h5><p>${arsipBtn}</p></div>
                            <div class="detail-item-sms">
                                <h5>Aksi</h5>
                                <div style="display:flex; gap:10px;">
                                    <a href="#" class="btn-dsi btn-pdf-dsi" data-action="view_pdf">Lihat File</a>
                                    ${aksiContent}
                                </div>
                            </div>
                        </div>
                    </div>
                </div>
            `;
            cardList.insertAdjacentHTML('beforeend', cardHTML);
        });
    }
    renderArsipPagination(filteredData.length);
}

async function fetchArsipData() {
    const spinner = document.getElementById('loading-spinner-arsip');
    const cardList = document.getElementById('card-list-arsip');
    const currentToken = localStorage.getItem('jwt_token');

    if (spinner) spinner.style.display = 'flex';
    if (cardList) cardList.innerHTML = '';
    
    try {
        const response = await fetch('backend/CRUD/api_get_arsip_surat.php', {
            headers: { 'Authorization': `Bearer ${currentToken}` }
        });
        if (!response.ok) throw new Error('Gagal mengambil data arsip.');
        arsipState.allData = await response.json();
        renderArsipTable();
    } catch (error) {
        console.error("Fetch Arsip Error:", error);
        if(cardList) cardList.innerHTML = `<div style="text-align:center; padding: 40px; color:var(--error-text); background-color: var(--bg-content); border-radius:12px;">${error.message}</div>`;
    } finally {
        if (spinner) spinner.style.display = 'none';
    }
}

export function initArsipSuratPage() {
    const cardList = document.getElementById('card-list-arsip');
    const searchInput = document.getElementById('search-input-arsip');
    const entriesSelect = document.getElementById('entries-select-arsip');
    // ### DEKLARASI ELEMEN BARU ###
    const jenisFilter = document.getElementById('filter-jenis-arsip');
    const resetBtn = document.getElementById('reset-filter-arsip');
    
    searchInput?.addEventListener('input', () => {
        arsipState.searchTerm = searchInput.value;
        arsipState.currentPage = 1;
        renderArsipTable();
    });

    entriesSelect?.addEventListener('change', () => {
        arsipState.entriesPerPage = parseInt(entriesSelect.value, 10);
        arsipState.currentPage = 1;
        renderArsipTable();
    });

    // ### EVENT LISTENER UNTUK FILTER JENIS SURAT ###
    jenisFilter?.addEventListener('change', () => {
        arsipState.filterJenis = jenisFilter.value;
        arsipState.currentPage = 1;
        renderArsipTable();
    });

    // ### EVENT LISTENER UNTUK TOMBOL RESET ###
    resetBtn?.addEventListener('click', (e) => {
        e.preventDefault();
        
        arsipState.searchTerm = '';
        arsipState.filterJenis = 'all';
        arsipState.currentPage = 1;
        arsipState.entriesPerPage = 10;
        
        if (searchInput) searchInput.value = '';
        if (jenisFilter) jenisFilter.value = 'all';
        if (entriesSelect) entriesSelect.value = 10;
        
        fetchArsipData();
    });
    
    cardList?.addEventListener('click', e => {
        const card = e.target.closest('.sms-card');
        if (!card) return;
        const suratId = card.dataset.id;
        const surat = arsipState.allData.find(s => s.id_surat == suratId);
        if (!surat) return;

        const button = e.target.closest('[data-action]');
        
        if (button) {
            e.stopPropagation();
            const action = button.dataset.action;
            
            if (action === 'view_pdf' && surat.file_token) {
                openPdfModal(document.getElementById('pdf-modal'), `backend/view_file.php?token=${surat.file_token}`, { title: surat.file_surat, token: surat.file_token });
            } else if (action === 'baca_disposisi' && surat.no_agenda) {
                openRiwayatModal(surat);
            } 
            else if (action === 'lihat_arsip') {
                openDetailListModal('Detail Daftar Arsip', button.dataset.detail, ' || ');
            }
        } else {
            const header = e.target.closest('.sms-card__header');
            if (header) {
                card.classList.toggle('is-open');
            }
        }
    });

    fetchArsipData();
}