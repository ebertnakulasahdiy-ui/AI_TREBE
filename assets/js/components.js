class AppSidebar extends HTMLElement {
    connectedCallback() {
        const active = this.getAttribute('active') || '';
        this.innerHTML = `
            <aside class="sidebar" id="appSidebar">
                <div class="sidebar-header">
                    <div class="logo"><i class="fa-solid fa-layer-group"></i> <span class="hide-collapsed">NexAI</span></div>
                    <button class="icon-btn hide-mobile" id="toggleSidebar"><i class="fa-solid fa-bars-staggered"></i></button>
                    <button class="icon-btn show-mobile" id="closeSidebarMobile"><i class="fa-solid fa-xmark"></i></button>
                </div>
                
                <div class="hide-collapsed" style="padding: 16px 16px 0;">
                    <a href="chat.html" class="nav-item new-chat-btn" style="color:var(--bg-main); background:var(--primary); font-weight:600; justify-content:center;">
                        <i class="fa-solid fa-plus"></i> <span>Chat Baru</span>
                    </a>
                </div>

                <nav class="nav-menu" style="margin-top: 16px;">
                    <a href="chat.html" class="nav-item ${active==='chat'?'active':''}"><i class="fa-regular fa-message"></i> <span class="hide-collapsed">Chat</span></a>
                    <a href="agent.html" class="nav-item ${active==='agent'?'active':''}"><i class="fa-solid fa-robot"></i> <span class="hide-collapsed">Agent</span></a>
                </nav>

                <div class="sidebar-divider"></div>
                <div class="hide-collapsed" style="padding: 0 16px 8px; font-size: 11px; font-weight: 600; color: var(--text-muted); text-transform: uppercase;">Riwayat Percakapan</div>
                
                <div class="chat-list hide-collapsed">
                    <div style="padding: 8px 12px; font-size: 12px; color: var(--text-muted); font-style: italic;">
                        Belum ada percakapan
                    </div>
                </div>

                <div class="sidebar-divider"></div>
                <nav class="nav-menu" style="padding-bottom:16px;">
                    <a href="settings.html" class="nav-item ${active==='settings'?'active':''}"><i class="fa-solid fa-gear"></i> <span class="hide-collapsed">Pengaturan</span></a>
                    <a href="profile.html" class="nav-item ${active==='profile'?'active':''}"><i class="fa-regular fa-user"></i> <span class="hide-collapsed">Profil</span></a>
                </nav>
            </aside>
            <div class="sidebar-overlay" id="sidebarOverlay"></div>
        `;
    }
}

class AppHeader extends HTMLElement {
    connectedCallback() {
        this.innerHTML = `
            <header class="app-header">
                <div class="header-left" style="display:flex; align-items:center; gap:16px;">
                    <button class="icon-btn show-mobile-inline" id="menuBtn"><i class="fa-solid fa-bars"></i></button>
                    <h2 class="hide-mobile">NexAI</h2>
                </div>
                
                <div class="model-selector-wrapper" style="position:absolute; left:50%; transform:translateX(-50%);">
                    <div class="model-selector" style="background:transparent; border:none; display:flex; align-items:center; gap:6px;">
                        <span class="hide-mobile" style="font-size:13px; font-weight:500; color:var(--text-muted);">Model:</span>
                        <select id="aiModelSelect" style="font-weight:600; padding:4px 8px; cursor:pointer; background:var(--bg-hover); border-radius:6px; border:none; outline:none; color:var(--text-main); font-family:inherit;">
                            <option value="gpt-4o">GPT-4o</option>
                            <option value="gemini-1.5-pro" selected>Gemini 1.5 Pro</option>
                            <option value="claude-3.5-sonnet">Claude 3.5 Sonnet</option>
                        </select>
                    </div>
                </div>

                <div class="header-actions">
                    <a href="login.html" style="display:flex; align-items:center; gap:8px; cursor:pointer; text-decoration:none;">
                        <img src="https://i.pravatar.cc/150?img=11" style="width:32px; height:32px; border-radius:50%; border:1px solid var(--border);">
                    </a>
                </div>
            </header>
        `;
    }
}

customElements.define('app-sidebar', AppSidebar);
customElements.define('app-header', AppHeader);
