import { fetchDisposisiData } from './_disposisi.mjs';
import { loadProfileData } from './_profile.mjs';
import { startSlideshow, stopSlideshow } from './_artikel.mjs';
import { fetchDsiData } from './_daftarSuratInternal.mjs';
import { handleAgendaVisibility } from './_agenda.mjs';

const allNavLinks = document.querySelectorAll('.nav-link');
const contentSections = document.querySelectorAll('.content-section');

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

let dataFetched = {
    disposisi: false,
    profile: false,
    daftarSurat: false
};

function activateSection(targetId) {
    const targetSection = document.getElementById(targetId);
    if (!targetSection) return;
    
    if (targetId === 'home-section') { startSlideshow(); } else { stopSlideshow(); }

    contentSections.forEach(section => section.classList.remove('active'));
    targetSection.classList.add('active');

    allNavLinks.forEach(syncLink => {
        const parent = syncLink.closest('.nav-item');
        if (parent) parent.classList.remove('active');
    });
    
    const activeLink = document.querySelector(`.nav-link[data-target="${targetId}"]`);
    if (activeLink) {
        const parentNavItem = activeLink.closest('.nav-item');
        if (parentNavItem) parentNavItem.classList.add('active');
        
        const parentSubmenu = activeLink.closest('.has-submenu');
        if (parentSubmenu) parentSubmenu.classList.add('open');
    }
    
    if (targetId === 'disposisi-section' && !dataFetched.disposisi) { fetchDisposisiData(); dataFetched.disposisi = true; }
    if (targetId === 'profile-section' && !dataFetched.profile) { loadProfileData(); dataFetched.profile = true; }
    if (targetId === 'daftar-surat-internal-section' && !dataFetched.daftarSurat) { fetchDsiData(); dataFetched.daftarSurat = true; }
    if (targetId === 'agenda-section') { handleAgendaVisibility(); }
}

export function initNavigation() {
    const submenuToggles = document.querySelectorAll('.submenu-toggle');
    submenuToggles.forEach(toggle => {
        toggle.addEventListener('click', function(e) {
            e.preventDefault();
            e.stopPropagation();
            this.closest('.has-submenu').classList.toggle('open');
        });
    });

    allNavLinks.forEach(link => {
        if (link.classList.contains('submenu-toggle') || link.id === 'open-cp-mobile') return;
        
        link.addEventListener('click', function(e) {
            e.preventDefault();
            const targetId = this.dataset.target;
            activateSection(targetId);
        });
    });

    const activeSection = document.querySelector('.content-section.active');
    if (activeSection) {
        activateSection(activeSection.id);
    }
}

export { activateSection };