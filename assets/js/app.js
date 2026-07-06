document.addEventListener('DOMContentLoaded', () => {
    // 1. Sidebar Desktop Collapse Logic
    const sidebarToggle = document.getElementById('toggleSidebar');
    const sidebar = document.getElementById('appSidebar');
    
    const savedSidebar = localStorage.getItem('nexai_sidebar_collapsed');
    if (savedSidebar === 'true' && sidebar) {
        sidebar.classList.add('collapsed');
    }

    if (sidebarToggle && sidebar) {
        sidebarToggle.addEventListener('click', () => {
            sidebar.classList.toggle('collapsed');
            localStorage.setItem('nexai_sidebar_collapsed', sidebar.classList.contains('collapsed'));
        });
    }

    // 2. Mobile Drawer Logic
    const menuBtn = document.getElementById('menuBtn');
    const closeSidebarMobile = document.getElementById('closeSidebarMobile');
    const sidebarOverlay = document.getElementById('sidebarOverlay');

    if (menuBtn && sidebar) {
        menuBtn.addEventListener('click', () => {
            sidebar.classList.add('mobile-active');
            if(sidebarOverlay) sidebarOverlay.classList.add('active');
        });
    }

    function closeMobileSidebar() {
        if(sidebar) sidebar.classList.remove('mobile-active');
        if(sidebarOverlay) sidebarOverlay.classList.remove('active');
    }

    if (closeSidebarMobile) closeSidebarMobile.addEventListener('click', closeMobileSidebar);
    if (sidebarOverlay) sidebarOverlay.addEventListener('click', closeMobileSidebar);
});
