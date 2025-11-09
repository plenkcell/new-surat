// File: assets/js/script.mjs (Lengkap)

// ### PERUBAHAN: Impor fungsi baru 'updateNavMenusVisibility' ###
import { initUI, initLogout, updateServiceCardsVisibility, updateNavMenusVisibility } from './modules/_ui.mjs';
import { initNavigation } from './modules/_navigation.mjs';
import { initDisposisiPage } from './modules/_disposisi.mjs';
import { initPdfViewer } from './modules/_pdfViewer.mjs';
import { initCommandPalette } from './modules/_commandPalette.mjs';
import { initProfilePage } from './modules/_profile.mjs';
import { initJawabModal } from './modules/_jawabModal.mjs';
import { initArtikelSlideshow } from './modules/_artikel.mjs';
import { initKirimSuratPage } from './modules/_kirimSurat.mjs';
import { initDaftarSuratInternalPage } from './modules/_daftarSuratInternal.mjs';
import ubahSuratInternal from './modules/_ubahSuratInternal.mjs';
import { initSuratSelesaiPage } from './modules/_suratSelesai.mjs';
import { initRiwayatModal } from './modules/_riwayatModal.mjs';
import { initDetailListModal } from './modules/_detailListModal.mjs';
import { initSuratMasukPage } from './modules/_suratMasuk.mjs';
import { initArsipSuratPage } from './modules/_arsipSurat.mjs';
import { initTtePage } from './modules/_tte.mjs';
import { initAgendaPage } from './modules/_agenda.mjs';
import { initDataBagianPage } from './modules/_dataBagian.mjs';
import { initDataPegawaiPage } from './modules/_dataPegawai.mjs';
import { initDataPenggunaPage } from './modules/_dataPengguna.mjs';
import { initSettingAplikasiPage } from './modules/_settingAplikasi.mjs';
import { initDataStrukturalPage } from './modules/_dataStruktural.mjs';
import { initSuratMasukAdminPage } from './modules/_suratMasukAdmin.mjs';
import { initSuratMasukAdminSelesaiPage } from './modules/_suratMasukAdminSelesai.mjs';


document.addEventListener('DOMContentLoaded', function() {
    
    function initializeUserSession() {
        const token = localStorage.getItem('jwt_token');
        if (!token) {
            window.location.href = 'login.php?status=unauthenticated';
            return;
        }

        try {
            const base64Url = token.split('.')[1];
            const base64 = base64Url.replace(/-/g, '+').replace(/_/g, '/');
            const jsonPayload = decodeURIComponent(atob(base64).split('').map(function(c) {
                return '%' + ('00' + c.charCodeAt(0).toString(16)).slice(-2);
            }).join(''));
            
            const payload = JSON.parse(jsonPayload);
            const userData = payload.data;
            
            const greetingName = document.getElementById('user-greeting-name');
            const dropdownName = document.getElementById('dropdown-user-name');
            const dropdownLevel = document.getElementById('dropdown-user-level');
            const avatar = document.getElementById('avatarButton');

            if (greetingName) greetingName.textContent = userData.nm_pegawai;
            if (dropdownName) dropdownName.textContent = userData.nm_pegawai;
            if (dropdownLevel) dropdownLevel.textContent = userData.level.charAt(0).toUpperCase() + userData.level.slice(1);
            if (avatar) avatar.src = `https://i.pravatar.cc/150?u=${encodeURIComponent(userData.nm_pegawai)}`;

            // ### PERUBAHAN: Jalankan kedua fungsi visibilitas di sini ###
            updateServiceCardsVisibility(userData.level);
            updateNavMenusVisibility(userData.level);

        } catch (e) {
            console.error("Gagal membaca payload token. Token mungkin tidak valid.");
            localStorage.removeItem('jwt_token');
            window.location.href = 'login.php?status=invalid_token';
        }
    }

    // Jalankan semua inisialisasi modul
    initializeUserSession();
    initUI();
    initLogout();
    initNavigation();
    initDisposisiPage();
    initPdfViewer();
    initCommandPalette();
    initProfilePage();
    initJawabModal();
    initArtikelSlideshow();
    initKirimSuratPage();
    initDaftarSuratInternalPage();
    ubahSuratInternal.init();
    initSuratSelesaiPage();
    initRiwayatModal();
    initDetailListModal();
    initSuratMasukPage();
    initArsipSuratPage();
    initTtePage();
    initAgendaPage();
    initDataBagianPage();
    initDataPegawaiPage();
    initDataPenggunaPage();
    initSettingAplikasiPage();
    initDataStrukturalPage();
    initSuratMasukAdminPage();
    initSuratMasukAdminSelesaiPage();
});