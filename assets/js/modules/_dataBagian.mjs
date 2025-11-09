// File: assets/js/modules/_dataBagian.mjs (Diperbaiki: modal handling, response handling, validasi)
let currentEditKode = null;
let bagianState = {
    allData: [],
    filteredData: [],
    currentPage: 1,
    entriesPerPage: 10,
    searchTerm: ''
};

function renderBagianPagination() {
    const totalEntries = bagianState.filteredData.length;
    const totalPages = Math.ceil(totalEntries / bagianState.entriesPerPage) || 1;
    const infoEl = document.getElementById('pagination-info-bagian');
    const buttonsEl = document.getElementById('pagination-buttons-bagian');
    if (!infoEl || !buttonsEl) return;
    if (totalEntries === 0) {
        infoEl.textContent = '';
        buttonsEl.innerHTML = '';
        return;
    }
    const startEntry = (bagianState.currentPage - 1) * bagianState.entriesPerPage + 1;
    const endEntry = Math.min(startEntry + bagianState.entriesPerPage - 1, totalEntries);
    infoEl.textContent = `Menampilkan ${startEntry} - ${endEntry} dari ${totalEntries} data`;
    buttonsEl.innerHTML = '';
    const prevButton = document.createElement('button');
    prevButton.innerHTML = '&laquo;';
    prevButton.disabled = bagianState.currentPage === 1;
    prevButton.onclick = () => { if (bagianState.currentPage > 1) { bagianState.currentPage--; renderBagianTable(); } };
    buttonsEl.appendChild(prevButton);
    for (let i = 1; i <= totalPages; i++) {
        const pageButton = document.createElement('button');
        pageButton.textContent = i;
        if (i === bagianState.currentPage) pageButton.classList.add('active');
        pageButton.onclick = () => { bagianState.currentPage = i; renderBagianTable(); };
        buttonsEl.appendChild(pageButton);
    }
    const nextButton = document.createElement('button');
    nextButton.innerHTML = '&raquo;';
    nextButton.disabled = bagianState.currentPage === totalPages;
    nextButton.onclick = () => { if (bagianState.currentPage < totalPages) { bagianState.currentPage++; renderBagianTable(); } };
    buttonsEl.appendChild(nextButton);
}

function renderBagianTable() {
    const tableBody = document.getElementById('table-body-bagian');
    if (!tableBody) return;
    const searchTerm = bagianState.searchTerm.toLowerCase();
    bagianState.filteredData = bagianState.allData.filter(unit =>
        String(unit.kd_unit || '').toLowerCase().includes(searchTerm) ||
        String(unit.nm_unit || '').toLowerCase().includes(searchTerm)
    );
    bagianState.currentPage = Math.min(bagianState.currentPage, Math.ceil(bagianState.filteredData.length / bagianState.entriesPerPage) || 1);
    const paginatedData = bagianState.filteredData.slice(
        (bagianState.currentPage - 1) * bagianState.entriesPerPage,
        bagianState.currentPage * bagianState.entriesPerPage
    );
    tableBody.innerHTML = '';
    if (paginatedData.length === 0) {
        tableBody.innerHTML = `<tr><td colspan="4" style="text-align:center;">Data tidak ditemukan.</td></tr>`;
        renderBagianPagination();
        return;
    }
    paginatedData.forEach((unit, index) => {
        const globalIndex = (bagianState.currentPage - 1) * bagianState.entriesPerPage + index + 1;
        const row = `
            <tr>
                <td data-label="No">${globalIndex}</td>
                <td data-label="Kode Bagian">${unit.kd_unit}</td>
                <td data-label="Nama Bagian">${unit.nm_unit}</td>
                <td data-label="Aksi">
                    <button class="btn-dsi btn-info-dsi btn-edit-bagian" data-kode="${unit.kd_unit}" data-nama="${unit.nm_unit}">
                        <i class='bx bx-edit'></i> Ubah
                    </button>
                </td>
            </tr>
        `;
        tableBody.insertAdjacentHTML('beforeend', row);
    });
    renderBagianPagination();
}

async function fetchBagianData(force = false) {
    if (bagianState.allData.length > 0 && !force) {
        renderBagianTable();
        return;
    }
    const tableBody = document.getElementById('table-body-bagian');
    if(tableBody) tableBody.innerHTML = `<tr><td colspan="4" style="text-align:center;">Memuat data...</td></tr>`;
    const data = await processBagian('read');
    // toleran terhadap response berbentuk { data: [...] } atau langsung array
    if (Array.isArray(data)) {
        bagianState.allData = data;
    } else if (data && Array.isArray(data.data)) {
        bagianState.allData = data.data;
    } else if (data && typeof data === 'object' && data !== null && data.length === undefined) {
        // kalau backend mengirim object single (misal read by single), wrap
        bagianState.allData = Array.isArray(data) ? data : (data.items || []);
    } else {
        bagianState.allData = data || [];
    }
    renderBagianTable();
}

async function processBagian(action, data = {}) {
    const token = localStorage.getItem('jwt_token');
    try {
        const url = action === 'read' ? 'backend/CRUD/api_get_units.php' : 'backend/CRUD/api_process_unit.php';
        const options = {
            method: action === 'read' ? 'GET' : 'POST',
            headers: { 'Authorization': `Bearer ${token}`, 'Content-Type': 'application/json' },
        };
        if (action !== 'read') {
            options.body = JSON.stringify({ action, ...data });
        }
        const response = await fetch(url, options);
        // dapatkan text dulu agar tidak error jika bukan json
        const txt = await response.text();
        let result;
        try {
            result = txt ? JSON.parse(txt) : null;
        } catch (e) {
            // bukan json -> lempar
            throw new Error('Response bukan JSON dari server.');
        }
        if (!response.ok) {
            // jika ada message
            const msg = result?.message || result?.msg || 'Terjadi kesalahan server.';
            throw new Error(msg);
        }
        return result;
    } catch (error) {
        console.error("processBagian error:", error);
        // hanya tampilkan swal jika bukan operasi read (untuk menghindari popup saat load)
        if (action !== 'read') {
            Swal.fire('Gagal!', error.message || 'Terjadi kesalahan.', 'error');
        } else {
            // untuk read, tampilkan console + notifikasi ringan
            console.warn('Gagal memuat data bagian:', error.message);
        }
        return null;
    }
}

export function initDataBagianPage() {
    console.log("DEBUG: initDataBagianPage() dijalankan.");
    const section = document.getElementById('data-unit-section');
    const modal = document.getElementById('bagian-modal');
    const form = document.getElementById('bagian-form');
    const modalTitle = document.getElementById('bagian-modal-title');
    const kodeInput = document.getElementById('bagian-kode');
    const namaInput = document.getElementById('bagian-nama');
    const btnTambah = document.getElementById('btn-tambah-bagian');
    const btnCancel = document.getElementById('bagian-cancel-btn');
    const btnClose = document.getElementById('bagian-modal-close');
    const tableBody = document.getElementById('table-body-bagian');
    const searchInput = document.getElementById('search-input-bagian');
    const entriesSelect = document.getElementById('entries-select-bagian');

    if (!section) return;

    // helper show / hide modal (toleran jika ada inline style)
    const showModal = () => {
        if (!modal) return;
        modal.style.display = 'flex';
        modal.classList.add('active');
        // fokus ke input nama jika create, atau ke nama saat edit
        setTimeout(() => {
            const target = currentEditKode ? namaInput : kodeInput;
            target?.focus();
        }, 80);
    };
    const hideModal = () => {
        if (!modal) return;
        modal.classList.remove('active');
        // menyembunyikan dengan style supaya inline tidak memblok
        modal.style.display = 'none';
    };

    // klik di luar konten modal -> tutup
    if (modal) {
        modal.addEventListener('click', (ev) => {
            if (ev.target === modal) hideModal();
        });
        // tutup dengan Esc
        document.addEventListener('keydown', (ev) => {
            if (ev.key === 'Escape') hideModal();
        });
    }

    let hasFetched = false;
    const observer = new MutationObserver((mutations) => {
        if (mutations[0].attributeName === 'class' && section.classList.contains('active') && !hasFetched) {
            fetchBagianData();
            hasFetched = true;
        }
    });
    observer.observe(section, { attributes: true });

    searchInput?.addEventListener('input', () => {
        bagianState.searchTerm = searchInput.value;
        bagianState.currentPage = 1;
        renderBagianTable();
    });
    
    entriesSelect?.addEventListener('change', () => {
        bagianState.entriesPerPage = parseInt(entriesSelect.value, 10);
        bagianState.currentPage = 1;
        renderBagianTable();
    });

    btnTambah?.addEventListener('click', () => {
        console.log("DEBUG: Tombol 'Tambah Bagian' diklik.");
        currentEditKode = null;
        modalTitle.textContent = 'Tambah Bagian Baru';
        form.reset();
        kodeInput.readOnly = false;
        kodeInput.value = '';
        namaInput.value = '';
        showModal();
    });

    const closeModal = hideModal;
    btnCancel?.addEventListener('click', closeModal);
    btnClose?.addEventListener('click', closeModal);

    tableBody?.addEventListener('click', e => {
        const editBtn = e.target.closest('.btn-edit-bagian');
        if (editBtn) {
            console.log("DEBUG: Tombol 'Ubah' diklik.", editBtn.dataset);
            currentEditKode = editBtn.dataset.kode;
            modalTitle.textContent = `Ubah Nama Bagian (${currentEditKode})`;
            form.reset();
            kodeInput.value = currentEditKode;
            kodeInput.readOnly = true;
            namaInput.value = editBtn.dataset.nama || '';
            showModal();
        }
    });

    form?.addEventListener('submit', e => {
        e.preventDefault();
        // validasi ringan
        const kd = (kodeInput.value || '').trim();
        const nm = (namaInput.value || '').trim();
        if (!kd || !nm) {
            Swal.fire('Peringatan', 'Kode dan Nama Bagian wajib diisi.', 'warning');
            return;
        }

        const action = currentEditKode ? 'update' : 'create';
        const title = currentEditKode ? 'Ubah Data?' : 'Simpan Bagian Baru?';
        
        Swal.fire({
            title: title,
            icon: 'question',
            showCancelButton: true,
            confirmButtonText: 'Ya, Simpan!',
            cancelButtonText: 'Batal'
        }).then(async (result) => {
            if (result.isConfirmed) {
                const data = { kd_unit: kd, nm_unit: nm };
                console.log("DEBUG: Mengirim data ke server:", action, data);
                const successResult = await processBagian(action, data);
                console.log("DEBUG: Hasil processBagian:", successResult);
                if (successResult) {
                    closeModal();
                    Swal.fire('Berhasil!', successResult.message || 'Operasi berhasil.', 'success');
                    fetchBagianData(true);
                }
            }
        });
    });
}
