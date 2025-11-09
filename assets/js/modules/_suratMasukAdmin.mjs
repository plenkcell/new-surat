// File: assets/js/modules/_suratMasukAdmin.mjs
import { openModal as openPdfModal } from './_pdfViewer.mjs';

const API_URL = 'backend/CRUD/api_suratMasukAdmin.php';
const UNIT_API_URL = 'backend/CRUD/api_get_unit.php';

// SweetAlert
function swSuccess(msg) { Swal.fire({ icon: 'success', title: 'Berhasil', text: msg, timer: 1500, showConfirmButton: false }); }
function swError(msg) { Swal.fire({ icon: 'error', title: 'Gagal', text: msg }); }
function swConfirm(text, confirmButtonText = 'Ya', cancelButtonText = 'Batal') {
    return Swal.fire({ title: 'Konfirmasi', text, icon: 'warning', showCancelButton: true, confirmButtonText, cancelButtonText });
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
    // Redirect session expired
    const expireMsg = "Sesi Anda telah berakhir. Silakan login kembali.";
    if (json && json.message && json.message === expireMsg) {
        Swal.fire({ title: 'Sesi Berakhir', text: expireMsg, icon: 'warning', timer: 1500, showConfirmButton: false, willClose: () => { window.location.href = 'login.php'; } });
        throw new Error(expireMsg);
    }
    if (!res.ok) {
        const msg = (json && json.message) ? json.message : `HTTP ${res.status}: ${txt}`;
        const err = new Error(msg); err.raw = json; throw err;
    }
    return json;
}

// Choices.js
let unitChoices = null;
function initUnitSelectChoices() {
    if (unitChoices) { unitChoices.destroy(); unitChoices = null; }
    unitChoices = new Choices('#disposisi-unit', {
        removeItemButton: true,
        searchResultLimit: 20,
        renderChoiceLimit: 200,
        shouldSort: false,
        placeholder: true,
        placeholderValue: 'Cari & Pilih Unit...',
        searchPlaceholderValue: 'Cari Unit...',
        itemSelectText: 'Pilih',
        noResultsText: 'Unit tidak ditemukan',
        noChoicesText: 'Unit tidak tersedia'
    });
}

async function generateNoAgendaOtomatis() {
    const today = new Date();
    const tahun = today.getFullYear();
    const bulan = String(today.getMonth() + 1).padStart(2, '0');
    let no_agenda = '';
    try {
        const result = await apiFetch(`${API_URL}?action=generate_no_agenda&tahun=${tahun}&bulan=${bulan}`);
        no_agenda = result && result.no_agenda ? result.no_agenda : '';
    } catch (e) {
        no_agenda = '';
    }
    return no_agenda;
}

function escapeHtml(s) {
    if (s == null) return '';
    return String(s).replace(/[&<>"']/g, m => (
        {'&':'&amp;','<':'&lt;','>':'&gt;','"':'&quot;',"'":'&#039;'}[m]
    ));
}
function escapeAttr(s) { return escapeHtml(s); }

function initModalDisposisiBubble() {
    const modal = document.getElementById('modal-disposisi-bubble');
    const body = document.getElementById('modalDisposisiBubbleBody');
    if (!modal || !body) return;
    const closeBtn = modal.querySelector('.modal-disposisi-close');
    document.body.addEventListener('click', async function(e) {
        const btn = e.target.closest('.btn-disposisi-bubble');
        if (btn) {
            const idSurat = btn.dataset.id;
            const infoSurat = {
                no_agenda: btn.dataset.no_agenda || '',
                perihal: btn.dataset.perihal || ''
            };
            await fetchAndShowBubbleDisposisi(idSurat, infoSurat);
            modal.style.display = 'flex';
            return;
        }
        if (e.target === closeBtn || e.target === modal) {
            modal.style.display = 'none'; body.innerHTML = '';
        }
    });
}

async function fetchAndShowBubbleDisposisi(idSurat, infoSurat) {
    const body = document.getElementById('modalDisposisiBubbleBody');
    let headerHTML = `
        <div class="bubble-modal-info">
            <div><b>No. Agenda:</b> ${escapeHtml(infoSurat.no_agenda || '-')}</div>
            <div><b>Perihal:</b> ${escapeHtml(infoSurat.perihal || '-')}</div>
        </div>
    `;
    body.innerHTML = '<div>Loading...</div>';
    try {
        const data = await apiFetch(`${API_URL}?action=disposisi_detail&id_surat=${idSurat}`);
        let bubbles = data.length
            ? data.map((item, idx) => {
                const posClass = idx % 2 === 0 ? 'bubble-left' : 'bubble-right';
                // ATTACHMENT
                let attachmentHTML = '';
                if (item.attachment_path && item.attachment_name) {
                    let ext = '';
                    if (item.attachment_name && typeof item.attachment_name === 'string') {
                        let exttemp = item.attachment_name.split('.');
                        if (exttemp.length > 1) ext = exttemp.pop().toLowerCase();
                    }
                    if (['jpg', 'jpeg', 'png', 'gif', 'bmp', 'webp'].includes(ext)) {
                        attachmentHTML = `<div class="bubble-attachment">
                            <img src="${escapeHtml(item.attachment_path)}" alt="${escapeHtml(item.attachment_name)}"
                                style="max-width:240px;max-height:160px;border-radius:6px;box-shadow:0 1px 7px #ccc;cursor:pointer;"
                                loading="lazy"
                                class="bubble-img-preview"
                                data-fullurl="${escapeHtml(item.attachment_path)}"
                                data-title="${escapeHtml(item.attachment_name)}"
                            >
                        </div>`;
                    } else if (ext === 'pdf') {
                        attachmentHTML = `<div class="bubble-attachment"><a href="${escapeHtml(item.attachment_path)}" target="_blank" class="btn-attachment-pdf"><i class="bx bxs-file-pdf"></i> PDF: ${escapeHtml(item.attachment_name)}</a></div>`;
                    } else if (['ppt','pptx'].includes(ext)) {
                        attachmentHTML = `<div class="bubble-attachment"><a href="${escapeHtml(item.attachment_path)}" target="_blank" class="btn-attachment-ppt"><i class="bx bxs-file"></i> PPTX: ${escapeHtml(item.attachment_name)}</a></div>`;
                    } else {
                        attachmentHTML = `<div class="bubble-attachment"><a href="${escapeHtml(item.attachment_path)}" download class="btn-attachment-other"><i class="bx bxs-file"></i> ${escapeHtml(item.attachment_name)}</a></div>`;
                    }
                }
                return `
                    <div class="bubble-row ${posClass}">
                        <div class="bubble-meta ${posClass}">
                            <span>${escapeHtml(item.nm_unit)}</span>
                            <span>${escapeHtml(item.user)}</span>
                            <span>${item.waktu}</span>
                        </div>
                        <div class="bubble-disposisi${item.is_aktif == 1 ? ' is-aktif' : ''} ${posClass}">
                            ${escapeHtml(item.isi_disposisi)}
                            ${attachmentHTML}
                        </div>
                    </div>
                `;
            }).join('')
            : '<div class="bubble-meta">Belum ada detail disposisi.</div>';
        body.innerHTML = headerHTML + bubbles;
    } catch (err) {
        body.innerHTML = `<div style="color:red">${err.message || 'Gagal memuat data disposisi.'}</div>`;
    }
}

// LIGHTBOX IMAGE ZOOM
function initImgZoomModal() {
    const imgModal = document.getElementById('modal-img-zoom');
    const imgTag = document.getElementById('modalImgZoomTag');
    const imgTitle = document.getElementById('modalImgZoomTitle');
    const closeBtn = imgModal.querySelector('.modal-img-zoom-close');
    document.body.addEventListener('click', function(e) {
        const imgPrev = e.target.closest('.bubble-img-preview');
        if (imgPrev) {
            imgModal.style.display = 'flex';
            imgTag.src = imgPrev.dataset.fullurl || imgPrev.src;
            imgTitle.textContent = imgPrev.dataset.title || '';
            return;
        }
        if (e.target === closeBtn || e.target === imgModal) {
            imgModal.style.display = 'none'; imgTag.src = ''; imgTitle.textContent = '';
        }
    });
}

export function initSuratMasukAdminPage() {
    if (document.readyState === 'loading') {
        document.addEventListener('DOMContentLoaded', initSuratMasukAdminPage);
        return;
    }
    const section = document.getElementById('surat-masuk-admin-section');
    if (!section) return;
    // --- DOM ---
    const tableBody = document.getElementById('table-body-suratMasukAdmin');
    const searchInput = document.getElementById('search-input-suratMasukAdmin');
    const entriesSelect = document.getElementById('entries-select-suratMasukAdmin');
    const filterVerifikasi = document.getElementById('filter-verifikasi-suratMasukAdmin');
    const filterStatus = document.getElementById('filter-status-suratMasukAdmin');
    const filterDisposisi = document.getElementById('filter-disposisi-suratMasukAdmin');
    const paginationInfo = document.getElementById('pagination-info-suratMasukAdmin');
    const paginationButtons = document.getElementById('pagination-buttons-suratMasukAdmin');
    const btnTambah = document.getElementById('btn-tambah-suratMasukAdmin');
    const modalTambahUbah = document.getElementById('suratMasukAdmin-modal-tambahUbah');
    const formTambahUbah = document.getElementById('suratMasukAdmin-form-tambahUbah');
    const modalTambahUbahTitle = document.getElementById('suratMasukAdmin-modal-tambahUbah-title');
    const modalValidasi = document.getElementById('suratMasukAdmin-modal-validasi');
    const formValidasi = document.getElementById('suratMasukAdmin-form-validasi');
    const validasiNoAgendaDisplay = document.getElementById('validasi-no_agenda_display');
    const validasiIdSuratInput = document.getElementById('validasi-id_surat');
    const modalDisposisi = document.getElementById('suratMasukAdmin-modal-disposisi');
    const formDisposisiTambah = document.getElementById('suratMasukAdmin-form-disposisi-tambah');
    const disposisiInfo = {
        idSurat: document.getElementById('disposisi-id_surat'),
        noAgenda: document.getElementById('disposisi-no_agenda'),
        perihal: document.getElementById('disposisi-perihal'),
        unitSelect: document.getElementById('disposisi-unit'),
        listContainer: document.getElementById('disposisi-list-container')
    };
    let state = {
        allData: [],
        filteredData: [],
        currentPage: 1,
        entriesPerPage: 10,
        searchTerm: '',
        verifikasiFilter: 'semua',
        statusFilter: 'belum_selesai',
        disposisiFilter: 'semua',
        unitList: []
    };

    function renderTable() {
        if (!tableBody) return;
        let data = state.allData.filter(surat => {
            const searchTerm = state.searchTerm.toLowerCase();
            const matchesSearch =
                !searchTerm ||
                (surat.no_agenda || '').toLowerCase().includes(searchTerm) ||
                (surat.no_surat || '').toLowerCase().includes(searchTerm) ||
                (surat.perihal || '').toLowerCase().includes(searchTerm) ||
                (surat.pengirim || '').toLowerCase().includes(searchTerm);
            const matchesVerifikasi =
                state.verifikasiFilter === 'semua' ||
                (state.verifikasiFilter === 'sudah' && surat.verifikasi === '1') ||
                (state.verifikasiFilter === 'belum' && surat.verifikasi === '0');
            const matchesStatus =
                (state.statusFilter === 'belum_selesai' && surat.stts_surat === 'Belum' && surat.is_aktif === '1') ||
                (state.statusFilter === 'selesai' && surat.stts_surat === 'Selesai' && surat.is_aktif === '1') ||
                (state.statusFilter === 'nonaktif' && surat.is_aktif === '0');
            const matchesDisposisi =
                state.disposisiFilter === 'semua' ||
                (state.disposisiFilter === 'belum' && (!surat.disposisi_summary || surat.disposisi_summary.trim() === '' || surat.disposisi_summary === 'Belum Ada')) ||
                (state.disposisiFilter === 'sudah' && surat.disposisi_summary && surat.disposisi_summary.trim() !== '' && surat.disposisi_summary !== 'Belum Ada');
            return matchesSearch && matchesVerifikasi && matchesStatus && matchesDisposisi;
        });
        state.filteredData = data;
        const totalPages = Math.ceil(data.length / state.entriesPerPage) || 1;
        if (state.currentPage > totalPages) state.currentPage = totalPages;
        const start = (state.currentPage - 1) * state.entriesPerPage;
        const pageData = data.slice(start, start + state.entriesPerPage);

        if (pageData.length === 0) {
            tableBody.innerHTML = `<tr><td colspan="6" style="text-align:center;">Data tidak ditemukan.</td></tr>`;
        } else {
            tableBody.innerHTML = pageData.map(surat => {
                const isVerified = surat.verifikasi === '1';
                const isFinal    = surat.stts_surat === 'Selesai';
                const isActive   = surat.is_aktif === '1';
                const rowClass   = isFinal ? 'row-selesai' : '';
                const selesaiBadge = isFinal ? ' <span class="badge-selesai">SELESAI</span>' : '';
                const agendaSuratCol = `<div class="text-primary-sma">${surat.no_agenda}</div><div class="text-secondary-sma">${surat.no_surat}</div>`;
                const asalTanggalCol = `<div>${escapeHtml(surat.pengirim)}</div><div class="text-secondary-sma">Tgl. Surat: ${new Date(surat.tgl_surat).toLocaleDateString('id-ID')}</div>`;
                const perihalFileCol = `<div>${escapeHtml(surat.perihal)}${selesaiBadge}</div>${surat.file_token ? `<button class="btn-link-sma btn-lihat-file-suratMasukAdmin" data-token="${surat.file_token}" data-filename="${escapeAttr(surat.file_surat)}"><i class='bx bxs-file-pdf'></i> Lihat File</button>` : '<span class="text-secondary-sma">Tanpa File</span>'}`;
                const verifikasiCol = isVerified ? `<span class="status-chip-sma success">Sudah<br><small>Oleh: ${surat.user_verif || '-'}</small></span>` : `<span class="status-chip-sma warning">Belum</span>`;
                const hasDisposisi = surat.disposisi_summary && surat.disposisi_summary.trim() !== '' && surat.disposisi_summary !== 'Belum Ada';
                const disposisiSummary = hasDisposisi ? surat.disposisi_summary.split(';').length + ' Unit' : 'Belum Ada';
                const disposisiCol = hasDisposisi
                    ? `<button class="btn-disposisi-bubble"
                        data-id="${surat.id_surat}"
                        data-no_agenda="${escapeAttr(surat.no_agenda || '')}"
                        data-perihal="${escapeAttr(surat.perihal || '')}"
                    >${disposisiSummary}</button>`
                    : `<span class="disposisi-summary-sma">${disposisiSummary}</span>`;
                const keteranganCol = `<div>${escapeHtml(surat.krtl)}</div>`;
                const jenisSuratCol = `<span>${escapeHtml(surat.j_surat)}</span>`;
                const sifatSuratCol = `<span>${escapeHtml(surat.s_surat)}</span>`;
                const prioritasSuratCol = `<span>${escapeHtml(surat.p_surat)}</span>`;
                const aksiDropdown = `
                    <div class="aksi-dropdown">
                        ${isActive && !isVerified && !isFinal ? `<button type="button" class="aksi-dropdown-item aksi-validasi" data-id="${surat.id_surat}" data-agenda="${surat.no_agenda}"><i class='bx bx-check-shield'></i> Validasi</button>` : ''}
                        ${(isActive && isVerified && !isFinal) ? `<button type="button" class="aksi-dropdown-item aksi-disposisi" data-id="${surat.id_surat}"><i class='bx bx-git-branch'></i> Disposisi</button>` : ''}
                        ${isActive && !isVerified && !isFinal ? `<button type="button" class="aksi-dropdown-item aksi-ubah" data-id="${surat.id_surat}"><i class='bx bx-edit-alt'></i> Ubah</button>` : ''}
                        <button type="button" class="aksi-dropdown-item aksi-toggle-final" data-id="${surat.id_surat}">${isFinal ? "<i class='bx bx-revision'></i> Batal Final" : "<i class='bx bx-check-double'></i> Finalkan"}</button>
                        ${(isActive && !isFinal) ? `<button type="button" class="aksi-dropdown-item aksi-toggle-active warning" data-id="${surat.id_surat}"><i class='bx bx-archive-out'></i> Non-Aktifkan</button>` : (isActive ? '' : `<button type="button" class="aksi-dropdown-item aksi-toggle-active success" data-id="${surat.id_surat}"><i class='bx bx-archive-in'></i> Aktifkan</button>`)}
                    </div>`;
                return `
                    <tr class="${rowClass}">
                        <td data-label="No. Agenda & Surat">${agendaSuratCol}</td>
                        <td data-label="Asal & Tgl Surat">${asalTanggalCol}</td>
                        <td data-label="Perihal & File">${perihalFileCol}</td>
                        <td data-label="Keterangan">${keteranganCol}</td>
                        <td data-label="Jenis Surat">${jenisSuratCol}</td>
                        <td data-label="Sifat Surat">${sifatSuratCol}</td>
                        <td data-label="Prioritas Surat">${prioritasSuratCol}</td>
                        <td data-label="Verifikasi">${verifikasiCol}</td>
                        <td data-label="Disposisi">${disposisiCol}</td>
                        <td data-label="Aksi" class="aksi-suratMasukAdmin">
                            <button type="button" class="btn-aksi-menu"><i class='bx bx-dots-vertical-rounded'></i></button>
                            ${aksiDropdown}
                        </td>
                    </tr>`;
            }).join('');
        }
        renderPagination(totalPages, data.length, start, pageData.length);
    }

    function renderPagination(totalPages, totalEntries, start, pageLength) {
        if (paginationInfo) {
            const startEntry = totalEntries > 0 ? start + 1 : 0;
            const endEntry = start + pageLength;
            paginationInfo.textContent = `Menampilkan ${startEntry} - ${endEntry} dari ${totalEntries} data`;
        }
        if (!paginationButtons) return;
        paginationButtons.innerHTML = '';
        const makeBtn = (label, disabled, handler, active = false) => {
            const b = document.createElement('button'); b.innerHTML = label; b.disabled = disabled;
            if (active) b.classList.add('active');
            b.addEventListener('click', handler); return b;
        };
        paginationButtons.appendChild(makeBtn('&laquo;', state.currentPage === 1, () => { if (state.currentPage > 1) { state.currentPage--; renderTable(); } }));
        for (let i = 1; i <= totalPages; i++) {
            paginationButtons.appendChild(makeBtn(i, false, () => { state.currentPage = i; renderTable(); }, i === state.currentPage));
        }
        paginationButtons.appendChild(makeBtn('&raquo;', state.currentPage === totalPages, () => { if(state.currentPage < totalPages) { state.currentPage++; renderTable(); } }));
    }

    function openModal(modal) { modal.style.display = 'flex'; setTimeout(() => modal.classList.add('active'), 10); document.body.style.overflow = 'hidden'; }
    function closeModal(modal) { modal.classList.remove('active'); setTimeout(() => { modal.style.display = 'none'; }, 300); document.body.style.overflow = ''; }

    async function loadInitialData() {
        tableBody.innerHTML = `<tr><td colspan="6" style="text-align:center;">Memuat data...</td></tr>`;
        try {
            const [suratData, unitData] = await Promise.all([apiFetch(API_URL), apiFetch(UNIT_API_URL)]);
            state.allData = Array.isArray(suratData) ? suratData : [];
            state.unitList = Array.isArray(unitData) ? unitData : [];
            renderTable();
        } catch (err) {
            tableBody.innerHTML = `<tr><td colspan="6" style="text-align:center; color:red;">Gagal memuat data.</td></tr>`;
            swError(err.message || 'Gagal memuat data awal.');
        }
    }

    function setupEventListeners() {
        searchInput.addEventListener('input', e => { state.searchTerm = e.target.value; state.currentPage = 1; renderTable(); });
        entriesSelect.addEventListener('change', e => { state.entriesPerPage = parseInt(e.target.value, 10); state.currentPage = 1; renderTable(); });
        filterVerifikasi.addEventListener('change', e => { state.verifikasiFilter = e.target.value; state.currentPage = 1; renderTable(); });
        filterStatus.addEventListener('change', e => { state.statusFilter = e.target.value; state.currentPage = 1; renderTable(); });
        filterDisposisi.addEventListener('change', e => { state.disposisiFilter = e.target.value; state.currentPage = 1; renderTable(); });
        btnTambah.addEventListener('click', async () => {
            formTambahUbah.reset();
            modalTambahUbahTitle.textContent = 'Tambah Surat Masuk Baru';
            document.getElementById('tambahUbah-id_surat').value = '';
            document.getElementById('label-file_surat').textContent = 'File Surat (Format .pdf, Wajib)';
            document.getElementById('tambahUbah-file_surat').required = true;
            const noAgendaInput = document.getElementById('tambahUbah-no_agenda');
            noAgendaInput.value = await generateNoAgendaOtomatis();
            noAgendaInput.readOnly = true;
            document.getElementById('tambahUbah-j_lampiran').value = '-';
            openModal(modalTambahUbah);
        });
        document.querySelectorAll('.modal-close-suratMasukAdmin, .btn-secondary-suratMasukAdmin').forEach(el => {
            el.addEventListener('click', e => {
                const modalId = e.target.dataset.modalId;
                const modalToClose = document.getElementById(modalId);
                if (modalToClose) closeModal(modalToClose);
            });
        });
        tableBody.addEventListener('click', async (e) => {
            const target = e.target;
            const aksiMenuBtn = target.closest('.btn-aksi-menu');
            if (aksiMenuBtn) {
                const dropdown = aksiMenuBtn.nextElementSibling;
                document.querySelectorAll('.aksi-dropdown.show').forEach(d => d !== dropdown && d.classList.remove('show'));
                dropdown.classList.toggle('show');
                return;
            }
            if (target.closest('.btn-lihat-file-suratMasukAdmin')) {
                const tokenFile = target.closest('.btn-lihat-file-suratMasukAdmin').dataset.token;
                const fileName = target.closest('.btn-lihat-file-suratMasukAdmin').dataset.filename;
                const filePath = `backend/view_file.php?token=${tokenFile}`;
                openPdfModal(document.getElementById('pdf-modal'), filePath, { title: `Dokumen: ${fileName}`, token: tokenFile });
                return;
            }
            const id = target.closest('.aksi-dropdown-item')?.dataset.id;
            if (!id) return;
            const surat = state.allData.find(s => String(s.id_surat) === String(id));
            if (!surat) return;
            if (target.closest('.aksi-ubah')) {
                formTambahUbah.reset();
                modalTambahUbahTitle.textContent = 'Ubah Surat Masuk';
                Object.keys(surat).forEach(key => {
                    const input = document.getElementById(`tambahUbah-${key}`);
                    if (input && surat[key] != null && key !== "file_surat") input.value = surat[key];
                });
                document.getElementById('tambahUbah-id_surat').value = surat.id_surat;
                document.getElementById('label-file_surat').textContent = 'Ganti File Surat (Opsional)';
                document.getElementById('tambahUbah-file_surat').required = false;
                openModal(modalTambahUbah);
            }
            else if (target.closest('.aksi-validasi')) {
                validasiIdSuratInput.value = surat.id_surat;
                validasiNoAgendaDisplay.textContent = surat.no_agenda;
                formValidasi.reset();
                openModal(modalValidasi);
            }
            else if (target.closest('.aksi-disposisi')) {
                disposisiInfo.idSurat.value = surat.id_surat;
                disposisiInfo.noAgenda.textContent = surat.no_agenda;
                disposisiInfo.perihal.textContent = surat.perihal;
                await loadAndRenderDisposisiList(surat.id_surat);
                openModal(modalDisposisi);
            }
            else if (target.closest('.aksi-toggle-final')) {
                const isFinal = surat.stts_surat === 'Selesai';
                const conf = await swConfirm(`Anda yakin ingin ${isFinal ? 'membatalkan status final' : 'menyelesaikan'} surat ini?`);
                if(conf.isConfirmed) handleSimpleAction({ action: 'toggle_final', id_surat: id });
            }
            else if (target.closest('.aksi-toggle-active')) {
                const isActive = surat.is_aktif === '1';
                const conf = await swConfirm(`Anda yakin ingin ${isActive ? 'menonaktifkan' : 'mengaktifkan kembali'} surat ini?`);
                if(conf.isConfirmed) handleSimpleAction({ action: 'toggle_active', id_surat: id });
            }
        });
        formTambahUbah.addEventListener('submit', handleFormSubmit);
        formValidasi.addEventListener('submit', handleFormSubmit);
        formDisposisiTambah.addEventListener('submit', handleDisposisiAdd);
        disposisiInfo.listContainer.addEventListener('click', async (e) => {
            const deleteBtn = e.target.closest('.btn-delete-disposisi-sma');
            if (deleteBtn) {
                const id_surat = deleteBtn.dataset.id;
                const kd_unit = deleteBtn.dataset.unit;
                const unit_nama = deleteBtn.dataset.nama;
                const conf = await swConfirm(`Hapus disposisi ke unit "${unit_nama}"?`);
                if (conf.isConfirmed) {
                    await handleSimpleAction({ action: 'delete_disposisi', id_surat, kd_unit }, false);
                    await loadAndRenderDisposisiList(id_surat);
                }
            }
            const remindBtn = e.target.closest('.btn-remind-wa-sma');
            if (remindBtn) {
                const id_surat = remindBtn.dataset.id;
                const kd_unit = remindBtn.dataset.unit;
                try {
                    remindBtn.disabled = true;
                    remindBtn.innerHTML = "<i class='bx bx-loader-alt bx-spin'></i> Kirim...";
                    const result = await apiFetch("backend/reminder/api_kirim_disposisi.php", {
                        method: "POST",
                        body: JSON.stringify({id_surat, kd_unit})
                    });
                    swSuccess(result.message || 'Pesan pengingat berhasil dikirim.');
                } catch (err) {
                    swError(err.message || "Gagal mengirim pengingat!");
                } finally {
                    remindBtn.disabled = false;
                    remindBtn.innerHTML = "<i class='bx bxl-whatsapp'></i> Ingatkan";
                }
            }
            const detailBtn = e.target.closest('.open-modal-remind-detail');
            if(detailBtn) {
                const id_surat = detailBtn.dataset.id;
                const kd_unit = detailBtn.dataset.unit;
                swError("Fitur 'Lihat Riwayat' belum diimplementasikan di frontend.");
            }
        });
        window.addEventListener('click', function(e) {
            if (!e.target.closest('.aksi-suratMasukAdmin')) {
                document.querySelectorAll('.aksi-dropdown.show').forEach(d => d.classList.remove('show'));
            }
        });
    }

    async function handleFormSubmit(e) {
        e.preventDefault();
        const noAgendaInput = document.getElementById('tambahUbah-no_agenda');
        const noAgenda = noAgendaInput.value.trim();
        try {
            const res = await apiFetch(`${API_URL}?action=cek_duplikat_agenda&no_agenda=${encodeURIComponent(noAgenda)}`);
            if (res && res.exists) {
                const newNoAgenda = await generateNoAgendaOtomatis();
                noAgendaInput.value = newNoAgenda || '(Gagal mendapatkan nomor agenda baru)';
                noAgendaInput.focus();
                await Swal.fire({
                    title: 'Nomor Agenda Duplikat',
                    text: 'Nomor agenda sudah dipakai surat lain. Telah diganti otomatis. Silakan cek dan klik Simpan ulang.',
                    icon: 'warning'
                });
                return;
            }
        } catch (err) {
            const newNoAgenda = await generateNoAgendaOtomatis();
            noAgendaInput.value = newNoAgenda || '(Gagal mendapatkan nomor agenda baru)';
            noAgendaInput.focus();
            await Swal.fire({
                title: 'Gagal cek No Agenda',
                text: 'Nomor agenda gagal dicek/ganda/no agenda kosong. Telah diganti otomatis. Silakan cek dan klik Simpan ulang.',
                icon: 'error'
            });
            return;
        }
        const noSuratInput = document.getElementById('tambahUbah-no_surat');
        if (/\s/.test(noSuratInput.value)) {
            swError('No. Surat tidak boleh mengandung spasi. Mohon perbaiki!');
            noSuratInput.focus();
            return;
        }
        const form = e.target;
        const submitBtn = form.querySelector('button[type="submit"]');
        const originalText = submitBtn.innerHTML;
        submitBtn.disabled = true;
        submitBtn.innerHTML = "<i class='bx bx-loader-alt bx-spin'></i> Menyimpan...";
        let body;
        let opts = { method: 'POST' };
        if (form.id === 'suratMasukAdmin-form-tambahUbah') {
            body = new FormData(form);
            body.append('action', body.get('id_surat') ? 'update' : 'create');
            opts.body = body;
        } else {
            const formData = new FormData(form);
            const data = Object.fromEntries(formData.entries());
            data.action = form.id === 'suratMasukAdmin-form-validasi' ? 'validate' : '';
            body = JSON.stringify(data);
            opts.body = body;
        }
        try {
            const res = await apiFetch(API_URL, opts);
            swSuccess(res.message);
            closeModal(form.closest('.modal-container-suratMasukAdmin'));
            await loadInitialData();
        } catch (err) {
            swError(err.message || "Terjadi kesalahan.");
        } finally {
            submitBtn.disabled = false;
            submitBtn.innerHTML = originalText;
        }
    }

    async function handleSimpleAction(payload, reload = true) {
        try {
            const res = await apiFetch(API_URL, {
                method: 'POST',
                body: JSON.stringify(payload)
            });
            swSuccess(res.message);
            if (reload) await loadInitialData();
        } catch (err) {
            swError(err.message);
        }
    }

    async function loadAndRenderDisposisiList(id_surat) {
        disposisiInfo.listContainer.innerHTML = '<p>Memuat daftar...</p>';
        try {
            const disposisiList = await apiFetch(API_URL, {
                method: 'POST',
                body: JSON.stringify({ action: 'get_disposisi_units', id_surat })
            });
            let tableHTML = `
            <div class="disposisi-unit-table-wrap">
                <table class="disposisi-unit-table">
                <thead>
                    <tr>
                    <th>No.</th>
                    <th>Unit</th>
                    <th>Dibagikan Oleh</th>
                    <th>Waktu Distribusi</th>
                    <th>Aksi/Status</th>
                    <th>Riwayat di Ingatkan</th>
                    </tr>
                </thead>
                <tbody>
                    ${disposisiList.map((item, i) => `
                    <tr>
                        <td data-label="No.">${i+1}</td>
                        <td data-label="Unit">${item.nm_unit}</td>
                        <td data-label="Dibagikan Oleh">${item.user}</td>
                        <td data-label="Waktu Distribusi">${item.waktu ? new Date(item.waktu).toLocaleString('id-ID') : '-'}</td>
                        <td data-label="Aksi/Status">
                        ${item.is_balas == 1
                            ? `<span class="badge-status dijawab">Sudah di jawab</span>`
                            : `
                            <button class="btn-delete-disposisi-sma" data-id="${item.id_surat}" data-unit="${item.kd_unit}">
                                <i class="bx bx-minus-circle"></i> Hapus
                            </button>
                            <button type="button" class="btn-remind-wa-sma" data-id="${item.id_surat}" data-unit="${item.kd_unit}">
                                <i class="bx bxl-whatsapp"></i> Ingatkan
                            </button>
                            <span class="badge-status belum">Belum di jawab</span>
                            `}
                        </td>
                        <td data-label="Riwayat di Ingatkan">
                        <button class="open-modal-remind-detail" data-id="${item.id_surat}" data-unit="${item.kd_unit}">
                            ${item.remind_count || 0} X, Lihat
                        </button>
                        </td>
                    </tr>
                    `).join('')}
                </tbody>
                </table>
            </div>
            `;
            disposisiInfo.listContainer.innerHTML = tableHTML;
            disposisiInfo.unitSelect.innerHTML = state.unitList.map(
                u => `<option value="${u.kd_unit}">${u.nm_unit}</option>`
            ).join('');
            initUnitSelectChoices();
        } catch (err) {
            disposisiInfo.listContainer.innerHTML = `<p style="color:red;">${err.message}</p>`;
        }
    }

    async function handleDisposisiAdd(e) {
        e.preventDefault();
        const id_surat = disposisiInfo.idSurat.value;
        let kd_units = [];
        if (unitChoices) {
            kd_units = unitChoices.getValue(true);
        } else {
            const options = Array.from(disposisiInfo.unitSelect.selectedOptions);
            kd_units = options.map(opt => opt.value);
        }
        if (!kd_units.length) {
            swError("Pilih minimal satu unit disposisi.");
            return;
        }
        for (const kd_unit of kd_units) {
            await handleSimpleAction({action: 'add_disposisi', id_surat, kd_unit}, false);
        }
        await loadAndRenderDisposisiList(id_surat);
        if (unitChoices) unitChoices.removeActiveItems();
        await loadInitialData();
    }

    // SPA: SPA section mutation & first render
    let loadedOnce = false;
    const observer = new MutationObserver(() => {
        const isNowActive = section.classList.contains('active');
        if (isNowActive && !loadedOnce) {
            setupEventListeners();
            loadInitialData();
            loadedOnce = true;
            initModalDisposisiBubble();
            initImgZoomModal();
        }
    });
    observer.observe(section, { attributes: true, attributeFilter: ['class'] });
    if (section.classList.contains('active')) {
        if (!loadedOnce) {
            setupEventListeners();
            loadInitialData();
            loadedOnce = true;
            initModalDisposisiBubble();
            initImgZoomModal();
        }
    }
}