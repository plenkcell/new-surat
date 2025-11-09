// File: assets/js/modules/_dataStruktural.mjs
// Modul baru untuk mengelola halaman Data Struktural (Jabatan).

const API_URL = 'backend/CRUD/api_struktural.php';

// Fungsi notifikasi standar
function swSuccess(msg) {
    Swal.fire({ icon: 'success', title: 'Berhasil', text: msg, timer: 1500, showConfirmButton: false });
}
function swError(msg) {
    Swal.fire({ icon: 'error', title: 'Gagal', text: msg });
}
function swConfirm(text, confirmButtonText = 'Ya', cancelButtonText = 'Batal') {
    return Swal.fire({
        title: 'Konfirmasi',
        text,
        icon: 'warning',
        showCancelButton: true,
        confirmButtonText,
        cancelButtonText,
        confirmButtonColor: '#3085d6',
        cancelButtonColor: '#d33'
    });
}

// Fungsi Fetch API standar
async function apiFetch(url, opts = {}) {
    const token = localStorage.getItem('jwt_token');
    opts.headers = opts.headers || {};
    if (!(opts.body instanceof FormData)) {
        opts.headers['Content-Type'] = 'application/json';
    }
    if (token) opts.headers['Authorization'] = `Bearer ${token}`;

    const res = await fetch(url, opts);
    const txt = await res.text();
    let json = null;
    try { json = txt ? JSON.parse(txt) : null; } catch (e) { json = null; }

    if (!res.ok) {
        const msg = (json && json.message) ? json.message : `HTTP ${res.status}`;
        const err = new Error(msg);
        err.raw = json;
        throw err;
    }
    return json;
}

// Fungsi utama inisialisasi modul
export function initDataStrukturalPage() {
    if (document.readyState === 'loading') {
        document.addEventListener('DOMContentLoaded', initDataStrukturalPage);
        return;
    }

    const section = document.getElementById('data-struktural-section');
    if (!section) return;

    const ensureTableAndInit = () => {
        const tableBody = document.getElementById('table-body-struktural');
        if (!tableBody) return false;
        buildModule();
        return true;
    };

    if (!ensureTableAndInit()) {
        const mo = new MutationObserver((mut) => {
            if (ensureTableAndInit()) mo.disconnect();
        });
        mo.observe(document.body, { childList: true, subtree: true });
    }

    function buildModule() {
        // Elemen DOM
        const btnTambah = document.getElementById('btn-tambah-struktural');
        const modal = document.getElementById('struktural-modal');
        const modalTitle = document.getElementById('struktural-modal-title');
        const form = document.getElementById('struktural-form');
        const modalClose = document.getElementById('struktural-modal-close');
        const modalCancel = document.getElementById('struktural-cancel-btn');
        const inpId = document.getElementById('struktural-id');
        const inpNama = document.getElementById('struktural-nama');
        const tableBody = document.getElementById('table-body-struktural');
        const searchInput = document.getElementById('search-input-struktural');
        const entriesSelect = document.getElementById('entries-select-struktural');
        const paginationInfo = document.getElementById('pagination-info-struktural');
        const paginationButtons = document.getElementById('pagination-buttons-struktural');
        
        // State management
        let state = {
            allData: [],
            filteredData: [],
            currentPage: 1,
            entriesPerPage: parseInt(entriesSelect?.value || '10', 10),
            searchTerm: '',
        };
        let currentEditId = null;

        function renderPagination() {
            const total = state.filteredData.length;
            const perPage = state.entriesPerPage;
            const totalPages = Math.ceil(total / perPage) || 1;
            if (state.currentPage > totalPages) state.currentPage = totalPages;

            if (paginationInfo) {
                if (total === 0) {
                    paginationInfo.textContent = '';
                } else {
                    const start = (state.currentPage - 1) * perPage + 1;
                    const end = Math.min(start + perPage - 1, total);
                    paginationInfo.textContent = `Menampilkan ${start} - ${end} dari ${total} data`;
                }
            }

            if (!paginationButtons) return;
            paginationButtons.innerHTML = '';
            
            const makeBtn = (label, disabled, handler, active = false) => {
                const b = document.createElement('button');
                b.innerHTML = label;
                b.disabled = disabled;
                if (active) b.classList.add('active');
                b.addEventListener('click', handler);
                return b;
            };

            paginationButtons.appendChild(makeBtn('&laquo;', state.currentPage === 1, () => { if (state.currentPage > 1) { state.currentPage--; renderTable(); } }));
            for (let i = 1; i <= totalPages; i++) {
                paginationButtons.appendChild(makeBtn(i, false, () => { state.currentPage = i; renderTable(); }, i === state.currentPage));
            }
            paginationButtons.appendChild(makeBtn('&raquo;', state.currentPage === totalPages, () => { if(state.currentPage < totalPages) { state.currentPage++; renderTable(); } }));
        }

        function renderTable() {
            const q = state.searchTerm.toLowerCase();
            state.filteredData = state.allData.filter(item => 
                (item.nm_jabatan || '').toLowerCase().includes(q)
            );
            
            const perPage = state.entriesPerPage;
            const totalPages = Math.ceil(state.filteredData.length / perPage) || 1;
            if (state.currentPage > totalPages) state.currentPage = totalPages;
            const start = (state.currentPage - 1) * perPage;
            const pageData = state.filteredData.slice(start, start + perPage);

            if (pageData.length === 0) {
                tableBody.innerHTML = `<tr><td colspan="3" style="text-align:center;">Data tidak ditemukan.</td></tr>`;
            } else {
                tableBody.innerHTML = pageData.map(item => `
                    <tr>
                        <td data-label="ID Jabatan">${item.id_jabatan}</td>
                        <td data-label="Nama Jabatan">${escapeHtml(item.nm_jabatan)}</td>
                        <td data-label="Aksi" class="aksi-struktural">
                            <button class="btn-dsi btn-info-dsi btn-edit-struktural" data-id="${item.id_jabatan}"><i class='bx bx-edit'></i> Ubah</button>
                            <button class="btn-dsi btn-danger-dsi btn-delete-struktural" data-id="${item.id_jabatan}" data-nama="${escapeAttr(item.nm_jabatan)}"><i class='bx bx-trash'></i> Hapus</button>
                        </td>
                    </tr>
                `).join('');
            }
            renderPagination();
        }
        
        function escapeHtml(s) {
            if (s == null) return '';
            return String(s).replace(/[&<>"']/g, m => ({'&':'&amp;','<':'&lt;','>':'&gt;','"':'&quot;',"'":'&#039;'}[m]));
        }
        function escapeAttr(s) { return escapeHtml(s); }

        async function loadData() {
            tableBody.innerHTML = `<tr><td colspan="3" style="text-align:center;">Memuat data...</td></tr>`;
            try {
                const data = await apiFetch(API_URL);
                state.allData = Array.isArray(data) ? data : [];
                renderTable();
            } catch (err) {
                tableBody.innerHTML = `<tr><td colspan="3" style="text-align:center; color:red;">Gagal memuat data.</td></tr>`;
                swError(err.message || 'Gagal memuat data jabatan.');
            }
        }

        // Modal functions
        function openModal(isEdit = false, data = null) {
            form.reset();
            if (isEdit && data) {
                currentEditId = data.id_jabatan;
                modalTitle.textContent = 'Ubah Jabatan';
                inpId.value = data.id_jabatan;
                inpNama.value = data.nm_jabatan;
            } else {
                currentEditId = null;
                modalTitle.textContent = 'Tambah Jabatan Baru';
            }
            modal.style.display = 'flex';
            modal.classList.add('active');
            document.body.style.overflow = 'hidden';
        }

        function closeModal() {
            modal.classList.remove('active');
            setTimeout(() => { modal.style.display = 'none'; }, 300); // Tunggu animasi selesai
            document.body.style.overflow = '';
            currentEditId = null;
        }

        // Event listeners
        btnTambah.addEventListener('click', () => openModal(false));
        modalClose.addEventListener('click', closeModal);
        modalCancel.addEventListener('click', closeModal);
        modal.addEventListener('click', (e) => {
            if (e.target === modal) closeModal();
        });

        tableBody.addEventListener('click', async (e) => {
            const editBtn = e.target.closest('.btn-edit-struktural');
            const deleteBtn = e.target.closest('.btn-delete-struktural');

            if (editBtn) {
                const id = editBtn.dataset.id;
                const item = state.allData.find(d => d.id_jabatan == id);
                if (item) openModal(true, item);
            }

            if (deleteBtn) {
                const id = deleteBtn.dataset.id;
                const nama = deleteBtn.dataset.nama;
                const conf = await swConfirm(`Anda yakin ingin menghapus jabatan "${nama}"? Tindakan ini tidak bisa dibatalkan.`, 'Ya, Hapus', 'Batal');
                if (conf.isConfirmed) {
                    try {
                        const res = await apiFetch(API_URL, {
                            method: 'DELETE',
                            body: JSON.stringify({ id_jabatan: id })
                        });
                        swSuccess(res.message);
                        await loadData(); // Muat ulang data setelah berhasil hapus
                    } catch (err) {
                        swError(err.message || 'Gagal menghapus data.');
                    }
                }
            }
        });

        form.addEventListener('submit', async (e) => {
            e.preventDefault();
            const nm_jabatan = inpNama.value.trim();
            if (!nm_jabatan) {
                swError('Nama Jabatan tidak boleh kosong.');
                return;
            }

            const payload = { nm_jabatan };
            let method = 'POST';
            if (currentEditId) {
                payload.id_jabatan = currentEditId;
                method = 'PUT';
            }

            const confText = currentEditId ? 'Simpan perubahan pada jabatan ini?' : 'Tambahkan jabatan baru ini?';
            const conf = await swConfirm(confText, 'Ya, Simpan');
            
            if (conf.isConfirmed) {
                try {
                    const res = await apiFetch(API_URL, {
                        method: method,
                        body: JSON.stringify(payload)
                    });
                    swSuccess(res.message);
                    closeModal();
                    await loadData(); // Muat ulang data setelah berhasil simpan
                } catch (err) {
                    swError(err.message || 'Gagal menyimpan data.');
                }
            }
        });

        searchInput.addEventListener('input', (e) => {
            state.searchTerm = e.target.value;
            state.currentPage = 1; // Kembali ke halaman 1 saat search
            renderTable();
        });

        entriesSelect.addEventListener('change', (e) => {
            state.entriesPerPage = parseInt(e.target.value, 10);
            state.currentPage = 1; // Kembali ke halaman 1 saat ganti jumlah entri
            renderTable();
        });

        // Section Observer untuk memuat data saat section aktif
        let loadedOnce = false;
        const observer = new MutationObserver((mutations) => {
            if (section.classList.contains('active') && !loadedOnce) {
                loadData();
                loadedOnce = true;
                // observer.disconnect(); // Opsional: Hentikan observasi setelah load pertama
            }
        });
        observer.observe(section, { attributes: true, attributeFilter: ['class'] });

        // Muat data langsung jika section sudah aktif saat inisialisasi
        if (section.classList.contains('active')) {
            loadData();
            loadedOnce = true;
        }
    }
}