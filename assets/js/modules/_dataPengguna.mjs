// File: assets/js/modules/_dataPengguna.mjs
// VERSI FINAL: Tombol Kirim WA kini menggunakan dialog konfirmasi.

const API = {
    GET_PENGGUNA: 'backend/CRUD/api_get_pengguna.php',
    PROCESS_PENGGUNA: 'backend/CRUD/api_process_pengguna.php',
    GET_PEGAWAI: 'backend/CRUD/api_get_pegawai.php',
    GET_JABATAN: 'backend/CRUD/api_get_jabatan.php',
    GET_UNIT: 'backend/CRUD/api_get_unit.php',
    KIRIM_WA: 'backend/reminder/api_kirim_wa_pengguna.php'
};
    
function swSuccess(msg) {
    Swal.fire({ icon: 'success', title: 'Berhasil', text: msg, timer: 1400, showConfirmButton: false });
}
function swError(msg) {
    Swal.fire({ icon: 'error', title: 'Gagal', text: msg });
}
function swConfirm(text) {
    return Swal.fire({ title: 'Konfirmasi', text, icon: 'warning', showCancelButton: true, confirmButtonText: 'Ya', cancelButtonText: 'Batal' });
}
    
async function apiFetch(url, opts = {}) {
    const token = localStorage.getItem('jwt_token');
    opts.headers = opts.headers || {};
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
    
export function initDataPenggunaPage() {
    if (document.readyState === 'loading') {
      document.addEventListener('DOMContentLoaded', initDataPenggunaPage);
      return;
    }
    
    const section = document.getElementById('data-pengguna-section');
    if (!section) {
      console.warn('initDataPenggunaPage: section #data-pengguna-section not found — skipping init.');
      return;
    }
    
    const ensureTableAndInit = () => {
      const tableBody = document.getElementById('table-body-pengguna');
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
      const btnTambah = document.getElementById('btn-tambah-pengguna');
      const modal = document.getElementById('pengguna-modal');
      const form = document.getElementById('pengguna-form');
      const modalTitle = document.getElementById('pengguna-modal-title');
      const modalClose = document.getElementById('pengguna-modal-close');
      const modalCancel = document.getElementById('pengguna-cancel-btn');
    
      const inpNip = document.getElementById('pengguna-nip');
      const inpNama = document.getElementById('pengguna-nama');
      const pegawaiResults = document.getElementById('pegawai-search-results');
      const inpLogin = document.getElementById('pengguna-login');
      const selLevel = document.getElementById('pengguna-level');
      const selJabatan = document.getElementById('pengguna-jabatan');
      const selUnit = document.getElementById('pengguna-unit');
    
      const searchInput = document.getElementById('search-input-pengguna');
      const entriesSelect = document.getElementById('entries-select-pengguna');
      const filterSelect = document.getElementById('filter-status-pengguna'); 
      const resetFilterBtn = document.getElementById('btn-reset-filter-pengguna');
    
      const tableBody = document.getElementById('table-body-pengguna');
      const paginationInfo = document.getElementById('pagination-info-pengguna');
      const paginationButtons = document.getElementById('pagination-buttons-pengguna');
    
      if (!tableBody) {
        console.warn('table-body-pengguna not found, aborting module build');
        return;
      }
    
      let state = {
        allData: [],
        filteredData: [],
        currentPage: 1,
        entriesPerPage: parseInt(entriesSelect?.value || '10', 10),
        searchTerm: '',
        filterStatus: (filterSelect?.value) ? filterSelect.value : 'Semua'
      };
      let currentEditLogin = null;
    
      function renderPagination() {
        const total = state.filteredData.length;
        const perPage = state.entriesPerPage || 10;
        const totalPages = Math.max(1, Math.ceil(total / perPage));
        if (state.currentPage > totalPages) state.currentPage = totalPages;
    
        if (paginationInfo) {
          if (total === 0) paginationInfo.textContent = '';
          else {
            const start = (state.currentPage - 1) * perPage + 1;
            const end = Math.min(start + perPage - 1, total);
            paginationInfo.textContent = `Menampilkan ${start} - ${end} dari ${total} data`;
          }
        }
    
        if (!paginationButtons) return;
        paginationButtons.innerHTML = '';
    
        const makeBtn = (label, disabled, handler, active = false) => {
          const b = document.createElement('button');
          b.type = 'button';
          b.innerHTML = label;
          if (disabled) b.disabled = true;
          if (active) b.classList.add('active');
          b.addEventListener('click', handler);
          return b;
        };
    
        paginationButtons.appendChild(makeBtn('&laquo;', state.currentPage === 1, () => { if (state.currentPage > 1) { state.currentPage--; renderTable(); } }));
        let totalBtnPages = Math.max(1, Math.ceil(state.filteredData.length / state.entriesPerPage));
        for (let i = 1; i <= totalBtnPages; i++) {
          paginationButtons.appendChild(makeBtn(i, false, () => { state.currentPage = i; renderTable(); }, i === state.currentPage));
        }
        paginationButtons.appendChild(makeBtn('&raquo;', state.currentPage === totalBtnPages, () => { const tp = Math.max(1, Math.ceil(state.filteredData.length / state.entriesPerPage)); if (state.currentPage < tp) { state.currentPage++; renderTable(); } }));
      }
    
      function renderTable() {
        if (!tableBody) return;
        const q = (state.searchTerm || '').toLowerCase().trim();
        let list = state.allData.slice();
    
        if (q) {
          list = list.filter(item =>
            String(item.nip || '').toLowerCase().includes(q) ||
            String(item.nm_pegawai || '').toLowerCase().includes(q) ||
            String(item.user_login || '').toLowerCase().includes(q)
          );
        }
    
        if (state.filterStatus && state.filterStatus !== 'Semua') {
          const wantAktif = state.filterStatus === 'Aktif';
          list = list.filter(item => {
            const val = String(item.is_aktif ?? '').toLowerCase();
            const isItemAktif = (val === '1' || val === 'aktif');
            return isItemAktif === wantAktif;
          });
        }
    
        state.filteredData = list;
    
        const perPage = state.entriesPerPage || 10;
        const totalPages = Math.max(1, Math.ceil(list.length / perPage));
        if (state.currentPage > totalPages) state.currentPage = totalPages;
        const startIdx = (state.currentPage - 1) * perPage;
        const page = list.slice(startIdx, startIdx + perPage);
    
        if (!page.length) {
          tableBody.innerHTML = `<tr><td colspan="8" style="text-align:center;">Data tidak ditemukan.</td></tr>`;
          renderPagination();
          return;
        }
    
        tableBody.innerHTML = page.map((u) => {
          const isAktif = (u.is_aktif === '1' || u.is_aktif === 1 || String(u.is_aktif).toLowerCase() === 'aktif');
          const statusClass = isAktif ? 'status-aktif' : 'status-non-aktif';
          const toggleText = isAktif ? 'Non-Aktifkan' : 'Aktifkan';
          const toggleClass = isAktif ? 'warning' : 'success';
          
          return `
            <tr>
              <td data-label="NIP">${escapeHtml(u.nip)}</td>
              <td data-label="Nama Pegawai">${escapeHtml(u.nm_pegawai)}</td>
              <td data-label="User Login">${escapeHtml(u.user_login)}</td>
              <td data-label="Jabatan">${escapeHtml(u.nm_jabatan ?? '-')}</td>
              <td data-label="Unit Kerja">${escapeHtml(u.nm_unit ?? '-')}</td>
              <td data-label="Level">${escapeHtml(u.level)}</td>
              <td data-label="Status"><span class="status-pengguna ${statusClass}">${isAktif ? 'Aktif' : 'Non-Aktif'}</span></td>
              <td data-label="Aksi" class="aksi-pengguna">
                <button type="button" class="btn-aksi-menu" aria-label="Buka menu aksi">
                  <i class='bx bx-pencil'></i>
                </button>
                <div class="aksi-dropdown">
                  <button type="button" class="aksi-dropdown-item aksi-edit" data-user-login="${escapeAttr(u.user_login)}">
                    <i class='bx bx-edit-alt'></i> Ubah
                  </button>
                  <button type="button" class="aksi-dropdown-item aksi-toggle ${toggleClass}" data-user-login="${escapeAttr(u.user_login)}">
                    <i class='bx bx-sync'></i> ${toggleText}
                  </button>
                  <button type="button" class="aksi-dropdown-item aksi-wa" data-nip="${escapeAttr(u.nip)}" data-nama="${escapeAttr(u.nm_pegawai)}">
                    <i class='bx bxl-whatsapp'></i> Kirim WA
                  </button>
                </div>
              </td>
            </tr>`;
        }).join('');
    
        renderPagination();
      }
    
      function escapeHtml(s) {
        if (s == null) return '';
        return String(s).replace(/[&<>"']/g, m => ({'&':'&amp;','<':'&lt;','>':'&gt;','"':'&quot;',"'":'&#039;' }[m]));
      }
      function escapeAttr(s) { return escapeHtml(s); }
    
      async function loadPengguna(force = false) {
        if (!force && state.allData.length > 0) { renderTable(); return; }
        if (tableBody) tableBody.innerHTML = `<tr><td colspan="8" style="text-align:center;">Memuat data...</td></tr>`;
        try {
          const json = await apiFetch(API.GET_PENGGUNA, { method: 'GET' });
          state.allData = Array.isArray(json) ? json : [];
          state.currentPage = 1;
          renderTable();
        } catch (err) {
          console.error('loadPengguna error', err);
          if (tableBody) tableBody.innerHTML = `<tr><td colspan="8" style="text-align:center;color:red;">Gagal memuat data.</td></tr>`;
        }
      }
    
      tableBody.addEventListener('click', async (ev) => {
        const aksiMenuBtn = ev.target.closest('.btn-aksi-menu');
        const editBtn = ev.target.closest('.aksi-edit');
        const toggleBtn = ev.target.closest('.aksi-toggle');
        const waBtn = ev.target.closest('.aksi-wa');

        if (aksiMenuBtn) {
            const dropdown = aksiMenuBtn.nextElementSibling;
            const allDropdowns = tableBody.querySelectorAll('.aksi-dropdown');
            allDropdowns.forEach(d => {
                if (d !== dropdown) d.classList.remove('show');
            });
            dropdown.classList.toggle('show');
            return;
        }

        if (editBtn) {
          const user_login = editBtn.dataset.userLogin;
          await openEditModal(user_login);
        }

        if (toggleBtn) {
          const user_login = toggleBtn.dataset.userLogin; 
          const buttonText = toggleBtn.textContent.trim();
          const nextAction = buttonText === 'Aktifkan' ? 'mengaktifkan' : 'menonaktifkan';

          const conf = await swConfirm(`Anda yakin ingin ${nextAction} pengguna dengan login '${user_login}'?`);
          if (conf.isConfirmed) {
            try {
              const res = await apiFetch(API.PROCESS_PENGGUNA, {
                method: 'POST',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify({ action: 'toggle_status', user_login })
              });
              swSuccess(res.message || 'Status diubah');
              await loadPengguna(true);
            } catch (err) {
              swError(err.message || 'Gagal mengubah status');
            }
          }
        }

        if (waBtn) {
          const nip = waBtn.dataset.nip;
          const nama = waBtn.dataset.nama;
          
          const conf = await swConfirm(`Kirim informasi login via WhatsApp ke ${nama}?`);
          
          if (conf.isConfirmed) {
            try {
              const res = await apiFetch(API.KIRIM_WA, {
                method: 'POST',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify({ nip }) 
              });
              swSuccess(res.message || 'WA terkirim');
            } catch (err) {
              swError(err.message || 'Gagal mengirim WA');
            }
          }
        }

        if (editBtn || toggleBtn || waBtn) {
            const allDropdowns = tableBody.querySelectorAll('.aksi-dropdown');
            allDropdowns.forEach(d => d.classList.remove('show'));
        }
      });

      window.addEventListener('click', function(e) {
        if (!e.target.closest('.aksi-pengguna')) {
            const allDropdowns = tableBody.querySelectorAll('.aksi-dropdown');
            allDropdowns.forEach(d => d.classList.remove('show'));
        }
      });
    
      btnTambah?.addEventListener('click', async () => {
        currentEditLogin = null;
        form?.reset();
        if (modalTitle) modalTitle.textContent = 'Tambah Pengguna Baru';
        if (inpNip) { inpNip.value = ''; } 
        if (inpNama) { inpNama.value = ''; delete inpNama.dataset.nip; inpNama.readOnly = false; }
        if (inpLogin) { inpLogin.value = ''; inpLogin.readOnly = false; }
        if (selLevel) selLevel.value = 'user';
    
        try {
          const j = await apiFetch(API.GET_JABATAN, { method: 'GET' });
          if (selJabatan && Array.isArray(j)) selJabatan.innerHTML = `<option value="">-- Pilih Jabatan --</option>` + j.map(x => `<option value="${x.id_jabatan}">${escapeHtml(x.nm_jabatan)}</option>`).join('');
        } catch (e) { /* ignore */ }
        try {
          const u = await apiFetch(API.GET_UNIT, { method: 'GET' });
          if (selUnit && Array.isArray(u)) selUnit.innerHTML = `<option value="">-- Pilih Unit --</option>` + u.map(x => `<option value="${x.kd_unit}">${escapeHtml(x.nm_unit)}</option>`).join('');
        } catch (e) { /* ignore */ }
    
        if (modal) { modal.classList.add('active'); modal.style.display = 'flex'; document.body.style.overflow = 'hidden'; }
      });
    
      modalClose?.addEventListener('click', closeModal);
      modalCancel?.addEventListener('click', closeModal);
      modal?.addEventListener('click', (e) => { if (e.target === modal) closeModal(); });
    
      function closeModal() {
        if (!modal) return;
        modal.classList.remove('active');
        modal.style.display = 'none';
        document.body.style.overflow = '';
        form?.reset();
        if (inpNama) { inpNama.value = ''; delete inpNama.dataset.nip; }
        if (inpNip) { inpNip.value = ''; }
        currentEditLogin = null;
      }
    
      let pegawaiTimer = null;
      if (inpNama) {
        inpNama.addEventListener('input', (e) => {
          if (inpNama.readOnly) return;
          const kw = String(e.target.value || '').trim();
          if (inpNip) inpNip.value = '';
          delete inpNama.dataset.nip;
          if (!pegawaiResults) return;
          pegawaiResults.innerHTML = '';
          clearTimeout(pegawaiTimer);
          if (kw.length < 2) return;
          pegawaiTimer = setTimeout(async () => {
            try {
              const arr = await apiFetch(API.GET_PEGAWAI, { method: 'GET' });
              const filtered = (Array.isArray(arr) ? arr : []).filter(p => (p.nm_pegawai || '').toLowerCase().includes(kw.toLowerCase()) || (p.nip || '').toLowerCase().includes(kw.toLowerCase()));
              if (!filtered.length) { pegawaiResults.innerHTML = `<div class="result-item empty">Tidak ditemukan</div>`; return; }
              pegawaiResults.innerHTML = filtered.map(p => `<div class="result-item" data-nip="${escapeAttr(p.nip)}" data-nama="${escapeAttr(p.nm_pegawai)}">${escapeHtml(p.nm_pegawai)} <small>(${escapeHtml(p.nip)})</small></div>`).join('');
            } catch (err) {
              pegawaiResults.innerHTML = `<div class="result-item empty">Error</div>`;
            }
          }, 300);
        });
    
        pegawaiResults?.addEventListener('click', (ev) => {
          const item = ev.target.closest('.result-item');
          if (!item || item.classList.contains('empty')) return;
          const nip = item.dataset.nip;
          const nama = item.dataset.nama;
          inpNama.value = nama;
          inpNama.dataset.nip = nip;
          if (inpNip) inpNip.value = nip;
          pegawaiResults.innerHTML = '';
        });
      }
    
      form?.addEventListener('submit', async (e) => {
        e.preventDefault();
        const nip = (inpNip && inpNip.value) ? inpNip.value.trim() : '';
        const nm_pegawai = (inpNama && inpNama.value) ? inpNama.value.trim() : '';
        const user_login = (inpLogin && inpLogin.value) ? inpLogin.value.trim() : '';
        const level = selLevel ? selLevel.value : '';
        const id_jabatan = selJabatan ? selJabatan.value : '';
        const kd_unit = selUnit ? selUnit.value : '';
    
        if (!currentEditLogin && !nip) { swError('Nama pegawai harus dipilih dari daftar pencarian.'); return; }
        if (!nm_pegawai) { swError('Nama pegawai wajib diisi.'); return; }
        if (!user_login) { swError('User login wajib diisi.'); return; }
        if (!level) { swError('Level wajib diisi.'); return; }
        if (!id_jabatan) { swError('Jabatan wajib dipilih.'); return; }
    
        try {
          if (!currentEditLogin) {
            const chk = await apiFetch(API.PROCESS_PENGGUNA, {
              method: 'POST',
              headers: { 'Content-Type': 'application/json' },
              body: JSON.stringify({ action: 'check_user_login', user_login })
            });
            if (chk && chk.exists) {
              swError('User login sudah digunakan.');
              return;
            }
          }
        } catch (err) {
          console.warn('check_user_login failed', err);
        }
    
        const action = currentEditLogin ? 'update' : 'create';
        const payload = currentEditLogin 
          ? { action, nip, user_login: currentEditLogin, level, id_jabatan, kd_unit } 
          : { action, nip, nm_pegawai, user_login, level, id_jabatan, kd_unit, pelihat: 'TERBATAS' };
    
        const conf = await swConfirm(currentEditLogin ? 'Simpan perubahan?' : 'Simpan pengguna baru?');
        if (!conf.isConfirmed) return;
    
        try {
          const res = await apiFetch(API.PROCESS_PENGGUNA, {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify(payload)
          });
          swSuccess(res.message || 'Operasi berhasil');
          closeModal();
          await loadPengguna(true);
        } catch (err) {
          swError(err.message || 'Gagal menyimpan data');
        }
      });
    
      async function openEditModal(user_login) {
        const user = state.allData.find(x => x.user_login === user_login);
        if (!user) { 
            swError(`Data pengguna dengan login ${user_login} tidak ditemukan`); 
            return; 
        }

        currentEditLogin = user_login;
        form?.reset();
        if (modalTitle) modalTitle.textContent = `Ubah Pengguna (${user.user_login})`;
        if (inpNip) { inpNip.value = user.nip; }
        if (inpNama) { inpNama.value = user.nm_pegawai; inpNama.readOnly = true; }
        if (inpLogin) { inpLogin.value = user.user_login; inpLogin.readOnly = true; }
        if (selLevel) selLevel.value = user.level || 'user';
    
        try {
          const j = await apiFetch(API.GET_JABATAN, { method: 'GET' });
          if (selJabatan && Array.isArray(j)) selJabatan.innerHTML = `<option value="">-- Pilih Jabatan --</option>` + j.map(x => `<option value="${x.id_jabatan}" ${String(x.id_jabatan) === String(user.id_jabatan) ? 'selected' : ''}>${escapeHtml(x.nm_jabatan)}</option>`).join('');
        } catch (e) {}
        try {
          const u = await apiFetch(API.GET_UNIT, { method: 'GET' });
          if (selUnit && Array.isArray(u)) selUnit.innerHTML = `<option value="">-- Pilih Unit --</option>` + u.map(x => `<option value="${x.kd_unit}" ${String(x.kd_unit) === String(user.kd_unit) ? 'selected' : ''}>${escapeHtml(x.nm_unit)}</option>`).join('');
        } catch (e) {}
    
        if (modal) { modal.classList.add('active'); modal.style.display = 'flex'; document.body.style.overflow = 'hidden'; }
      }
    
      let loadedOnce = false;
      const sectionObserver = new MutationObserver((muts) => {
        if (loadedOnce) return;
        if (muts.some(m => m.attributeName === 'class' && section.classList.contains('active'))) {
          loadedOnce = true;
          loadPengguna(true);
        }
      });
      sectionObserver.observe(section, { attributes: true });
    
      if (section.classList.contains('active')) { loadedOnce = true; loadPengguna(true); }
    
      searchInput?.addEventListener('input', (e) => { state.searchTerm = e.target.value; state.currentPage = 1; renderTable(); });
      entriesSelect?.addEventListener('change', (e) => { state.entriesPerPage = parseInt(e.target.value, 10) || 10; state.currentPage = 1; renderTable(); });
      filterSelect?.addEventListener('change', (e) => { state.filterStatus = e.target.value || 'Semua'; state.currentPage = 1; renderTable(); });
    
      resetFilterBtn?.addEventListener('click', async () => {
        state.searchTerm = '';
        state.filterStatus = 'Semua';
        state.currentPage = 1;
        if (searchInput) searchInput.value = '';
        if (filterSelect) filterSelect.value = 'Semua';
        await loadPengguna(true);
      });
    
      return {
        reload: () => loadPengguna(true),
        getState: () => ({ ...state })
      };
    }
}