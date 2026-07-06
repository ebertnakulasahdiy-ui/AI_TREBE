document.addEventListener('DOMContentLoaded', () => {
    // --- Auth Gate ---
    const session = localStorage.getItem('aitrebe_session');
    if (!session) { window.location.href = 'login.html'; return; }
    const sessionData = JSON.parse(session);

    // Populate user info from session
    const sidebarAvatar = document.getElementById('sidebarAvatar');
    const headerAvatar = document.getElementById('headerAvatar');
    const sidebarUserName = document.getElementById('sidebarUserName');
    if (sidebarAvatar && sessionData.avatar) sidebarAvatar.src = sessionData.avatar;
    if (headerAvatar && sessionData.avatar) headerAvatar.src = sessionData.avatar;
    if (sidebarUserName && sessionData.name) sidebarUserName.textContent = sessionData.name;

    // --- Global Handlers ---
    window.showToast = function(message) {
        let toast = document.getElementById('app-toast');
        if (!toast) {
            toast = document.createElement('div');
            toast.id = 'app-toast';
            toast.style.cssText = 'position:fixed;bottom:20px;left:50%;transform:translateX(-50%);background:var(--primary);color:white;padding:10px 20px;border-radius:20px;font-size:0.9rem;z-index:1000;box-shadow:0 4px 12px rgba(0,0,0,0.2);opacity:0;transition:opacity 0.3s;pointer-events:none;';
            document.body.appendChild(toast);
        }
        toast.textContent = message;
        toast.style.opacity = '1';
        setTimeout(() => { toast.style.opacity = '0'; }, 3000);
    };

    window.handleLike = function(btn) {
        btn.innerHTML = '<i class="fa-solid fa-thumbs-up" style="color:var(--primary)"></i>';
        showToast('Feedback diterima. Terima kasih!');
    };

    window.handleDislike = function(btn) {
        btn.innerHTML = '<i class="fa-solid fa-thumbs-down" style="color:var(--danger)"></i>';
        showToast('Kami akan berusaha lebih baik lagi.');
    };

    window.handleRegenerate = function() {
        showToast('Membuat ulang respons...');
    };

    // --- Initialize Libraries ---
    initParticlesConfig('#6366f1');
    setupMarkdownRenderer();

    // --- UI Elements ---
    const themeToggleBtn = document.getElementById('themeToggleBtn');
    const htmlElement = document.documentElement;
    const chatInput = document.getElementById('chatInput');
    const sendBtn = document.getElementById('sendBtn');
    const chatArea = document.getElementById('chatArea');
    const chatContainer = document.getElementById('chatContainer');
    const emptyState = document.getElementById('emptyState');
    const actionButtons = document.getElementById('actionButtons');
    const stopBtn = document.getElementById('stopBtn');
    
    // Sidebar & Navigation
    const menuBtn = document.getElementById('menuBtn');
    const sidebar = document.getElementById('sidebar');
    const closeSidebarBtn = document.getElementById('closeSidebarBtn');
    const searchInput = document.getElementById('searchInput');
    const newChatBtn = document.getElementById('newChatBtn');
    const memoryBtn = document.getElementById('memoryBtn');
    const settingsBtn = document.getElementById('settingsBtn');
    const uploadBtn = document.getElementById('uploadBtn');
    
    // Suggestion Chips
    const suggestionChips = document.querySelectorAll('.suggestion-chip');

    // --- State ---
    let isGenerating = false;
    let currentStreamInterval = null;
    let isFirstMessage = true;
    
    // NEW: Smart Memory & Context
    let userName = localStorage.getItem('aitrebe_username') || (sessionData ? sessionData.name : null);
    let conversationHistory = [];

    // --- Setup Markdown & Highlight.js ---
    function setupMarkdownRenderer() {
        const renderer = new marked.Renderer();
        
        // Override code block rendering for macOS style window
        renderer.code = function(code, language) {
            const lang = language || 'text';
            const validLang = hljs.getLanguage(lang) ? lang : 'plaintext';
            const highlightedCode = hljs.highlight(validLang, code).value;
            
            // Unique ID for copy/preview actions
            const codeId = 'code-' + Math.random().toString(36).substr(2, 9);
            
            let previewBtn = '';
            // If it's HTML, add a preview button
            if (lang.toLowerCase() === 'html' || lang.toLowerCase() === 'xml') {
                previewBtn = `<button class="code-action-btn" onclick="previewHTML('${codeId}')"><i class="fa-solid fa-play"></i> Preview</button>`;
            }

            return `
            <div class="code-block-wrapper">
                <div class="code-block-header">
                    <div class="mac-dots">
                        <div class="mac-dot dot-red"></div>
                        <div class="mac-dot dot-yellow"></div>
                        <div class="mac-dot dot-green"></div>
                    </div>
                    <div class="code-lang">${lang}</div>
                    <div class="code-actions">
                        ${previewBtn}
                        <button class="code-action-btn" onclick="copyCode(this, '${codeId}')">
                            <i class="fa-regular fa-copy"></i> Copy
                        </button>
                    </div>
                </div>
                <div class="code-block-body">
                    <pre><code id="${codeId}" class="hljs ${validLang}">${highlightedCode}</code></pre>
                </div>
            </div>`;
        };
        
        marked.setOptions({ renderer: renderer, breaks: true });
    }

    // Global functions for inline HTML event handlers (Copy/Preview)
    window.copyCode = function(btn, codeId) {
        const codeEl = document.getElementById(codeId);
        const textArea = document.createElement("textarea");
        textArea.value = codeEl.innerText; // Get raw text without HTML tags
        document.body.appendChild(textArea);
        textArea.select();
        document.execCommand("Copy");
        textArea.remove();
        
        const originalHtml = btn.innerHTML;
        btn.innerHTML = '<i class="fa-solid fa-check" style="color:var(--success)"></i> Copied';
        setTimeout(() => { btn.innerHTML = originalHtml; }, 2000);
    };

    window.previewHTML = function(codeId) {
        const codeEl = document.getElementById(codeId);
        const htmlContent = codeEl.innerText;
        const newWindow = window.open('', '_blank');
        newWindow.document.write(htmlContent);
        newWindow.document.close();
    };

    // --- Theme Logic ---
    if (themeToggleBtn) {
        themeToggleBtn.addEventListener('click', () => {
            const currentTheme = htmlElement.getAttribute('data-theme');
            const newTheme = currentTheme === 'dark' ? 'light' : 'dark';
            htmlElement.setAttribute('data-theme', newTheme);
        
        const themeIcon = document.getElementById('themeIcon');
        const highlightTheme = document.getElementById('highlightTheme');
        
            if (newTheme === 'light') {
                themeIcon.className = 'fa-solid fa-moon';
                updateParticlesColor('#4f46e5');
                if (highlightTheme) highlightTheme.href = 'https://cdnjs.cloudflare.com/ajax/libs/highlight.js/11.9.0/styles/atom-one-light.min.css';
            } else {
                themeIcon.className = 'fa-solid fa-sun';
                updateParticlesColor('#6366f1');
                if (highlightTheme) highlightTheme.href = 'https://cdnjs.cloudflare.com/ajax/libs/highlight.js/11.9.0/styles/atom-one-dark.min.css';
            }
        });
    }

    // --- Button Actions Logic ---
    if (uploadBtn) {
        uploadBtn.addEventListener('click', () => {
            const input = document.createElement('input');
            input.type = 'file';
            input.onchange = (e) => {
                if (e.target.files.length > 0) {
                    const fileName = e.target.files[0].name;
                    if(isFirstMessage) removeEmptyState();
                    appendUserMessage(`*File dilampirkan: \`${fileName}\`*`);
                    simulateAIResponse(`Saya telah menerima file **${fileName}**. Analisis awal menunjukkan struktur data yang valid. Apa yang ingin Anda ekstrak atau modifikasi dari dokumen ini?`);
                }
            };
            input.click();
        });
    }

    if (memoryBtn) {
        let memoryActive = true;
        memoryBtn.addEventListener('click', () => {
            memoryActive = !memoryActive;
            const icon = memoryBtn.querySelector('i');
            if (memoryActive) {
                icon.style.color = 'var(--primary)';
                showToast('AI Memory: Aktif');
            } else {
                icon.style.color = 'var(--text-secondary)';
                showToast('AI Memory: Nonaktif');
            }
        });
    }

    // Logout Button
    const logoutBtn = document.getElementById('logoutBtn');
    if (logoutBtn) {
        logoutBtn.addEventListener('click', () => {
            localStorage.removeItem('aitrebe_session');
            localStorage.removeItem('aitrebe_username');
            window.location.href = 'login.html';
        });
    }

    // --- Keyboard Shortcuts ---
    document.addEventListener('keydown', (e) => {
        // Ctrl+K -> Focus Search
        if ((e.ctrlKey || e.metaKey) && e.key === 'k') {
            e.preventDefault();
            if(window.innerWidth <= 768) sidebar.classList.add('active');
            searchInput.focus();
        }
        // Ctrl+N -> New Chat
        if ((e.ctrlKey || e.metaKey) && e.key === 'n') {
            e.preventDefault();
            startNewChat();
        }
    });

    newChatBtn.addEventListener('click', startNewChat);

    function startNewChat() {
        chatContainer.innerHTML = '';
        chatContainer.appendChild(emptyState);
        emptyState.style.display = 'flex';
        isFirstMessage = true;
        chatInput.focus();
    }

    // --- Sidebar Mobile ---
    menuBtn.addEventListener('click', () => sidebar.classList.add('active'));
    closeSidebarBtn.addEventListener('click', () => sidebar.classList.remove('active'));
    
    // --- Input & Textarea Logic ---
    chatInput.addEventListener('input', function() {
        this.style.height = 'auto';
        this.style.height = (this.scrollHeight) + 'px';
        
        if (this.value.trim() !== '') {
            sendBtn.removeAttribute('disabled');
            sendBtn.classList.add('active');
        } else {
            sendBtn.setAttribute('disabled', 'true');
            sendBtn.classList.remove('active');
        }
    });

    chatInput.addEventListener('keydown', (e) => {
        if (e.key === 'Enter' && !e.shiftKey) {
            e.preventDefault();
            if (chatInput.value.trim() !== '' && !isGenerating) handleSendMessage();
        }
    });

    sendBtn.addEventListener('click', () => {
        if (chatInput.value.trim() !== '' && !isGenerating) handleSendMessage();
    });

    // Suggestion Chips Click
    suggestionChips.forEach(chip => {
        chip.addEventListener('click', () => {
            chatInput.value = chip.innerText.trim();
            chatInput.dispatchEvent(new Event('input'));
            handleSendMessage();
        });
    });

    // --- Drag and Drop File Upload ---
    const dragOverlay = document.getElementById('dragDropOverlay');
    
    document.addEventListener('dragover', (e) => {
        e.preventDefault();
        dragOverlay.classList.add('active');
    });
    
    document.addEventListener('dragleave', (e) => {
        e.preventDefault();
        if(e.relatedTarget === null) dragOverlay.classList.remove('active');
    });
    
    document.addEventListener('drop', (e) => {
        e.preventDefault();
        dragOverlay.classList.remove('active');
        if (e.dataTransfer.files.length > 0) {
            const fileName = e.dataTransfer.files[0].name;
            if(isFirstMessage) removeEmptyState();
            appendUserMessage(`*File dilampirkan: \`${fileName}\`*`);
            simulateAIResponse(`Saya telah menerima file **${fileName}**. Analisis awal menunjukkan struktur data yang valid. Apa yang ingin Anda ekstrak atau modifikasi dari dokumen ini?`);
        }
    });

    // --- Messaging Logic ---
    function removeEmptyState() {
        if(isFirstMessage) {
            emptyState.style.display = 'none';
            isFirstMessage = false;
        }
    }

    function scrollToBottom() {
        chatArea.scrollTo({ top: chatArea.scrollHeight, behavior: 'smooth' });
    }

    function appendUserMessage(text) {
        if(isFirstMessage) {
            const historyList = document.getElementById('chatHistoryList');
            if(historyList) {
                historyList.innerHTML = '';
                const preview = text.length > 22 ? text.substring(0, 22) + '...' : text;
                historyList.innerHTML = `<li class="nav-item active"><i class="fa-regular fa-message"></i> ${preview}</li>`;
            }
        }
        removeEmptyState();
        // Secure basic XSS for user text (except when we programmatically inject markdown logic above)
        const safeText = text.replace(/</g, "&lt;").replace(/>/g, "&gt;").replace(/\n/g, '<br>');
        
        const html = `
            <div class="message user-message fade-up">
                <div class="message-content-wrapper">
                    <div class="message-content">
                        ${marked.parse(text)}
                    </div>
                </div>
                <div class="message-avatar">
                    <img src="https://i.pravatar.cc/150?img=11" alt="Avatar" class="user-avatar-img">
                </div>
            </div>
        `;
        chatContainer.insertAdjacentHTML('beforeend', html);
        scrollToBottom();
    }

    function handleSendMessage() {
        const text = chatInput.value.trim();
        appendUserMessage(text);
        
        // Reset
        chatInput.value = '';
        chatInput.style.height = 'auto';
        sendBtn.setAttribute('disabled', 'true');
        sendBtn.classList.remove('active');

        // Save to context history
        conversationHistory.push(text);
        if (conversationHistory.length > 10) conversationHistory.shift();

        // Generate Smarter Response
        const response = generateSmartResponse(text);
        simulateAIResponse(response);
    }

    function simulateAIResponse(markdownText) {
        isGenerating = true;
        actionButtons.style.display = 'flex';
        
        // 1. Show "Thinking" Phase
        const messageId = 'ai-msg-' + Date.now();
        const initialHtml = `
            <div class="message ai-message fade-up" id="${messageId}">
                <div class="message-avatar">
                    <div class="ai-avatar"><i class="fa-solid fa-brain"></i></div>
                </div>
                <div class="message-content-wrapper" style="max-width:100%; width:100%">
                    <div class="message-content ai-thinking">
                        <i class="fa-solid fa-circle-notch fa-spin"></i>
                        <span class="thinking-text">Menganalisis pertanyaan Anda...</span>
                    </div>
                    <div class="message-content markdown-body ai-response-content" style="display:none;" id="${messageId}-content"></div>
                    <div class="ai-actions" id="actions-${messageId}" style="display:none; gap:12px; margin-top:12px; align-items:center;">
                        <button class="action-btn" title="Copy" onclick="copyCode(this, '${messageId}-content')"><i class="fa-regular fa-copy"></i></button>
                        <button class="action-btn" title="Regenerate" onclick="handleRegenerate()"><i class="fa-solid fa-rotate-right"></i></button>
                        <button class="action-btn" title="Like" onclick="handleLike(this)"><i class="fa-regular fa-thumbs-up"></i></button>
                        <button class="action-btn" title="Dislike" onclick="handleDislike(this)"><i class="fa-regular fa-thumbs-down"></i></button>
                    </div>
                </div>
            </div>
        `;
        chatContainer.insertAdjacentHTML('beforeend', initialHtml);
        scrollToBottom();

        // Dynamic Thinking Status
        let thinkingPhase = 0;
        const msgEl = document.getElementById(messageId);
        const thinkingText = msgEl.querySelector('.thinking-text');
        
        const thinkingInterval = setInterval(() => {
            thinkingPhase++;
            if(thinkingPhase === 1) thinkingText.innerText = 'Merumuskan jawaban terbaik...';
            if(thinkingPhase === 2) thinkingText.innerText = 'Menyusun respons yang akurat...';
        }, 350);

        // 2. Transition to Streaming Phase after delay
        setTimeout(() => {
            clearInterval(thinkingInterval);
            if (!isGenerating) return;
            
            const thinkingEl = msgEl.querySelector('.ai-thinking');
            const contentEl = msgEl.querySelector('.ai-response-content');
            
            thinkingEl.style.display = 'none';
            contentEl.style.display = 'block';
            
            let i = 0;
            let currentText = "";
            
            // Stream in larger chunks to improve performance and prevent browser lag (heavy highlight.js)
            currentStreamInterval = setInterval(() => {
                if(!isGenerating) {
                    clearInterval(currentStreamInterval);
                    return;
                }
                
                // Increase chunk size significantly to finish faster and reduce layout thrashing
                const chunkSize = Math.floor(Math.random() * 20) + 15;
                currentText += markdownText.substring(i, i + chunkSize);
                i += chunkSize;
                
                // Parse markdown incrementally.
                contentEl.innerHTML = marked.parse(currentText) + '<span class="streaming-cursor"></span>';
                
                // Throttle scrolling slightly for performance
                if (i % 2 === 0) scrollToBottom();
                
                if (i >= markdownText.length) {
                    clearInterval(currentStreamInterval);
                    contentEl.innerHTML = marked.parse(markdownText);
                    scrollToBottom();
                    finishGenerating();
                }
            }, 30); // Run every 30ms instead of 10ms
        }, 800); // Reduce initial thinking duration
    }

    stopBtn.addEventListener('click', () => {
        if(currentStreamInterval) clearInterval(currentStreamInterval);
        
        const streamingCursors = document.querySelectorAll('.streaming-cursor');
        streamingCursors.forEach(el => el.remove());
        
        finishGenerating();
    });

    function finishGenerating() {
        isGenerating = false;
        actionButtons.style.display = 'none';
        
        // Show the latest action buttons
        const allActions = document.querySelectorAll('.ai-actions');
        if (allActions.length > 0) {
            allActions[allActions.length - 1].style.display = 'flex';
        }
    }

    // --- Smarter AI Logic Engine ---
    function generateSmartResponse(input) {
        const text = input.toLowerCase();
        
        // Memory System - Learn Name
        const nameMatch = text.match(/(?:nama saya|panggil saya|namaku|aku) ([a-zA-Z\s]+)/);
        if (nameMatch && nameMatch[1] && !text.includes('apa')) {
            userName = nameMatch[1].trim();
            localStorage.setItem('aitrebe_username', userName);
            return `Salam kenal, **${userName}**! Senang bisa membantu Anda hari ini. Apa proyek yang sedang Anda kerjakan?`;
        }

        // Utilities - Time/Date
        if (text.includes('jam berapa') || text.includes('hari apa') || text.includes('tanggal berapa')) {
            const now = new Date();
            const options = { weekday: 'long', year: 'numeric', month: 'long', day: 'numeric', hour: '2-digit', minute:'2-digit' };
            return `Saat ini adalah **${now.toLocaleDateString('id-ID', options)}**. Waktu yang sangat tepat untuk memecahkan masalah kompleks!`;
        }
        
        // Utilities - Weather (mock)
        if (text.includes('cuaca')) {
            return `Meskipun saya tidak memiliki akses real-time ke lokasi Anda, cuaca di dunia digital selalu cerah untuk *coding*! Pastikan Anda tetap terhidrasi selagi bekerja.`;
        }

        // Contextual Awareness
        if (text.includes('sebelumnya') || text.includes('yang tadi') || text.includes('lanjutkan')) {
            if (conversationHistory.length > 1) {
                const lastTopic = conversationHistory[conversationHistory.length - 2];
                return `Mengenai permintaan Anda sebelumnya: *"${lastTopic}"* ya? Tentu, mari kita lanjutkan eksplorasi bagian tersebut. Bagian spesifik mana yang ingin di-optimasi?`;
            } else {
                return `Maaf, sepertinya saya belum memiliki ingatan tentang topik sebelumnya di sesi ini. Bisa Anda ingatkan kembali konteksnya?`;
            }
        }
        
        // Deep Technical Analysis (Mock)
        if (text.includes('bagaimana cara') && text.includes('arsitektur')) {
            return `Untuk merancang arsitektur yang tangguh, kita perlu mempertimbangkan **Skalabilitas**, **Keamanan**, dan **Maintainability**.\n\nPendekatan terbaik biasanya melibatkan:\n1. **Microservices** atau **Modular Monolith** tergantung ukuran tim.\n2. **Event-Driven Architecture** (misal Kafka/RabbitMQ) untuk decoupling.\n3. **Caching Layer** (Redis) untuk performa baca yang tinggi.\n\nApakah Anda ingin melihat contoh diagram sistem untuk kasus spesifik?`;
        }
        
        if (text.includes('database') || text.includes('sql') || text.includes('mongodb')) {
             return `Memilih *database* yang tepat sangat krusial.\n\n- Gunakan **PostgreSQL/MySQL** jika data Anda sangat terstruktur dan membutuhkan transaksi ACID (misal: sistem finansial).\n- Gunakan **MongoDB** jika skema data sering berubah atau berbasis dokumen (JSON).\n- Gunakan **Redis** untuk *caching* dan antrean berkecepatan tinggi.\n\nIngin saya buatkan contoh skema tabel/koleksi untuk proyek Anda?`;
        }
        
        if (text.includes('error') && text.includes('cors')) {
            return `**CORS (Cross-Origin Resource Sharing)** error terjadi ketika *frontend* dan *backend* berada di domain/port yang berbeda. \n\n**Solusi Umum:**\nPastikan server *backend* Anda mengirim header:\n\`Access-Control-Allow-Origin: *\` (atau domain spesifik Anda)\n\nJika menggunakan Node.js (Express), gunakan *middleware* \`cors\`:\n\`\`\`javascript\nconst cors = require('cors');\napp.use(cors());\n\`\`\`\nBisa Anda tunjukkan teknologi *backend* apa yang Anda gunakan?`;
        }

        // Greetings
        if (text.match(/^(halo|hai|hello|hi|hey|pagi|siang|sore|malam|assalam)/)) {
            const greetingName = userName ? ` **${userName}**` : '';
            return `Halo${greetingName}! Saya **AI TREBE**, asisten AI cerdas serba bisa. Siap membantu Anda!\n\nSaya bisa membantu berbagai hal:\n- 📚 **Edukasi** — Matematika, Fisika, Sejarah, Bahasa\n- 💼 **Pekerjaan** — Email, Laporan, Ide Pemasaran\n- 💻 **Teknis** — Coding, Debugging, Arsitektur\n- 🍳 **Kehidupan** — Resep, Liburan, Olahraga, Tips\n\nApa yang ingin Anda tanyakan hari ini?`;
        }
        
        // Identity / capability
        if (text.includes('siapa kamu') || text.includes('kamu siapa') || text.includes('bisa apa') || text.includes('kemampuan')) {
            return `Saya adalah **AI TREBE**, asisten AI cerdas serba bisa yang dirancang untuk membantu Anda dalam berbagai aspek kehidupan.\n\n**Kemampuan saya meliputi:**\n- 📚 **Edukasi & Tugas** — Menyelesaikan soal matematika, menjelaskan teori fisika, merangkum jurnal ilmiah\n- 💼 **Pekerjaan & Bisnis** — Draft email profesional, menyusun laporan, ide konten pemasaran\n- 💻 **Teknis & Coding** — Menemukan error, menulis kode, arsitektur sistem\n- 🍳 **Kehidupan Sehari-hari** — Resep masakan, rencana liburan, tips olahraga & kesehatan\n- 🌍 **Pengetahuan Umum** — Sejarah, geografi, sains, budaya\n\nSilakan tanyakan apa saja!`;
        }
        
        if (text.includes('terima kasih') || text.includes('makasih') || text.includes('thank')) {
             return `Sama-sama${userName ? ` ${userName}` : ''}! Senang bisa membantu Anda. Jangan ragu untuk bertanya lagi kapan saja. Semoga harimu menyenangkan! 😊`;
        }

        // Math/Logic Simulation
        if (text.includes('hitung') || text.match(/\d+\s*[\+\-\*\/]\s*\d+/)) {
            try {
                // Sangat sederhana kalkulator mockup
                const mathMatch = text.match(/\d+\s*[\+\-\*\/]\s*\d+/);
                if (mathMatch) {
                    const mathStr = mathMatch[0];
                    const result = new Function('return ' + mathStr)();
                    return `Berdasarkan kalkulasi: **${mathStr} = ${result}**.\n\nUntuk komputasi atau algoritma tingkat lanjut, Anda bisa meminta saya membuatkan fungsi Python atau JavaScript yang teroptimasi.`;
                }
            } catch (e) {
                // Fallback
            }
            return `Untuk komputasi atau logika tingkat lanjut, saya sarankan Anda membuat skrip Python. Namun, jika ini perhitungan matematis sederhana, Anda bisa mencoba menggunakan Python di sini:\n\n\`\`\`python\n# Contoh operasi logika\nresult = eval("2 + 2") \nprint(result)\n\`\`\``;
        }

        // === EDUKASI & TUGAS ===
        if (text.includes('matematika') || text.includes('rumus') || text.includes('aljabar') || text.includes('geometri') || text.includes('kalkulus') || text.includes('statistik')) {
            return `## 📐 Matematika\n\nTentu, saya siap membantu soal matematika Anda! Berikut beberapa topik yang bisa saya jelaskan:\n\n- **Aljabar** — Persamaan linear, kuadrat, polinomial\n- **Geometri** — Luas, keliling, volume bangun ruang\n- **Kalkulus** — Turunan, integral, limit\n- **Statistik** — Mean, median, modus, standar deviasi\n\nSilakan kirimkan soal spesifik Anda dan saya akan menyelesaikannya langkah demi langkah! 📝`;
        }
        if (text.includes('fisika') || text.includes('gaya') || text.includes('newton') || text.includes('energi') || text.includes('listrik') || text.includes('gravitasi')) {
            return `## ⚛️ Fisika\n\nMari kita bahas konsep fisika yang Anda tanyakan:\n\n**Hukum Newton:**\n1. Benda diam tetap diam kecuali ada gaya (*F = 0*)\n2. **F = m × a** (Gaya = massa × percepatan)\n3. Aksi = Reaksi\n\n**Rumus Penting:**\n- Energi Kinetik: \`Ek = ½mv²\`\n- Energi Potensial: \`Ep = mgh\`\n- Hukum Ohm: \`V = I × R\`\n\nKirimkan soal spesifik Anda untuk penjelasan detail! 🔬`;
        }
        if (text.includes('sejarah') || text.includes('perang dunia') || text.includes('kemerdekaan') || text.includes('kerajaan') || text.includes('revolusi')) {
            return `## 📜 Sejarah\n\nSejarah adalah jendela untuk memahami masa kini. Beberapa topik yang bisa kita bahas:\n\n- **Sejarah Indonesia** — Kerajaan Majapahit, Sriwijaya, Proklamasi 1945\n- **Sejarah Dunia** — Perang Dunia I & II, Revolusi Industri, Perang Dingin\n- **Peradaban Kuno** — Mesir, Romawi, Yunani, Tiongkok\n\nTopik sejarah mana yang ingin Anda dalami? Saya bisa menjelaskan secara kronologis dan detail. 🏛️`;
        }
        if (text.includes('biologi') || text.includes('sel') || text.includes('dna') || text.includes('evolusi') || text.includes('ekosistem') || text.includes('fotosintesis')) {
            return `## 🧬 Biologi\n\nMari kita jelajahi dunia biologi:\n\n**Topik Utama:**\n- **Sel** — Unit terkecil kehidupan (prokariota vs eukariota)\n- **Genetika** — DNA, RNA, pewarisan sifat Mendel\n- **Evolusi** — Teori Darwin, seleksi alam\n- **Ekologi** — Rantai makanan, ekosistem, biodiversitas\n- **Fotosintesis**: \`6CO₂ + 6H₂O → C₆H₁₂O₆ + 6O₂\`\n\nApa topik spesifik yang ingin Anda pelajari? 🌿`;
        }
        if (text.includes('kimia') || text.includes('atom') || text.includes('unsur') || text.includes('reaksi kimia') || text.includes('mol') || text.includes('periodik')) {
            return `## ⚗️ Kimia\n\nMari kita pelajari kimia bersama:\n\n- **Struktur Atom** — Proton, neutron, elektron\n- **Tabel Periodik** — Golongan, periode, sifat unsur\n- **Reaksi Kimia** — Penyetaraan persamaan, jenis reaksi\n- **Stoikiometri** — Perhitungan mol dan massa\n\nKirimkan soal atau konsep yang ingin Anda pahami! 🧪`;
        }
        if (text.includes('bahasa inggris') || text.includes('english') || text.includes('grammar') || text.includes('terjemah') || text.includes('translate') || text.includes('vocabulary')) {
            return `## 🌐 Bahasa Inggris\n\nSaya bisa membantu Anda belajar bahasa Inggris:\n\n**Layanan yang tersedia:**\n- ✏️ **Grammar** — Tenses, articles, prepositions\n- 📖 **Vocabulary** — Kata-kata baru dengan konteks\n- 🔄 **Terjemahan** — Indonesia ↔ Inggris\n- ✍️ **Writing** — Koreksi esai, surat, email\n- 🗣️ **Conversation** — Frasa sehari-hari\n\nMau belajar apa hari ini? Kirimkan teks untuk diterjemahkan atau konsep grammar yang ingin dipelajari!`;
        }

        // === PEKERJAAN & BISNIS ===
        if (text.includes('email') || text.includes('surat') || text.includes('draft')) {
            return `## ✉️ Draft Email Profesional\n\nBerikut contoh template email profesional:\n\n---\n**Subject:** [Perihal Email Anda]\n\nYth. Bapak/Ibu [Nama],\n\nDengan hormat,\n\nSaya ingin menyampaikan [isi pesan Anda]. Terlampir dokumen yang relevan untuk referensi Bapak/Ibu.\n\nMohon kesediaan Bapak/Ibu untuk [aksi yang diminta]. Saya siap untuk mendiskusikan lebih lanjut pada waktu yang sesuai.\n\nAtas perhatian dan kerjasamanya, saya ucapkan terima kasih.\n\nHormat saya,\n[Nama Anda]\n[Jabatan]\n[Kontak]\n\n---\n\nBeritahu saya konteks spesifik email yang ingin Anda buat, dan saya akan menyesuaikannya! 📧`;
        }
        if (text.includes('laporan') || text.includes('report') || text.includes('presentasi')) {
            return `## 📊 Menyusun Laporan\n\nBerikut struktur laporan profesional yang baik:\n\n### Kerangka Laporan:\n1. **Halaman Judul** — Judul, penulis, tanggal\n2. **Ringkasan Eksekutif** — Inti laporan dalam 1 paragraf\n3. **Pendahuluan** — Latar belakang & tujuan\n4. **Metodologi** — Cara pengumpulan data\n5. **Hasil & Analisis** — Data, grafik, temuan\n6. **Kesimpulan** — Rangkuman temuan utama\n7. **Rekomendasi** — Langkah selanjutnya\n8. **Lampiran** — Data pendukung\n\n**Tips:** Gunakan visualisasi data (grafik/tabel) untuk memperjelas poin Anda.\n\nBeritahu saya topik laporan Anda dan saya akan membantu menyusunnya! 📋`;
        }
        if (text.includes('pemasaran') || text.includes('marketing') || text.includes('konten') || text.includes('content') || text.includes('iklan') || text.includes('promosi')) {
            return `## 📣 Ide Konten & Pemasaran\n\nBerikut strategi konten yang bisa Anda terapkan:\n\n**Tipe Konten Efektif:**\n- 🎥 **Video Pendek** — Reels/TikTok (15-60 detik)\n- 📝 **Carousel** — Tips/edukasi slide-by-slide\n- 📖 **Storytelling** — Cerita di balik brand Anda\n- 🎯 **CTA yang Kuat** — Ajakan bertindak yang jelas\n\n**Formula Copywriting AIDA:**\n1. **Attention** — Judul yang menarik perhatian\n2. **Interest** — Fakta/masalah yang relevan\n3. **Desire** — Solusi yang Anda tawarkan\n4. **Action** — Ajakan untuk bertindak\n\nMau saya buatkan contoh konten untuk produk/jasa spesifik Anda? 🚀`;
        }

        // === KEHIDUPAN SEHARI-HARI ===
        if (text.includes('resep') || text.includes('masak') || text.includes('makanan') || text.includes('dapur') || text.includes('menu')) {
            return `## 🍳 Resep & Masakan\n\nBerikut resep **Nasi Goreng Spesial** yang mudah dan lezat:\n\n### Bahan:\n- 2 piring nasi putih (sisa semalam lebih baik)\n- 2 butir telur\n- 3 siung bawang putih, cincang\n- 5 siung bawang merah, iris\n- 2 sdm kecap manis\n- 1 sdm saus tiram\n- Garam & merica secukupnya\n- Sayuran (sawi, wortel) secukupnya\n\n### Cara Membuat:\n1. Panaskan minyak, tumis bawang hingga harum\n2. Masukkan telur, orak-arik\n3. Tambahkan sayuran, aduk rata\n4. Masukkan nasi, kecap manis, saus tiram\n5. Aduk rata dengan api besar 3-5 menit\n6. Sajikan dengan kerupuk dan acar 🍽️\n\nMau resep lain? Beritahu bahan yang Anda punya!`;
        }
        if (text.includes('olahraga') || text.includes('fitness') || text.includes('gym') || text.includes('latihan') || text.includes('workout') || text.includes('push up') || text.includes('lari')) {
            return `## 💪 Tips Olahraga & Fitness\n\n### Program Latihan Pemula (30 menit/hari):\n\n**Senin (Upper Body):**\n- Push-up: 3 × 10 repetisi\n- Plank: 3 × 30 detik\n- Arm circles: 2 × 20\n\n**Rabu (Lower Body):**\n- Squat: 3 × 15\n- Lunges: 3 × 10/kaki\n- Calf raises: 3 × 20\n\n**Jumat (Cardio):**\n- Jogging: 20 menit\n- Jumping jacks: 3 × 30 detik\n- Stretching: 10 menit\n\n**Tips Penting:**\n- 💧 Minum air minimal 2 liter/hari\n- 😴 Tidur 7-8 jam untuk pemulihan otot\n- 🥗 Konsumsi protein setelah latihan\n\nMau program yang lebih spesifik? Beritahu level dan tujuan Anda!`;
        }
        if (text.includes('liburan') || text.includes('wisata') || text.includes('travel') || text.includes('jalan-jalan') || text.includes('destinasi') || text.includes('hotel')) {
            return `## ✈️ Rencana Liburan\n\nBerikut rekomendasi destinasi wisata populer di Indonesia:\n\n### 🏖️ Pantai & Alam:\n- **Bali** — Raja Ampat, Nusa Penida, Uluwatu\n- **Lombok** — Gili Trawangan, Pantai Kuta\n- **Labuan Bajo** — Pulau Komodo, Pink Beach\n\n### 🏔️ Pegunungan:\n- **Bromo** — Sunrise terbaik di Jawa\n- **Dieng** — Kawah, telaga, budaya\n- **Bandung** — Kawah Putih, Tangkuban Perahu\n\n### 🏛️ Budaya & Kota:\n- **Yogyakarta** — Borobudur, Prambanan, Malioboro\n- **Solo** — Keraton, Batik, kuliner\n\n**Tips Hemat:**\n- Booking jauh hari untuk harga terbaik\n- Pilih hari kerja untuk menghindari keramaian\n- Gunakan transportasi lokal\n\nMau saya buatkan itinerary detail untuk destinasi tertentu? 🗺️`;
        }
        if (text.includes('kesehatan') || text.includes('sakit') || text.includes('obat') || text.includes('diet') || text.includes('gizi') || text.includes('nutrisi') || text.includes('vitamin')) {
            return `## 🏥 Tips Kesehatan\n\n**Kebiasaan Sehat yang Penting:**\n\n1. 💧 **Hidrasi** — Minum 8 gelas air per hari\n2. 🥗 **Nutrisi Seimbang** — Penuhi gizi: karbohidrat, protein, lemak sehat, serat\n3. 😴 **Tidur Berkualitas** — 7-9 jam per malam\n4. 🏃 **Olahraga Rutin** — Minimal 150 menit/minggu\n5. 🧘 **Kelola Stres** — Meditasi, hobi, quality time\n\n**Vitamin Penting:**\n- Vitamin C — Daya tahan tubuh (jeruk, jambu)\n- Vitamin D — Tulang kuat (sinar matahari pagi)\n- Vitamin B12 — Energi (daging, telur, susu)\n\n> ⚠️ *Disclaimer: Saya bukan pengganti dokter. Untuk keluhan serius, segera konsultasi ke tenaga medis profesional.*\n\nAda pertanyaan kesehatan spesifik?`;
        }
        if (text.includes('motivasi') || text.includes('semangat') || text.includes('sedih') || text.includes('galau') || text.includes('stress') || text.includes('bosan')) {
            return `## 💫 Kata Motivasi\n\n> *"Kamu tidak harus sempurna untuk memulai. Tapi kamu harus memulai untuk menjadi lebih baik."*\n\n---\n\nBeberapa hal yang bisa membantu:\n\n1. 🎯 **Tetapkan tujuan kecil** — Mulai dari yang mudah dicapai\n2. 📝 **Tulis 3 hal yang disyukuri** setiap hari\n3. 🚶 **Bergerak** — Jalan kaki 15 menit bisa mengubah mood\n4. 🎵 **Dengarkan musik** yang membangkitkan semangat\n5. 💬 **Ceritakan** perasaanmu ke orang terdekat\n\n*Ingat: Setiap orang punya ritme masing-masing. Tidak apa-apa untuk istirahat sejenak.* Kamu sudah melakukan yang terbaik! 🌟\n\nMau cerita lebih lanjut? Saya di sini untuk mendengarkan.`;
        }

        // === TEKNIS & CODING ===
        if (text.includes('react') || text.includes('next.js') || text.includes('vue')) {
            return getReactMock();
        } 
        if (text.includes('python') || text.includes('scrap') || text.includes('api') || text.includes('backend') || text.includes('server')) {
            return getPythonMock();
        }
        if (text.includes('html') || text.includes('css') || text.includes('tombol') || text.includes('ui') || text.includes('tampilan') || text.includes('desain') || text.includes('website') || text.includes('landing page')) {
            return getHtmlCssMock();
        }
        if (text.includes('kode') || text.includes('script') || text.includes('error') || text.includes('bug') || text.includes('javascript') || text.includes('js') || text.includes('coding') || text.includes('programming')) {
            return getGeneralMock();
        }
        if (text.includes('database') || text.includes('sql') || text.includes('mongodb')) {
            return `## 🗄️ Database\n\nMemilih database yang tepat sangat krusial:\n\n- **PostgreSQL/MySQL** — Data terstruktur, transaksi ACID\n- **MongoDB** — Skema fleksibel, berbasis dokumen\n- **Redis** — Caching & antrean berkecepatan tinggi\n\nIngin saya buatkan contoh skema untuk proyek Anda?`;
        }

        // Fallback — universal response
        const personalized = userName ? `, ${userName}` : '';
        return `Terima kasih atas pertanyaannya${personalized}! 😊\n\nSaya menganalisis pesan Anda:\n> *"${input}"*\n\nSebagai **AI TREBE**, saya bisa membantu berbagai hal:\n- 📚 Edukasi (matematika, fisika, sejarah, bahasa)\n- 💼 Pekerjaan (email, laporan, ide bisnis)\n- 💻 Teknis (coding, debugging)\n- 🍳 Kehidupan (resep, liburan, kesehatan, olahraga)\n\nBisa Anda berikan detail lebih lanjut agar saya bisa memberikan jawaban yang lebih spesifik?`;
    }

    // --- Mock Data Generators (Structured Output) ---
    function getHtmlCssMock() {
        return `Tentu! Berikut adalah contoh implementasi **HTML & CSS** modern dengan desain *Glassmorphism* yang saat ini sedang tren.
        
### 1. Struktur HTML
\`\`\`html
<div class="glass-card">
  <h3>Modern UI</h3>
  <p>Tampilan ini menggunakan efek blur (backdrop-filter) yang membuatnya terlihat premium.</p>
  <button class="btn-primary">Pelajari Lebih Lanjut</button>
</div>
\`\`\`

### 2. Styling CSS
\`\`\`css
.glass-card {
    background: rgba(255, 255, 255, 0.1);
    backdrop-filter: blur(16px);
    -webkit-backdrop-filter: blur(16px);
    border: 1px solid rgba(255, 255, 255, 0.2);
    border-radius: 16px;
    padding: 24px;
    color: var(--text-primary); /* Menyesuaikan tema NexAI */
    box-shadow: 0 4px 30px rgba(0, 0, 0, 0.1);
}

.btn-primary {
    background: #6366f1;
    color: white;
    border: none;
    padding: 10px 20px;
    border-radius: 8px;
    cursor: pointer;
    font-weight: 500;
    transition: all 0.3s ease;
}
.btn-primary:hover {
    background: #4f46e5;
    transform: translateY(-2px);
    box-shadow: 0 4px 12px rgba(99,102,241,0.3);
}
\`\`\`
Silakan klik tombol **Preview** pada blok HTML di atas untuk melihat hasilnya secara langsung di jendela baru.`;
    }

    function getGeneralMock() {
        return `Tentu, berikut adalah solusi untuk kebutuhan Anda yang telah disesuaikan dengan praktik terbaik (*best practices*).

### 1. Ringkasan Pendekatan
Kita akan menggunakan **Vanilla JavaScript** dengan *Event Delegation* untuk memastikan performa tetap tinggi dan memori terkelola dengan baik.

### 2. Langkah Implementasi
- Tangkap referensi elemen root induk.
- Tambahkan *event listener* tunggal.
- Lakukan validasi target (*event.target*).

### 3. Implementasi Kode
Berikut kode HTML/JS lengkap yang bisa Anda **Preview** langsung:

\`\`\`html
<!DOCTYPE html>
<html>
<head>
    <style>
        body { font-family: sans-serif; background: #0f172a; color: white; padding: 2rem; }
        .grid { display: grid; grid-template-columns: repeat(3, 1fr); gap: 10px; }
        .card { background: #1e293b; padding: 20px; text-align: center; border-radius: 8px; cursor: pointer; border: 1px solid #334155; }
        .card:hover { border-color: #6366f1; }
    </style>
</head>
<body>
    <h3>Event Delegation Demo</h3>
    <div class="grid" id="container">
        <div class="card" data-id="1">Item 1</div>
        <div class="card" data-id="2">Item 2</div>
        <div class="card" data-id="3">Item 3</div>
    </div>
    
    <script>
        document.getElementById('container').addEventListener('click', (e) => {
            const card = e.target.closest('.card');
            if(card) {
                alert('Anda mengklik Item ID: ' + card.dataset.id);
            }
        });
    </script>
</body>
</html>
\`\`\`

### 4. Hasil & Tindak Lanjut
Klik tombol **Preview** pada blok kode di atas untuk melihat hasilnya. Pendekatan ini menghemat memori karena hanya 1 event listener yang dibuat untuk 3 item (atau 100 item sekalipun).`;
    }

    function getReactMock() {
        return `### 1. Ringkasan Arsitektur
Saya telah membuat *boilerplate* untuk **React (Vite)** dipadukan dengan **TailwindCSS**. Struktur ini dioptimalkan untuk performa dan skalabilitas tinggi.

### 2. Struktur Folder
\`\`\`text
src/
 ├── components/
 │    └── ui/ (komponen atomic)
 ├── hooks/
 ├── pages/
 ├── store/ (state management)
 └── utils/
\`\`\`

### 3. Kode Utama (App.jsx)
Berikut adalah struktur dasar halaman modern dengan efek *Glassmorphism*:

\`\`\`jsx
import React from 'react';

export default function App() {
  return (
    <div className="min-h-screen bg-slate-900 text-slate-100 flex items-center justify-center p-4">
      <div className="bg-slate-800/50 backdrop-blur-xl border border-slate-700/50 p-8 rounded-2xl shadow-2xl max-w-md w-full">
        <h1 className="text-3xl font-bold bg-gradient-to-r from-indigo-400 to-cyan-400 bg-clip-text text-transparent mb-4">
          NexAI Dashboard
        </h1>
        <p className="text-slate-400 mb-6">
          Sistem Anda telah berhasil diinisialisasi dengan konfigurasi Enterprise.
        </p>
        <button className="w-full bg-indigo-500 hover:bg-indigo-600 transition-colors py-3 rounded-lg font-medium">
          Mulai Explorasi
        </button>
      </div>
    </div>
  );
}
\`\`\`

Silakan klik **Copy** dan tempel di project Anda. Jika Anda ingin mengunduh keseluruhan project ini dalam bentuk \`.zip\`, gunakan tombol **Download** di pojok kanan atas Header.`;
    }

    function getPythonMock() {
        return `### 1. Analisis Kebutuhan
Script ini dirancang menggunakan \`BeautifulSoup4\` dan \`requests\` untuk *web scraping* dengan penanganan *error* dan *Rate Limiting* (penundaan waktu) agar IP tidak terblokir.

### 2. Persiapan (Dependencies)
Jalankan perintah ini di terminal Anda:
\`\`\`bash
pip install requests beautifulsoup4
\`\`\`

### 3. Implementasi Script
\`\`\`python
import requests
from bs4 import BeautifulSoup
import time
import json

def scrape_tech_news(url):
    headers = {
        'User-Agent': 'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36'
    }
    
    print(f"[*] Menghubungi {url}...")
    try:
        response = requests.get(url, headers=headers, timeout=10)
        response.raise_for_status()
        
        soup = BeautifulSoup(response.text, 'html.parser')
        articles = soup.find_all('article')
        
        results = []
        for index, article in enumerate(articles[:5]): # Ambil 5 artikel
            title = article.find('h2').text.strip() if article.find('h2') else 'No Title'
            link = article.find('a')['href'] if article.find('a') else '#'
            
            results.append({
                'id': index + 1,
                'title': title,
                'url': link
            })
            
        return json.dumps(results, indent=4)
        
    except requests.exceptions.RequestException as e:
        return f"[!] Error scraping data: {e}"

# Eksekusi
if __name__ == "__main__":
    target_url = "https://example.com/news"
    data = scrape_tech_news(target_url)
    print(data)
    time.sleep(2) # Praktik etis scraping
\`\`\`

### 4. Penjelasan Tambahan
- **Headers**: Digunakan untuk menghindari blokir dasar dari server.
- **Timeout**: Menghindari *hanging* jika server lambat.
- **JSON**: Output di-format sebagai JSON agar mudah diproses oleh sistem lain (seperti *backend* API).`;
    }

    // --- Particle JS Config ---
    function initParticlesConfig(color) {
        if (window.pJSDom && window.pJSDom.length > 0) {
            window.pJSDom[0].pJS.fn.vendors.destroypJS();
            window.pJSDom = [];
        }
        particlesJS('particles-js', {
            "particles": {
                "number": { "value": 40, "density": { "enable": true, "value_area": 800 } },
                "color": { "value": color },
                "shape": { "type": "circle" },
                "opacity": { "value": 0.5, "random": true, "anim": { "enable": true, "speed": 1, "opacity_min": 0.1 } },
                "size": { "value": 3, "random": true },
                "line_linked": { "enable": true, "distance": 150, "color": color, "opacity": 0.2, "width": 1 },
                "move": { "enable": true, "speed": 1, "direction": "none", "random": true, "out_mode": "out" }
            },
            "interactivity": {
                "detect_on": "canvas",
                "events": { "onhover": { "enable": true, "mode": "grab" }, "onclick": { "enable": true, "mode": "push" }, "resize": true },
                "modes": { "grab": { "distance": 140, "line_linked": { "opacity": 0.6 } }, "push": { "particles_nb": 2 } }
            },
            "retina_detect": true
        });
    }

    function updateParticlesColor(color) { initParticlesConfig(color); }
});
