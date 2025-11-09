document.addEventListener('DOMContentLoaded', function() {

    // ===== 1. LOGIKA DROPDOWN AVATAR =====
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

    // ===== 2. LOGIKA THEME SWITCHER =====
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

    // ===== 3. LOGIKA NAVIGASI SECTION =====
    const allNavLinks = document.querySelectorAll('.nav-link');
    const contentSections = document.querySelectorAll('.content-section');
    allNavLinks.forEach(link => {
        link.addEventListener('click', function(e) {
            e.preventDefault();
            const targetId = this.dataset.target;
            const targetSection = document.getElementById(targetId);

            contentSections.forEach(section => section.classList.remove('active'));
            if (targetSection) targetSection.classList.add('active');

            allNavLinks.forEach(syncLink => {
                const parent = syncLink.closest('.nav-item') || syncLink;
                if (syncLink.dataset.target === targetId) {
                    parent.classList.add('active');
                } else {
                    parent.classList.remove('active');
                }
            });
        });
    });

    // ===== 4. LOGIKA HAMBURGER MENU (DIPULIHKAN) =====
    const hamburgerButton = document.getElementById('hamburger-button');
    const dashboardContainer = document.querySelector('.dashboard-container');
    if (hamburgerButton && dashboardContainer) {
        const currentSidebarState = localStorage.getItem('sidebarState');
        if (currentSidebarState === 'collapsed') {
            dashboardContainer.classList.add('sidebar-collapsed');
        }
        hamburgerButton.addEventListener('click', function() {
            dashboardContainer.classList.toggle('sidebar-collapsed');
            if (dashboardContainer.classList.contains('sidebar-collapsed')) {
                localStorage.setItem('sidebarState', 'collapsed');
            } else {
                localStorage.setItem('sidebarState', 'expanded');
            }
        });
    }

    console.log("Dashboard V5 script loaded: Stable version restored.");
});