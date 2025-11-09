import { activateSection } from './_navigation.mjs';

export function initCommandPalette() {
    const cpContainer = document.getElementById('command-palette-container');
    const cpInput = document.getElementById('command-palette-input');
    const cpResults = document.getElementById('command-palette-results');
    const openCpMobileButton = document.getElementById('open-cp-mobile');
    const themeSwitcherButton = document.getElementById('theme-switcher-button');
    const logoutButton = document.getElementById('logout-button');
    let activeCommandIndex = 0;

    const commands = [
        { name: 'Ganti Tema', desc: 'Beralih antara mode terang dan gelap', icon: 'bx-palette', action: () => themeSwitcherButton.click() },
        { name: 'Buka Home', desc: 'Kembali ke halaman utama', icon: 'bx-home-smile', action: () => activateSection('home-section') },
        { name: 'Buka Disposisi', desc: 'Lihat daftar disposisi surat masuk', icon: 'bx-file-find', action: () => activateSection('disposisi-section') },
        //{ name: 'Buka Jadwal', desc: 'Lihat jadwal', icon: 'bx-calendar', action: () => activateSection('schedule-section') },
        { name: 'Lihat Profil', desc: 'Buka halaman profil pengguna', icon: 'bx-user', action: () => alert('Halaman profil belum dibuat') },
        { name: 'Logout', desc: 'Keluar dari sesi saat ini', icon: 'bx-log-out', action: () => logoutButton.click() }
    ];

    function renderCommands(filteredCommands = commands) {
        cpResults.innerHTML = '';
        filteredCommands.forEach((cmd, index) => {
            const item = document.createElement('li');
            item.innerHTML = `
                <i class='bx ${cmd.icon} cp-item-icon'></i>
                <div class="cp-item-info">
                    <div class="cp-item-name">${cmd.name}</div>
                    <div class="cp-item-desc">${cmd.desc}</div>
                </div>
            `;
            if (index === activeCommandIndex) {
                item.classList.add('active');
            }
            item.addEventListener('click', () => {
                cmd.action();
                closeCommandPalette();
            });
            cpResults.appendChild(item);
        });
        if (cpResults.querySelector('.active')) {
            cpResults.querySelector('.active').scrollIntoView({ block: 'nearest' });
        }
    }

    function openCommandPalette() {
        cpContainer.style.display = 'block';
        cpInput.focus();
        activeCommandIndex = 0;
        renderCommands();
    }

    function closeCommandPalette() {
        cpContainer.style.display = 'none';
        cpInput.value = '';
    }

    cpInput.addEventListener('input', () => {
        const searchTerm = cpInput.value.toLowerCase();
        const filtered = commands.filter(cmd => 
            cmd.name.toLowerCase().includes(searchTerm) || 
            cmd.desc.toLowerCase().includes(searchTerm)
        );
        activeCommandIndex = 0;
        renderCommands(filtered);
    });
    
    cpInput.addEventListener('keydown', (e) => {
        const items = cpResults.querySelectorAll('li');
        if (items.length === 0) return;

        if (e.key === 'ArrowDown') {
            e.preventDefault();
            activeCommandIndex = (activeCommandIndex + 1) % items.length;
            renderCommands(commands.filter(cmd => cmd.name.toLowerCase().includes(cpInput.value.toLowerCase())));
        } else if (e.key === 'ArrowUp') {
            e.preventDefault();
            activeCommandIndex = (activeCommandIndex - 1 + items.length) % items.length;
            renderCommands(commands.filter(cmd => cmd.name.toLowerCase().includes(cpInput.value.toLowerCase())));
        } else if (e.key === 'Enter') {
            e.preventDefault();
            items[activeCommandIndex].click();
        }
    });

    document.addEventListener('keydown', (e) => {
        if ((e.ctrlKey || e.metaKey) && e.key === 'k') {
            e.preventDefault();
            openCommandPalette();
        }
        if (e.key === 'Escape' && cpContainer.style.display === 'block') {
            closeCommandPalette();
        }
    });

    cpContainer.addEventListener('click', (e) => {
        if (e.target === cpContainer) {
            closeCommandPalette();
        }
    });

    if(openCpMobileButton) {
        openCpMobileButton.addEventListener('click', (e) => {
            e.preventDefault();
            openCommandPalette();
        });
    }
}