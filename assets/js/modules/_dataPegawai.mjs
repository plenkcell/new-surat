// File: assets/js/modules/_dataPegawai.mjs (Final Fix Version)
let currentEditNip = null;

let pegawaiState = {
    allData: [],
    filteredData: [],
    currentPage: 1,
    entriesPerPage: 10,
    searchTerm: ''
};

function renderPegawaiPagination() {
    const totalEntries = pegawaiState.filteredData.length;
    const totalPages = Math.ceil(totalEntries / pegawaiState.entriesPerPage) || 1;
    const infoEl = document.getElementById('pagination-info-pegawai');
    const buttonsEl = document.getElementById('pagination-buttons-pegawai');
    if (!infoEl || !buttonsEl) return;

    if (totalEntries === 0) {
        infoEl.textContent = '';
        buttonsEl.innerHTML = '';
        return;
    }

    const startEntry = (pegawaiState.currentPage - 1) * pegawaiState.entriesPerPage + 1;
    const endEntry = Math.min(startEntry + pegawaiState.entriesPerPage - 1, totalEntries);
    infoEl.textContent = `Menampilkan ${startEntry} - ${endEntry} dari ${totalEntries} data`;

    buttonsEl.innerHTML = '';

    const makeBtn = (label, disabled, handler, isActive = false) => {
        const btn = document.createElement('button');
        btn.innerHTML = label;
        btn.disabled = disabled;
        if (isActive) btn.classList.add('active');
        btn.addEventListener('click', handler);
        buttonsEl.appendChild(btn);
    };

    makeBtn('&laquo;', pegawaiState.currentPage === 1, () => {
        pegawaiState.currentPage--;
        renderPegawaiTable();
    });

    for (let i = 1; i <= totalPages; i++) {
        makeBtn(i, false, () => {
            pegawaiState.currentPage = i;
            renderPegawaiTable();
        }, i === pegawaiState.currentPage);
    }

    makeBtn('&raquo;', pegawaiState.currentPage === totalPages, () => {
        pegawaiState.currentPage++;
        renderPegawaiTable();
    });
}

function renderPegawaiTable() {
    const tableBody = document.getElementById('table-body-pegawai');
    if (!tableBody) return;

    const searchTerm = pegawaiState.searchTerm.toLowerCase();
    pegawaiState.filteredData = pegawaiState.allData.filter(p =>
        String(p.nip || '').toLowerCase().includes(searchTerm) ||
        String(p.nm_pegawai || '').toLowerCase().includes(searchTerm)
    );

    const totalPages = Math.ceil(pegawaiState.filteredData.length / pegawaiState.entriesPerPage) || 1;
    pegawaiState.currentPage = Math.min(pegawaiState.currentPage, totalPages);

    const paginatedData = pegawaiState.filteredData.slice(
        (pegawaiState.currentPage - 1) * pegawaiState.entriesPerPage,
        pegawaiState.currentPage * pegawaiState.entriesPerPage
    );

    tableBody.innerHTML = '';

    if (paginatedData.length === 0) {
        tableBody.innerHTML = `<tr><td colspan="8" style="text-align:center;">Data tidak ditemukan.</td></tr>`;
        renderPegawaiPagination();
        return;
    }

    paginatedData.forEach((pegawai, index) => {
        const globalIndex = (pegawaiState.currentPage - 1) * pegawaiState.entriesPerPage + index + 1;
        const statusClass = pegawai.is_aktif === 'Aktif' ? 'status-aktif' : 'status-nonaktif';
        const toggleText = pegawai.is_aktif === 'Aktif' ? 'Non-Aktifkan' : 'Aktifkan';
        const toggleIcon = pegawai.is_aktif === 'Aktif' ? 'bx-toggle-right' : 'bx-toggle-left';
        const toggleClass = pegawai.is_aktif === 'Aktif' ? 'btn-warning-dsi' : 'btn-success-dsi';

        const row = `
            <tr>
                <td>${globalIndex}</td>
                <td>${pegawai.nip}</td>
                <td>${pegawai.nm_pegawai}</td>
                <td>${pegawai.tgl_lahir}</td>
                <td>${pegawai.email}</td>
                <td>${pegawai.no_wa}</td>
                <td><span class="status-pegawai ${statusClass}">${pegawai.is_aktif}</span></td>
                <td>
                    <button class="btn-dsi btn-info-dsi btn-edit-pegawai" data-nip="${pegawai.nip}">
                        <i class='bx bx-edit'></i> Ubah
                    </button>
                    <button class="btn-dsi ${toggleClass} btn-toggle-status-pegawai"
                        data-nip="${pegawai.nip}" data-status="${pegawai.is_aktif}">
                        <i class='bx ${toggleIcon}'></i> ${toggleText}
                    </button>
                </td>
            </tr>
        `;
        tableBody.insertAdjacentHTML('beforeend', row);
    });

    renderPegawaiPagination();
}

async function fetchPegawaiData(force = false) {
    if (pegawaiState.allData.length > 0 && !force) {
        renderPegawaiTable();
        return;
    }

    const tableBody = document.getElementById('table-body-pegawai');
    if (tableBody) tableBody.innerHTML = `<tr><td colspan="8" style="text-align:center;">Memuat data...</td></tr>`;

    try {
        const token = localStorage.getItem('jwt_token');
        const res = await fetch('backend/CRUD/api_get_pegawai.php', {
            headers: { 'Authorization': `Bearer ${token}` }
        });
        const data = await res.json();
        pegawaiState.allData = Array.isArray(data) ? data : [];
        renderPegawaiTable();
    } catch (err) {
        Swal.fire('Gagal', 'Tidak dapat memuat data pegawai.', 'error');
    }
}

async function processPegawai(action, data = {}) {
    const token = localStorage.getItem('jwt_token');
    try {
        const res = await fetch('backend/CRUD/api_process_pegawai.php', {
            method: 'POST',
            headers: { 'Authorization': `Bearer ${token}`, 'Content-Type': 'application/json' },
            body: JSON.stringify({ action, ...data })
        });
        const result = await res.json();

        if (!result || !result.message) {
            throw new Error('Respon server tidak valid.');
        }

        return result;
    } catch (err) {
        Swal.fire('Gagal!', err.message, 'error');
        return null;
    }
}

export function initDataPegawaiPage() {
    const section = document.getElementById('data-pegawai-section');
    const modal = document.getElementById('pegawai-modal');
    const form = document.getElementById('pegawai-form');
    const modalTitle = document.getElementById('pegawai-modal-title');

    const nipInput = document.getElementById('pegawai-nip');
    const namaInput = document.getElementById('pegawai-nama');
    const tglLahirInput = document.getElementById('pegawai-tgl-lahir');
    const emailInput = document.getElementById('pegawai-email');
    const noWaInput = document.getElementById('pegawai-wa');

    const btnTambah = document.getElementById('btn-tambah-pegawai');
    const btnCancel = document.getElementById('pegawai-cancel-btn');
    const btnClose = document.getElementById('pegawai-modal-close');
    const tableBody = document.getElementById('table-body-pegawai');
    const searchInput = document.getElementById('search-input-pegawai');
    const entriesSelect = document.getElementById('entries-select-pegawai');

    if (!section) return;

    let hasFetched = false;
    const observer = new MutationObserver((mutations) => {
        if (mutations[0].attributeName === 'class' && section.classList.contains('active') && !hasFetched) {
            fetchPegawaiData();
            hasFetched = true;
        }
    });
    observer.observe(section, { attributes: true });

    const openModal = () => modal.classList.add('active');
    const closeModal = () => modal.classList.remove('active');

    btnTambah?.addEventListener('click', () => {
        currentEditNip = null;
        modalTitle.textContent = 'Tambah Pegawai Baru';
        form.reset();
        nipInput.readOnly = false;
        openModal();
    });

    btnCancel?.addEventListener('click', closeModal);
    btnClose?.addEventListener('click', closeModal);

    searchInput?.addEventListener('input', () => {
        pegawaiState.searchTerm = searchInput.value;
        pegawaiState.currentPage = 1;
        renderPegawaiTable();
    });

    entriesSelect?.addEventListener('change', () => {
        pegawaiState.entriesPerPage = parseInt(entriesSelect.value, 10);
        pegawaiState.currentPage = 1;
        renderPegawaiTable();
    });

    tableBody?.addEventListener('click', async (e) => {
        const editBtn = e.target.closest('.btn-edit-pegawai');
        const toggleBtn = e.target.closest('.btn-toggle-status-pegawai');

        if (editBtn) {
            const nip = editBtn.dataset.nip;
            const pegawai = pegawaiState.allData.find(p => p.nip === nip);
            if (!pegawai) return;

            currentEditNip = nip;
            modalTitle.textContent = `Ubah Data Pegawai (${nip})`;
            form.reset();
            nipInput.value = pegawai.nip;
            nipInput.readOnly = true;
            namaInput.value = pegawai.nm_pegawai;
            if (pegawai.tgl_lahir) {
                const [dd, mm, yyyy] = pegawai.tgl_lahir.split('-');
                tglLahirInput.value = `${yyyy}-${mm}-${dd}`;
            } else {
                tglLahirInput.value = '';
            }
            emailInput.value = pegawai.email || '';
            noWaInput.value = pegawai.no_wa || '';
            openModal();
        }

        if (toggleBtn) {
            const nip = toggleBtn.dataset.nip;
            const status = toggleBtn.dataset.status;
            const actionText = status === 'Aktif' ? 'menonaktifkan' : 'mengaktifkan';

            Swal.fire({
                title: 'Konfirmasi',
                text: `Apakah Anda yakin ingin ${actionText} pegawai dengan NIP ${nip}?`,
                icon: 'warning',
                showCancelButton: true,
                confirmButtonText: 'Ya, lanjutkan',
                cancelButtonText: 'Batal'
            }).then(async (result) => {
                if (result.isConfirmed) {
                    const success = await processPegawai('toggle_status', { nip, current_status: status });
                    if (success) {
                        Swal.fire('Berhasil!', success.message, 'success');
                        fetchPegawaiData(true);
                    }
                }
            });
        }
    });

    form?.addEventListener('submit', async (e) => {
        e.preventDefault();
        const action = currentEditNip ? 'update' : 'create';
        const title = currentEditNip ? 'Ubah Data Pegawai?' : 'Simpan Pegawai Baru?';

        Swal.fire({
            title: title,
            icon: 'question',
            showCancelButton: true,
            confirmButtonText: 'Ya, Simpan',
            cancelButtonText: 'Batal'
        }).then(async (result) => {
            if (result.isConfirmed) {
                const data = {
                    nip: nipInput.value.trim(),
                    nm_pegawai: namaInput.value.trim(),
                    tgl_lahir: tglLahirInput.value.trim(),
                    email: emailInput.value.trim(),
                    no_wa: noWaInput.value.trim()
                };
                const success = await processPegawai(action, data);
                if (success) {
                    closeModal();
                    Swal.fire('Berhasil!', success.message, 'success');
                    fetchPegawaiData(true);
                }
            }
        });
    });
}
