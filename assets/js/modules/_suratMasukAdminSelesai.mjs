// File: assets/js/modules/_suratMasukAdminSelesai.mjs
// Mandiri. Meniru pola apiFetch dari modul _suratMasukAdmin.mjs (jwt_token + SweetAlert). 

const API_LIST_URL   = 'backend/CRUD/api_getSuratMasukAdminSelesai.php';
const API_PROCESS_URL = 'backend/CRUD/api_processSuratMasukAdminSelesai.php';

/* ========== SweetAlert helpers (sama gaya dengan modul lain) ========== */
function swSuccess(msg) { Swal.fire({ icon: 'success', title: 'Berhasil', text: msg, timer: 1500, showConfirmButton: false }); }
function swError(msg)   { Swal.fire({ icon: 'error', title: 'Gagal', text: msg }); }
function swWarn(msg)    { Swal.fire({ icon: 'warning', title: 'Perhatian', text: msg }); }
function swConfirm(text, confirmButtonText = 'Ya', cancelButtonText = 'Batal') {
  return Swal.fire({ title: 'Konfirmasi', text, icon: 'warning', showCancelButton: true, confirmButtonText, cancelButtonText });
}

/* ========== apiFetch (mengikuti pola _suratMasukAdmin.mjs) ========== */
async function apiFetch(url, opts = {}) {
  const token = localStorage.getItem('jwt_token'); // <- sama persis dengan modul contoh
  opts.headers = opts.headers || {};
  // Set Content-Type jika bukan FormData
  if (!(opts.body instanceof FormData) && !('Content-Type' in opts.headers)) {
    opts.headers['Content-Type'] = 'application/json';
  }
  if (token) opts.headers['Authorization'] = `Bearer ${token}`;

  const res = await fetch(url, opts);
  const txt = await res.text();

  let json = null;
  try { json = txt ? JSON.parse(txt) : null; } catch { json = null; }

  // Pola penanganan sesi berakhir seperti modul contoh
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
    const err = new Error(msg); err.raw = json; throw err;
  }
  return json;
}

/* ========== Util UI lokal (independen) ========== */
function debounce(fn, delay = 300) { let t; return (...a)=>{ clearTimeout(t); t=setTimeout(()=>fn(...a), delay); }; }
function formatTanggal(input) {
  if (!input) return '-';
  const d = new Date(input);
  return isNaN(d.getTime()) ? '-' : d.toLocaleDateString('id-ID', { day:'2-digit', month:'short', year:'numeric' });
}
function openPdf(url) { try { window.open(url, '_blank', 'noopener,noreferrer'); } catch { swError('Tidak dapat membuka file.'); } }

function renderPaginationButtons(containerEl, currentPage, totalPages, onGoTo) {
  if (!containerEl) return;
  const btn = (p, label=p, disabled=false, active=false) =>
    `<button class="btn-pagination ${active?'active':''}" data-page="${p}" ${disabled?'disabled':''}>${label}</button>`;
  let html = '';
  const prevDis = currentPage <= 1, nextDis = currentPage >= totalPages;
  html += btn(Math.max(1, currentPage-1), '«', prevDis);
  const win = 2, start = Math.max(1, currentPage-win), end = Math.min(totalPages, currentPage+win);
  if (start>1){ html += btn(1,'1',false,currentPage===1); if(start>2) html+='<span class="ellipsis">…</span>'; }
  for (let p=start; p<=end; p++) html += btn(p,String(p),false,p===currentPage);
  if (end<totalPages){ if(end<totalPages-1) html+='<span class="ellipsis">…</span>'; html+=btn(totalPages,String(totalPages),false,currentPage===totalPages); }
  html += btn(Math.min(totalPages||1, currentPage+1), '»', nextDis);
  containerEl.innerHTML = html;
  containerEl.querySelectorAll('button.btn-pagination[data-page]').forEach(b=>{
    b.addEventListener('click', ()=>{ const p=parseInt(b.dataset.page,10); if(!isNaN(p)&&p!==currentPage) onGoTo(p); });
  });
}

/* ========== State & Refs ========== */
let currentPage=1, totalPages=1, totalRecords=0, entries=10;
let searchQuery='', filterDisposisi='semua';

let tableBody=null, entriesSelect=null, filterDisposisiSelect=null, searchInput=null, paginationInfo=null, paginationButtons=null;
const debouncedFetchData = debounce(()=>fetchData(), 300);

/* ========== Public init ========== */
export function initSuratMasukAdminSelesaiPage() {
  const section = document.getElementById('surat-masuk-admin-selesai-section');
  if (!section) return;

  tableBody = document.getElementById('smas-table-body');
  entriesSelect = document.getElementById('smas-entries-select');
  filterDisposisiSelect = document.getElementById('smas-filter-disposisi');
  searchInput = document.getElementById('smas-search-input');
  paginationInfo = document.getElementById('smas-pagination-info');
  paginationButtons = document.getElementById('smas-pagination-buttons');

  if (!tableBody || !entriesSelect || !filterDisposisiSelect || !searchInput || !paginationInfo || !paginationButtons) {
    console.warn('[SMAS] Elemen UI tidak lengkap. Pastikan ID sudah cocok.'); return;
  }

  setupEventListeners();
  fetchData();
}

/* ========== Events ========== */
function setupEventListeners() {
  entriesSelect.addEventListener('change', ()=>{
    entries = parseInt(entriesSelect.value,10)||10; currentPage=1; fetchData();
  });
  filterDisposisiSelect.addEventListener('change', ()=>{
    filterDisposisi = filterDisposisiSelect.value; currentPage=1; fetchData();
  });
  searchInput.addEventListener('input', ()=>{
    searchQuery = searchInput.value; currentPage=1; debouncedFetchData();
  });

  tableBody.addEventListener('click', async (e)=>{
    const btn = e.target.closest('button'); if(!btn) return;
    const action = btn.dataset.action; const id = btn.dataset.id;
    if (!action || !id) return;

    if (action === 'view_pdf') {
      openPdf(btn.dataset.file);
    } else if (action === 'reactivate') {
      const conf = await swConfirm('Aktifkan kembali surat ini?'); 
      if (!conf.isConfirmed) return;
      try {
        const resp = await apiFetch(API_PROCESS_URL, { method:'POST', body: JSON.stringify({ action:'reactivate', id_surat_masuk:id }) });
        swSuccess(resp.message || 'Berhasil diaktifkan.'); fetchData();
      } catch (err) { swError(err.message || 'Gagal mengaktifkan.'); }
    } else if (action === 'delete') {
      const conf = await swConfirm('Hapus permanen surat ini? Tindakan tidak dapat dibatalkan.', 'Ya, Hapus!');
      if (!conf.isConfirmed) return;
      try {
        const resp = await apiFetch(API_PROCESS_URL, { method:'POST', body: JSON.stringify({ action:'delete', id_surat_masuk:id }) });
        swSuccess(resp.message || 'Berhasil dihapus.'); fetchData();
      } catch (err) { swError(err.message || 'Gagal menghapus.'); }
    }
  });
}

/* ========== Data & Render ========== */
async function fetchData() {
  if (!tableBody) return;
  tableBody.innerHTML = renderSkeleton(entries);
  try {
    // GET dengan query string sesuai pola modul lain (pakai apiFetch langsung).
    const qs = new URLSearchParams({ page:String(currentPage), entries:String(entries), search:searchQuery||'', filter:filterDisposisi||'semua' }).toString();
    const resp = await apiFetch(`${API_LIST_URL}?${qs}`, { method:'GET' });

    if (resp && resp.status === 'success') {
      totalPages   = Number(resp.pagination?.totalPages ?? 1);
      totalRecords = Number(resp.pagination?.totalRecords ?? (Array.isArray(resp.data)?resp.data.length:0));
      renderTable(Array.isArray(resp.data) ? resp.data : []);
      renderPagination();
    } else {
      tableBody.innerHTML = `<tr><td colspan="5" style="text-align:center;">${(resp && resp.message) || 'Gagal memuat data.'}</td></tr>`;
    }
  } catch (err) {
    console.error('[SMAS] fetchData error:', err);
    const msg = err?.message || 'Gagal memuat data.';
    tableBody.innerHTML = `<tr><td colspan="5" style="text-align:center;">${msg}</td></tr>`;
  }
}

function renderTable(rows) {
  if (!rows.length) {
    tableBody.innerHTML = `<tr><td colspan="5" style="text-align:center;">Tidak ada data ditemukan.</td></tr>`;
    return;
  }
  tableBody.innerHTML = rows.map(row=>{
    const statusChipClass = row.status_disposisi === 'sudah' ? 'success' : 'warning';
    const statusChipText  = row.status_disposisi === 'sudah' ? 'Sudah Disposisi' : 'Belum Disposisi';
    const id = row.id_surat_masuk ?? '';
    const nomor = row.nomor_surat ?? '---';
    const pengirim = row.pengirim ?? '---';
    const perihal = row.perihal ?? '---';
    const jenis = row.nama_jenis_surat ?? 'N/A';
    const sifat = row.nama_sifat ?? 'N/A';
    const prioritas = row.nama_prioritas ?? 'N/A';
    const tglSelesai = formatTanggal(row.tgl_surat_selesai);
    const fileSurat = row.file_surat ?? '#';

    return `
      <tr>
        <td data-label="Detail Surat">
          <span class="title-sma">${nomor}</span>
          <span class="text-secondary-sma">${pengirim}</span>
          <span class="text-secondary-sma">Perihal: ${perihal}</span>
        </td>
        <td data-label="Info">
          <span class="text-secondary-sma">Jenis: ${jenis}</span>
          <span class="text-secondary-sma">Sifat: ${sifat}</span>
          <span class="text-secondary-sma">Prioritas: ${prioritas}</span>
        </td>
        <td data-label="Status">
          <span class="status-chip-sma ${statusChipClass}">${statusChipText}</span>
        </td>
        <td data-label="Tgl. Selesai">
          <span class="text-secondary-sma">${tglSelesai}</span>
        </td>
        <td data-label="Aksi">
          <button class="btn-smas btn-reactivate-smas" data-action="reactivate" data-id="${id}">
            <i class='bx bx-check-double'></i> Aktifkan
          </button>
          <button class="btn-smas btn-delete-smas" data-action="delete" data-id="${id}">
            <i class='bx bx-trash'></i> Hapus
          </button>
          <button class="btn-link-sma" data-action="view_pdf" data-id="${id}" data-file="${fileSurat}">
            <i class='bx bxs-file-pdf'></i> Lihat File
          </button>
        </td>
      </tr>
    `;
  }).join('');
}

function renderPagination() {
  if (!paginationButtons || !paginationInfo) return;
  renderPaginationButtons(paginationButtons, currentPage, totalPages, (p)=>{ currentPage=p; fetchData(); });
  const start = totalRecords>0 ? (currentPage-1)*entries + 1 : 0;
  const end = Math.min(start + entries - 1, totalRecords);
  paginationInfo.textContent = `Menampilkan ${start}-${end} dari ${totalRecords} data`;
}

function renderSkeleton(n) {
  let h=''; for(let i=0;i<n;i++){
    h += `<tr>
      <td data-label="Detail Surat"><div class="skeleton-box"></div><div class="skeleton-box" style="width:70%;"></div></td>
      <td data-label="Info"><div class="skeleton-box" style="width:80%;"></div></td>
      <td data-label="Status"><div class="skeleton-box" style="width:60%;"></div></td>
      <td data-label="Tgl. Selesai"><div class="skeleton-box" style="width:90%;"></div></td>
      <td data-label="Aksi"><div class="skeleton-box" style="width:110px;height:30px;margin-bottom:5px;"></div><div class="skeleton-box" style="width:110px;height:30px;"></div></td>
    </tr>`;
  }
  return h;
}
