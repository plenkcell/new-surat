import { showFeedback } from './_utils.mjs';
import ubahSuratInternal from './_ubahSuratInternal.mjs';
import { openModal } from './_pdfViewer.mjs';

// Mengambil user level sekali saat modul dimuat
const userLevel = JSON.parse(atob(localStorage.getItem('jwt_token').split('.')[1])).data.level;

// State management untuk data, filter, dan paginasi
let dsiState = {
    allData: [],
    filteredData: [],
    currentPage: 1,
    entriesPerPage: 10,
    searchTerm: '',
    filterStatus: userLevel === 'admin' ? 'Belum' : 'all'
};

/**
 * Merender tabel surat internal berdasarkan state saat ini.
 */
function renderDsiTable() {
    const tableBody = document.getElementById('table-body-dsi');
    if (!tableBody) return;

    let dataToProcess;

    if (dsiState.filterStatus === 'Non-Aktif') {
        dataToProcess = dsiState.allData.filter(surat => surat.is_aktif === '0');
    } else if (dsiState.filterStatus !== 'all') {
        dataToProcess = dsiState.allData.filter(surat => surat.is_aktif === '1' && surat.is_status === dsiState.filterStatus);
    } else {
        dataToProcess = dsiState.allData.filter(surat => surat.is_aktif === '1');
    }

    const searchTerm = dsiState.searchTerm.toLowerCase();
    dsiState.filteredData = dataToProcess.filter(surat => 
        Object.values(surat).some(val => 
            String(val || '').toLowerCase().includes(searchTerm)
        )
    );
    
    const totalEntries = dsiState.filteredData.length;
    const totalPages = Math.ceil(totalEntries / dsiState.entriesPerPage) || 1;
    dsiState.currentPage = Math.min(dsiState.currentPage, totalPages);
    const paginatedData = dsiState.filteredData.slice(
        (dsiState.currentPage - 1) * dsiState.entriesPerPage,
        dsiState.currentPage * dsiState.entriesPerPage
    );

    tableBody.innerHTML = '';
    if (paginatedData.length === 0) {
        tableBody.innerHTML = `<tr><td colspan="6" style="text-align:center;">Data tidak ditemukan.</td></tr>`;
    } else {
        paginatedData.forEach(surat => {
            const row = document.createElement('tr');
            
            // ### TOMBOL 'INGATKAN VERIF' DIKEMBALIKAN DI SINI ###
            let actionButtons = '';
            if (userLevel === 'user' || userLevel === 'direktur') {
                if (surat.is_status === 'Belum' && surat.is_aktif === '1') {
                    actionButtons = `
                        <a href="#" class="btn-dsi btn-info-dsi" data-action="ubah" data-id="${surat.id_surat_int}"><i class='bx bx-edit'></i> Ubah</a>
                        <a href="#" class="btn-dsi btn-danger-dsi" data-action="nonaktif" data-id="${surat.id_surat_int}"><i class='bx bx-trash'></i> Non-Aktif</a>
                        <a href="#" class="btn-dsi btn-success-dsi" data-action="ingatkan" data-id="${surat.id_surat_int}"><i class='bx bxl-whatsapp'></i> Ingatkan Verif</a>
                    `;
                } else if (surat.is_status === 'Sudah') {
                    actionButtons = `<button class="btn-dsi btn-success-dsi" disabled><i class='bx bx-check-square'></i> Ter-Verifikasi</button>`;
                } else if (surat.is_aktif === '0') {
                    actionButtons = `<button class="btn-dsi btn-danger-dsi" disabled><i class='bx bx-x-circle'></i> Non-Aktif</button>`;
                }
            } else { // Admin
                if (surat.is_status === 'Belum' && surat.is_aktif === '1') {
                     actionButtons = `<a href="#" class="btn-dsi btn-info-dsi blink-dsi" data-action="verifikasi" data-id="${surat.id_surat_int}"><i class='bx bx-check'></i> Verifikasi</a><a href="#" class="btn-dsi btn-danger-dsi" data-action="catatan" data-id="${surat.id_surat_int}"><i class='bx bx-comment-add'></i> Buat Catatan</a>`;
                } else {
                     actionButtons = `<button class="btn-dsi btn-success-dsi" disabled><i class='bx bx-check-square'></i> Ter-Verifikasi</button>`;
                }
            }

            const fileDisplay = surat.file_token ? `<a href="#" class="btn-dsi btn-pdf-dsi" data-action="view_pdf" data-file-token="${surat.file_token}" data-file-name="${surat.file_surat}"><i class='bx bxs-file-pdf'></i> Lihat File</a>` : '<span>Tidak ada file</span>';

            row.innerHTML = `<td data-label="No. Surat & Agenda">${surat.no_surat}<span class="no-surat-detail-dsi">Agenda: ${surat.no_agenda || 'N/A'}</span></td><td data-label="Perihal & File">${surat.perihal}<div class="perihal-detail-dsi">[Sifat: ${surat.s_surat}] [Lampiran: ${surat.j_lampiran}]<br>${fileDisplay}</div></td><td data-label="Petugas">${surat.on_create}<span class="petugas-detail-dsi">${new Date(surat.on_datetime).toLocaleString('id-ID')}</span></td><td data-label="Verifikasi">${surat.is_status}<span class="verifikasi-detail-dsi">Oleh: ${surat.is_verif || '-'}</span><span class="verifikasi-detail-dsi">Waktu: ${surat.is_datetime === '0000-00-00 00:00:00' ? '-' : new Date(surat.is_datetime).toLocaleString('id-ID')}</span></td><td data-label="Disposisi & Catatan">${surat.status_disposisi || 'Belum ada disposisi'}<span class="catatan-detail-dsi">Catatan: ${surat.catatan_admin || '-'}</span></td><td data-label="Aksi"><div class="action-buttons-dsi">${actionButtons}</div></td>`;
            tableBody.appendChild(row);
        });
    }
    renderPagination(totalEntries, totalPages);
}

/**
 * Merender tombol-tombol paginasi.
 */
function renderPagination(totalEntries, totalPages) {
    const infoEl = document.getElementById('pagination-info-dsi');
    const buttonsEl = document.getElementById('pagination-buttons-dsi');
    if (!infoEl || !buttonsEl) return;
    if (totalEntries === 0) { infoEl.textContent = ''; buttonsEl.innerHTML = ''; return; }
    const startEntry = (dsiState.currentPage - 1) * dsiState.entriesPerPage + 1;
    const endEntry = Math.min(startEntry + dsiState.entriesPerPage - 1, totalEntries);
    infoEl.textContent = `Menampilkan ${startEntry} sampai ${endEntry} dari ${totalEntries} data`;
    buttonsEl.innerHTML = '';
    const prevButton = document.createElement('button');
    prevButton.innerHTML = '&laquo;';
    prevButton.disabled = dsiState.currentPage === 1;
    prevButton.onclick = () => { dsiState.currentPage--; renderDsiTable(); };
    buttonsEl.appendChild(prevButton);
    for (let i = 1; i <= totalPages; i++) {
        const pageButton = document.createElement('button');
        pageButton.textContent = i;
        if (i === dsiState.currentPage) pageButton.classList.add('active');
        pageButton.onclick = () => { dsiState.currentPage = i; renderDsiTable(); };
        buttonsEl.appendChild(pageButton);
    }
    const nextButton = document.createElement('button');
    nextButton.innerHTML = '&raquo;';
    nextButton.disabled = dsiState.currentPage === totalPages;
    nextButton.onclick = () => { dsiState.currentPage++; renderDsiTable(); };
    buttonsEl.appendChild(nextButton);
}

/**
 * Mengambil data surat internal dari server.
 */
export async function fetchDsiData() {
    const spinner = document.getElementById('loading-spinner-dsi');
    const tableBody = document.getElementById('table-body-dsi');
    const currentToken = localStorage.getItem('jwt_token');
    if (spinner) spinner.style.display = 'block';
    if (tableBody) tableBody.innerHTML = '';
    try {
        const response = await fetch('backend/CRUD/api_get_surat_internal.php', { headers: { 'Authorization': `Bearer ${currentToken}` } });
        if (!response.ok) throw new Error('Gagal mengambil data dari server.');
        dsiState.allData = await response.json();
        renderDsiTable();
    } catch (error) {
        console.error("Fetch DSI Error:", error);
        if(tableBody) tableBody.innerHTML = `<tr><td colspan="6" style="text-align:center; color:var(--error-text);">${error.message}</td></tr>`;
    } finally {
        if (spinner) spinner.style.display = 'none';
    }
}

/**
 * Menginisialisasi semua event listener untuk halaman daftar surat internal.
 */
export function initDaftarSuratInternalPage() {
    const searchInput = document.getElementById('search-input-dsi');
    const entriesSelect = document.getElementById('entries-select-dsi');
    const filterSelect = document.getElementById('filter-select-dsi');
    const tableBody = document.getElementById('table-body-dsi');
    const resetBtn = document.getElementById('reset-filter-dsi');
    const verifModal = document.getElementById('verif-modal-dsi');
    const verifForm = document.getElementById('verif-form-dsi');
    const verifCloseBtn = document.getElementById('verif-modal-close-dsi');
    const verifFeedback = document.getElementById('verif-feedback-dsi');
    const catatanModal = document.getElementById('catatan-modal-dsi');
    const catatanForm = document.getElementById('catatan-form-dsi');
    const catatanCloseBtn = document.getElementById('catatan-modal-close-dsi');
    const catatanFeedback = document.getElementById('catatan-feedback-dsi');
    const catatanTextarea = document.getElementById('catatan-textarea-dsi');
    const confirmModal = document.getElementById('confirm-edit-catatan-modal-dsi');
    const confirmYesBtn = document.getElementById('confirm-yes-btn-dsi');
    const confirmNoBtn = document.getElementById('confirm-no-btn-dsi');
    let currentSuratId = null;
    
    if (userLevel === 'admin') {
        filterSelect.value = 'Belum';
    } else {
        document.getElementById('filter-nonaktif-dsi').style.display = 'block';
        filterSelect.value = 'all';
    }
    dsiState.filterStatus = filterSelect.value;

    searchInput?.addEventListener('input', () => { dsiState.searchTerm = searchInput.value; dsiState.currentPage = 1; renderDsiTable(); });
    entriesSelect?.addEventListener('change', () => { dsiState.entriesPerPage = parseInt(entriesSelect.value, 10); dsiState.currentPage = 1; renderDsiTable(); });
    filterSelect?.addEventListener('change', () => { dsiState.filterStatus = filterSelect.value; dsiState.currentPage = 1; renderDsiTable(); });
    resetBtn?.addEventListener('click', (e) => { e.preventDefault(); dsiState.searchTerm = ''; dsiState.filterStatus = userLevel === 'admin' ? 'Belum' : 'all'; dsiState.currentPage = 1; if (searchInput) searchInput.value = ''; filterSelect.value = dsiState.filterStatus; fetchDsiData(); });

    async function openVerifModal(suratData) {
        verifFeedback.style.display = 'none';
        verifForm.reset();
        document.getElementById('verif-id-surat-dsi').value = suratData.id_surat_int;
        document.getElementById('verif-no-surat-dsi').textContent = suratData.no_surat;
        document.getElementById('verif-perihal-dsi').textContent = suratData.perihal;
        document.getElementById('verif-pengirim-dsi').textContent = suratData.asal_surat;
        document.getElementById('verif-tgl-surat-dsi').textContent = new Date(suratData.on_datetime).toLocaleDateString('id-ID', { year: 'numeric', month: 'long', day: 'numeric' });
        document.getElementById('verif-tgl-terima-dsi').value = new Date().toISOString().split('T')[0];
        const noAgendaInput = document.getElementById('verif-no-agenda-dsi');
        noAgendaInput.value = 'Membuat nomor...';
        try {
            const currentToken = localStorage.getItem('jwt_token');
            const response = await fetch('backend/CRUD/api_get_next_agenda_number.php', { headers: { 'Authorization': `Bearer ${currentToken}` } });
            const result = await response.json();
            if (!response.ok) throw new Error(result.message);
            noAgendaInput.value = result.next_agenda_number;
        } catch (error) {
            noAgendaInput.value = 'Gagal membuat nomor';
            showFeedback(verifFeedback, error.message, 'error');
        }
        verifModal.style.display = 'flex';
    }

    tableBody?.addEventListener('click', async (e) => {
        const button = e.target.closest('.btn-dsi');
        if (!button) return;
        e.preventDefault();
        const action = button.dataset.action;
        const id = button.dataset.id;
        const currentToken = localStorage.getItem('jwt_token');

        if (action === 'verifikasi') {
            const suratData = dsiState.allData.find(s => s.id_surat_int == id);
            if (suratData) openVerifModal(suratData);
        } else if (action === 'catatan') {
            currentSuratId = id;
            try {
                const response = await fetch(`backend/CRUD/api_get_catatan_internal.php?id_surat_int=${currentSuratId}`, { headers: { 'Authorization': `Bearer ${currentToken}` } });
                if (!response.ok) throw new Error('Gagal memeriksa catatan yang ada.');
                const result = await response.json();
                if (result && result.catatan) {
                    confirmModal.style.display = 'flex';
                } else {
                    catatanTextarea.value = '';
                    catatanModal.style.display = 'flex';
                }
            } catch (error) {
                Swal.fire('Error', error.message, 'error');
            }
        } 
        
        // ### FUNGSI INGATKAN ADMIN YANG SEBELUMNYA HILANG, SEKARANG ADA DI SINI ###
        else if (action === 'ingatkan') {
            Swal.fire({
                title: 'Kirim Pengingat?',
                text: "Sebuah notifikasi WhatsApp akan dikirim ke admin untuk memverifikasi surat ini.",
                icon: 'question',
                showCancelButton: true,
                confirmButtonColor: '#28a745',
                cancelButtonColor: '#6c757d',
                confirmButtonText: 'Ya, Kirim!',
                cancelButtonText: 'Batal'
            }).then(async (result) => {
                if (result.isConfirmed) {
                    Swal.fire({
                        title: 'Mengirim Pengingat...',
                        html: 'Mohon tunggu sebentar.',
                        allowOutsideClick: false,
                        didOpen: () => { Swal.showLoading(); }
                    });

                    try {
                        const response = await fetch('backend/reminder/api_ingatkan_admin.php', {
                            method: 'POST',
                            headers: { 'Authorization': `Bearer ${currentToken}`, 'Content-Type': 'application/json' },
                            body: JSON.stringify({ id_surat_int: id })
                        });
                        const res = await response.json();
                        if (!response.ok) throw new Error(res.message);
                        Swal.fire('Berhasil!', res.message, 'success');
                    } catch (error) {
                        Swal.fire('Gagal!', error.message, 'error');
                    }
                }
            });
        }
        
        else if (action === 'ubah' || action === 'nonaktif') {
            const surat = dsiState.allData.find(s => s.id_surat_int == id);
            if (surat && surat.is_status === 'Sudah') {
                Swal.fire('Aksi Ditolak', 'Maaf, Status Surat Internal Anda sudah di Verifikasi Oleh Admin', 'error');
                return;
            }
            if (action === 'nonaktif') {
                Swal.fire({
                    title: 'Apakah Anda Yakin?',
                    html: "Akan Me-<b>nonAktifkan</b> Surat Internal Tersebut!!!",
                    icon: 'warning',
                    showCancelButton: true,
                    confirmButtonColor: '#d33',
                    cancelButtonColor: '#3085d6',
                    confirmButtonText: 'Iya, Non-Aktifkan!',
                    cancelButtonText: 'Tidak'
                }).then(async (result) => {
                    if (result.isConfirmed) {
                        try {
                            const response = await fetch('backend/CRUD/api_nonaktifkan_surat.php', {
                                method: 'POST',
                                headers: { 'Authorization': `Bearer ${currentToken}`, 'Content-Type': 'application/json' },
                                body: JSON.stringify({ id_surat_int: id })
                            });
                            const res = await response.json();
                            if (!response.ok) throw new Error(res.message);
                            Swal.fire('Berhasil!', 'Surat telah dinonaktifkan.', 'success');
                            fetchDsiData();
                        } catch (error) {
                            Swal.fire('Gagal!', error.message, 'error');
                        }
                    }
                });
            } else if (action === 'ubah') {
                ubahSuratInternal.open(id);
            }
        } else if (action === 'view_pdf') {
            const pdfModalEl = document.getElementById('pdf-modal');
            const fileToken = button.dataset.fileToken;
            const fileName = button.dataset.fileName;
            const fileUrl = `backend/view_file.php?token=${fileToken}`;
            const title = { title: fileName, token: fileToken };
            openModal(pdfModalEl, fileUrl, title);
        }
    });
    
    verifCloseBtn?.addEventListener('click', () => { verifModal.style.display = 'none'; });
    
    verifForm?.addEventListener('submit', async (e) => {
        e.preventDefault();
        const submitButton = verifForm.querySelector('button[type="submit"]');
        const btnText = submitButton.querySelector('.btn-text');
        const btnSpinner = submitButton.querySelector('.btn-spinner');
        btnText.style.visibility = 'hidden';
        btnSpinner.style.display = 'inline-block';
        submitButton.disabled = true;
        const formData = new FormData(verifForm);
        const currentToken = localStorage.getItem('jwt_token');
        try {
            const response = await fetch('backend/CRUD/api_verifikasi_internal.php', {
                method: 'POST',
                headers: { 'Authorization': `Bearer ${currentToken}` },
                body: formData
            });
            const result = await response.json();
            if (!response.ok) throw new Error(result.message || 'Terjadi kesalahan server.');
            showFeedback(verifFeedback, result.message, 'success');
            setTimeout(() => {
                verifModal.style.display = 'none';
                fetchDsiData();
            }, 2000);
        } catch (error) {
            showFeedback(verifFeedback, error.message, 'error');
        } finally {
            setTimeout(() => {
                btnText.style.visibility = 'visible';
                btnSpinner.style.display = 'none';
                submitButton.disabled = false;
            }, 1000);
        }
    });

    confirmYesBtn?.addEventListener('click', async () => {
        const currentToken = localStorage.getItem('jwt_token');
        confirmModal.style.display = 'none';
        try {
            const response = await fetch(`backend/CRUD/api_get_catatan_internal.php?id_surat_int=${currentSuratId}`, { headers: { 'Authorization': `Bearer ${currentToken}` } });
            const result = await response.json();
            if (result && result.catatan) {
                catatanTextarea.value = result.catatan;
            }
            catatanModal.style.display = 'flex';
        } catch (error) {
            Swal.fire('Error', 'Gagal mengambil catatan lama.', 'error');
        }
    });
    confirmNoBtn?.addEventListener('click', () => { confirmModal.style.display = 'none'; });
    catatanCloseBtn?.addEventListener('click', () => { catatanModal.style.display = 'none'; });
    
    catatanForm?.addEventListener('submit', async (e) => {
        e.preventDefault();
        const submitButton = catatanForm.querySelector('button[type="submit"]');
        submitButton.disabled = true;
        submitButton.textContent = 'Menyimpan...';
        const currentToken = localStorage.getItem('jwt_token');
        try {
            const response = await fetch('backend/CRUD/api_post_catatan_internal.php', {
                method: 'POST',
                headers: { 'Authorization': `Bearer ${currentToken}`, 'Content-Type': 'application/json' },
                body: JSON.stringify({ id_surat_int: currentSuratId, catatan: catatanTextarea.value })
            });
            const result = await response.json();
            if (!response.ok) throw new Error(result.message);
            showFeedback(catatanFeedback, result.message, 'success');
            setTimeout(() => {
                catatanModal.style.display = 'none';
                fetchDsiData();
            }, 1500);
        } catch (error) {
            showFeedback(catatanFeedback, error.message, 'error');
        } finally {
            submitButton.disabled = false;
            submitButton.textContent = 'Simpan Catatan';
        }
    });

    fetchDsiData();
}