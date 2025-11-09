// File: assets/js/modules/_ui.mjs (Lengkap & Final)

async function loadDisposisiSummary() {
    const titleEl = document.getElementById('summary-title-jwb');
    const progressBarEl = document.getElementById('summary-progress-bar-jwb');
    const statusEl = document.getElementById('summary-status-jwb');
    const currentToken = localStorage.getItem('jwt_token');
    if (!currentToken || !titleEl || !progressBarEl || !statusEl) return;
    try {
        const response = await fetch('backend/CRUD/api_get_disposisi_summary.php', { headers: { 'Authorization': `Bearer ${currentToken}` } });
        if (response.status === 401) return;
        if (!response.ok) throw new Error('Gagal memuat ringkasan.');
        const data = await response.json();
        const { perlu_dijawab, sudah_dijawab, total_disposisi } = data;
        const percentage = total_disposisi > 0 ? (sudah_dijawab / total_disposisi) * 100 : 0;
        titleEl.textContent = `Ada ${perlu_dijawab} Surat yang Menanti!!!`;
        progressBarEl.style.width = `${percentage}%`;
        statusEl.textContent = `${sudah_dijawab} dari ${total_disposisi} Surat Sudah dijawab.`;
    } catch (error) {
        statusEl.textContent = error.message;
        statusEl.style.color = 'var(--error-text)';
    }
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

function connectWebSocket() {
    console.log("Mencoba terhubung ke WebSocket Server...");
    const socket = new WebSocket('ws://localhost:9909');
    socket.onopen = function(e) { console.log("Koneksi WebSocket (WSS) berhasil dibuat!"); };
    socket.onmessage = function(event) {
        if (event.data === 'update_summary') {
            loadDisposisiSummary();
        }
    };
    socket.onclose = function(event) {
        console.log('Koneksi WebSocket terputus. Mencoba menghubungkan kembali dalam 5 detik...');
        setTimeout(() => connectWebSocket(), 5000);
    };
    socket.onerror = function(error) { console.error(`[WebSocket Error]`, error); };
}

// ### FUNGSI BARU: Untuk memuat agenda hari ini di dashboard ###
async function loadAgendaToday() {
    const listContainer = document.getElementById('agenda-today-list');
    const loader = document.getElementById('agenda-today-loader');
    if (!listContainer) return;

    try {
        const currentToken = localStorage.getItem('jwt_token');
        const response = await fetch('backend/CRUD/api_get_agenda_today.php', {
            headers: { 'Authorization': `Bearer ${currentToken}` }
        });
        if (!response.ok) {
            throw new Error('Gagal mengambil data agenda.');
        }
        
        const agendas = await response.json();
        
        // Bersihkan loader dan isi container
        listContainer.innerHTML = ''; 
        
        if (agendas.length === 0) {
            listContainer.innerHTML = `
                <li class="appointment-item-loading">
                    <i class='bx bx-calendar-check'></i> Tidak ada agenda untuk hari ini.
                </li>`;
            return;
        }

        agendas.forEach(agenda => {
            const startTime = agenda.jam_mulai.substring(0, 5);
            const endTime = agenda.jam_selesai ? agenda.jam_selesai.substring(0, 5) : '';
            const timeString = endTime ? `${startTime} - ${endTime}` : startTime;

            const listItem = document.createElement('li');
            listItem.innerHTML = `
                <a href="#" class="appointment-item nav-link" data-target="agenda-section">
                    <div class="appointment-time">
                        <i class='bx bx-time-five'></i>${timeString}
                    </div>
                    <div class="appointment-details">
                        <h4 class="doctor">${agenda.judul}</h4>
                        <span class="reason">${agenda.lokasi || 'Lokasi tidak ditentukan'}</span>
                    </div>
                    <div class="appointment-status confirmed">Aktif</div>
                </a>
            `;
            listContainer.appendChild(listItem);
        });

    } catch (error) {
        if (loader) {
            loader.innerHTML = `<i class='bx bx-error-circle'></i> ${error.message}`;
            loader.style.color = 'var(--error-text)';
        }
    }
}

// ### PETA IZIN TERPUSAT ###
// Atur semua izin untuk card dan menu di sini.
const permissionsMap = {
    // Section Target : [array level yang diizinkan]
    'home-section': ['user', 'admin', 'direktur'],
    'disposisi-section': ['user', 'direktur'],
    'kirim-surat-internal-section': ['user', 'direktur'],
    'surat-masuk-selesai-section': ['user', 'direktur'],
    'daftar-surat-internal-section': ['user', 'admin', 'direktur'],
    'surat-selesai-section': ['user', 'direktur'],
    'schedule-section': ['admin'], // Contoh: hanya admin bisa lihat schedule
    'report-section': ['admin', 'direktur'], // Contoh: admin & direktur bisa lihat report
    'arsip-surat-section': ['user', 'direktur'],
    'notifications-section': ['user', 'admin', 'direktur'],
    'master-data': ['admin'],
    'data-unit-section': ['admin'],
    'data-pegawai-section': ['admin']
};

export function updateServiceCardsVisibility(userLevel) {
    const serviceCards = document.querySelectorAll('.service-card.nav-link');
    serviceCards.forEach(card => {
        const targetSection = card.dataset.target;
        if (permissionsMap[targetSection]) {
            card.style.display = permissionsMap[targetSection].includes(userLevel) ? 'flex' : 'none';
        }
    });
}

// ### FUNGSI BARU: Mengatur visibilitas menu navigasi ###
export function updateNavMenusVisibility(userLevel) {
    // 1. Untuk Sidebar (Desktop)
    const sidebarLinks = document.querySelectorAll('.sidebar-nav .nav-link');
    sidebarLinks.forEach(link => {
        const parentLi = link.closest('.nav-item');
        const targetSection = link.dataset.target;
        if (parentLi && permissionsMap[targetSection]) {
            parentLi.style.display = permissionsMap[targetSection].includes(userLevel) ? 'list-item' : 'none';
        }
    });

    // 2. Untuk Navigasi Bawah (Mobile)
    const mobileLinks = document.querySelectorAll('.mobile-nav .nav-link');
    mobileLinks.forEach(link => {
        const targetSection = link.dataset.target;
        if (targetSection && permissionsMap[targetSection]) {
            link.style.display = permissionsMap[targetSection].includes(userLevel) ? 'flex' : 'none';
        }
    });
}


export function initUI() {
    initDropdownAvatar();
    initThemeSwitcher();
    initHamburgerMenu();
    loadDisposisiSummary();
    connectWebSocket();
    loadAgendaToday();
}

// Logika untuk Dropdown Avatar
function initDropdownAvatar() {
    const avatarButton = document.getElementById('avatarButton');
    const dropdownMenu = document.getElementById('dropdownMenu');
    if (avatarButton && dropdownMenu) {
        avatarButton.addEventListener('click', (event) => {
            event.stopPropagation();
            dropdownMenu.classList.toggle('show');
        });
    }
    window.addEventListener('click', () => {
        if (dropdownMenu && dropdownMenu.classList.contains('show')) {
            dropdownMenu.classList.remove('show');
        }
    });
}

// Logika untuk Theme Switcher (Light/Dark Mode)
function initThemeSwitcher() {
    const themeSwitcherButton = document.getElementById('theme-switcher-button');
    if (themeSwitcherButton) {
        const currentTheme = localStorage.getItem('theme');
        if (currentTheme === 'dark-mode') {
            document.body.classList.add('dark-mode');
        }
        themeSwitcherButton.addEventListener('click', function() {
            document.body.classList.toggle('dark-mode');
            localStorage.setItem('theme', document.body.classList.contains('dark-mode') ? 'dark-mode' : 'light');
        });
    }
}

// Logika untuk Hamburger Menu (Sidebar Collapse)
function initHamburgerMenu() {
    const hamburgerButton = document.getElementById('hamburger-button');
    const dashboardContainer = document.querySelector('.dashboard-container');
    if (hamburgerButton && dashboardContainer) {
        const currentSidebarState = localStorage.getItem('sidebarState');
        if (currentSidebarState === 'collapsed') {
            dashboardContainer.classList.add('sidebar-collapsed');
        }
        hamburgerButton.addEventListener('click', function() {
            dashboardContainer.classList.toggle('sidebar-collapsed');
            localStorage.setItem('sidebarState', dashboardContainer.classList.contains('sidebar-collapsed') ? 'collapsed' : 'expanded');
        });
    }
}

// Logika untuk Logout
export function initLogout() {
     const logoutButton = document.getElementById('logout-button');
    if (logoutButton) {
        logoutButton.addEventListener('click', function(e) {
            e.preventDefault();
            localStorage.removeItem('jwt_token'); 
            sessionStorage.removeItem('jwt_token');
            window.location.href = 'logout.php';
        });
    }
}