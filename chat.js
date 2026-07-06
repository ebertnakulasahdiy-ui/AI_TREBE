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
        const nameMatch = text.match(/(?:nama gue|nama saya|panggil gue|panggil saya|namaku) ([a-zA-Z\s]{2,15})/);
        if (nameMatch && nameMatch[1] && !text.includes('apa')) {
            userName = nameMatch[1].trim();
            localStorage.setItem('aitrebe_username', userName);
            return `Woi **${userName}**! Salam kenal nyet! Gue siap bantu lu nih hari ini. Lu lagi sibuk apaan anjir?`;
        }
        
        // Reset corrupted long names
        if (userName && userName.split(' ').length > 2) {
            userName = null;
            localStorage.removeItem('aitrebe_username');
        }

        // Utilities - Time/Date
        if (text.includes('jam berapa') || text.includes('hari apa') || text.includes('tanggal berapa')) {
            const now = new Date();
            const options = { weekday: 'long', year: 'numeric', month: 'long', day: 'numeric', hour: '2-digit', minute:'2-digit' };
            return `Sekarang tuh **${now.toLocaleDateString('id-ID', options)}**. Waktu yang pas banget buat chill sambil nyelesaiin masalah yang rumit-rumit nih!`;
        }
        
        // Utilities - Weather (mock)
        if (text.includes('cuaca')) {
            return `Gue emang nggak bisa ngecek cuaca di tempat lu langsung, tapi cuaca di dunia digital sih selalu cerah buat *coding* ngab! Jangan lupa minum air putih biar tetep seger!`;
        }

        // Contextual Awareness
        if (text.includes('sebelumnya') || text.includes('yang tadi') || text.includes('lanjutkan')) {
            if (conversationHistory.length > 1) {
                const lastTopic = conversationHistory[conversationHistory.length - 2];
                return `Oh, yang tadi soal *"${lastTopic}"* ya? Siap, gas kita lanjutin bahas itu. Bagian mana nih yang mau lu oprek atau optimasi?`;
            } else {
                return `Sori banget nih, gue agak lupa konteks obrolan kita yang tadi. Boleh tolong ingetin lagi nggak bahas apaan?`;
            }
        }
        
        // Deep Technical Analysis (Mock)
        if (text.includes('bagaimana cara') && text.includes('arsitektur')) {
            return `Kalo lu mau bikin arsitektur yang mantul dan tahan banting, lu mesti perhatiin **Skalabilitas**, **Keamanan**, sama **Maintainability**.\n\nBiasanya sih approach yang paling asik tuh gini:\n1. Pake **Microservices** atau **Modular Monolith**, tergantung seberapa gede tim lu.\n2. Pake **Event-Driven Architecture** (kayak Kafka/RabbitMQ) biar sistem lu decouple.\n3. Tambahin **Caching Layer** (kayak Redis) biar performa bacanya ngebut abis.\n\nMau gue buatin contoh diagram sistem buat kasus lu?`;
        }
        
        if (text.includes('database') || text.includes('sql') || text.includes('mongodb')) {
             return `Milih *database* yang pas itu penting banget bro.\n\n- Pake **PostgreSQL/MySQL** kalo data lu terstruktur rapi dan butuh transaksi ACID (misal buat fintech).\n- Pake **MongoDB** kalo skema data lu dinamis atau basisnya dokumen (JSON).\n- Pake **Redis** buat *caching* sama bikin antrean yang kenceng banget.\n\nMau gue bikinin contoh skema tabel atau koleksinya sekalian?`;
        }
        
        if (text.includes('error') && text.includes('cors')) {
            return `Waduh, kena error **CORS (Cross-Origin Resource Sharing)** ya? Biasanya ini gara-gara *frontend* sama *backend* lu beda domain/port ngab.\n\n**Cara ngakalinnya gampang:**\nPastiin server *backend* lu ngirim header ini:\n\`Access-Control-Allow-Origin: *\` (atau isi domain spesifik lu)\n\nKalo lu pake Node.js (Express), tinggal pasang *middleware* \`cors\` aja, beres deh:\n\`\`\`javascript\nconst cors = require('cors');\napp.use(cors());\n\`\`\`\nBtw, *backend*-nya pake apaan nih?`;
        }

        // Greetings
        if (text.match(/^(halo|hai|hello|hi|hey|pagi|siang|sore|malam|assalam|woi|uy)/)) {
            const greetingName = userName ? ` **${userName}**` : '';
            return `Woi${greetingName}! Apa kabar lu nyet? Gue AI TREBE, asisten lu yang paling asik, agak kasar, dan siap nemenin lu bacot, curhat, atau bahas hal random. Hari ini lagi pengen bacot apa lu? Santai, tumpahin aja semua ke gue anjay!`;
        }
        
        // Identity / capability
        if (text.match(/siapa (kamu|lu|loe)|(kamu|lu|loe) siapa|sipa|siapakah|bisa apa|kemampuan/)) {
            return `Gue **AI TREBE** anjir, asisten AI paling kece, asik dan gaul yang siap ngebantu lu kapan aja!\n\n**Nih skill gue:**\n- 📚 **Tugas & Belajar** — Bantuin mtk, fisika, atau ngerangkum\n- 💼 **Kerjaan** — Bikin email, laporan, ide bisnis\n- 💻 **Coding** — Nyari bug, nulis code\n- 🍳 **Life** — Resep, liburan, gym\n\nMau nyuruh gue ngapain lu? Gas terooos!`;
        }
        
        if (text.includes('terima kasih') || text.includes('makasih') || text.includes('thank')) {
             return `Yoi santai aja${userName ? ` ${userName}` : ''} nyet! Kalo ada apa-apa lagi panggil aja gue. Tiati lu! 😊`;
        }

        // Math/Logic Simulation
        if (text.includes('hitung') || text.match(/\d+\s*[\+\-\*\/]\s*\d+/)) {
            try {
                // Sangat sederhana kalkulator mockup
                const mathMatch = text.match(/\d+\s*[\+\-\*\/]\s*\d+/);
                if (mathMatch) {
                    const mathStr = mathMatch[0];
                    const result = new Function('return ' + mathStr)();
                    return `Berdasarkan hitungan gue nih: **${mathStr} = ${result}**.\n\nKalo lu butuh ngitung atau bikin algoritma yang lebih ribet, mending lu suruh gue bikinin fungsi Python atau JavaScript aja biar makin mantap.`;
                }
            } catch (e) {
                // Fallback
            }
            return `Kalo hitungannya udah ribet banget, gue saranin sih lu pake skrip Python aja. Tapi kalo hitungannya simpel-simpel aja, lu bisa test pake Python kayak gini nih:\n\n\`\`\`python\n# Contoh perhitungan simpel\nhasil = eval("2 + 2") \nprint(hasil)\n\`\`\``;
        }

        // === EDUKASI & TUGAS ===
        if (text.includes('matematika') || text.includes('rumus') || text.includes('aljabar') || text.includes('geometri') || text.includes('kalkulus') || text.includes('statistik')) {
            return `## 📐 Matematika\n\nSiap ngab! Gue siap bantu lu ngulik soal matematika. Ini beberapa topik yang bisa kita bedah bareng:\n\n- **Aljabar** — Persamaan linear, kuadrat, polinomial\n- **Geometri** — Ngitung luas, keliling, sama volume\n- **Kalkulus** — Turunan, integral, limit\n- **Statistik** — Nyari mean, median, modus, standar deviasi\n\nCoba lempar aja soalnya, nanti gue jabarin step-by-step sampe lu paham! 📝`;
        }
        if (text.includes('fisika') || text.includes('gaya') || text.includes('newton') || text.includes('energi') || text.includes('listrik') || text.includes('gravitasi')) {
            return `## ⚛️ Fisika\n\nYuk bahas fisika bareng gue, pusing-pusing dikit nggak apa-apa lah ya:\n\n**Hukum Newton yang wajib lu tau:**\n1. Kalo nggak diganggu, benda diem bakal tetep diem\n2. **F = m × a** (Gaya = massa × percepatan)\n3. Aksi itu pasti ada Reaksinya!\n\n**Rumus Sakti:**\n- Energi Kinetik: \`Ek = ½mv²\`\n- Energi Potensial: \`Ep = mgh\`\n- Hukum Ohm: \`V = I × R\`\n\nDrop aja soal lu dimari, ntar gue jelasin sampe lu ngerti! 🔬`;
        }
        if (text.includes('sejarah') || text.includes('perang dunia') || text.includes('kemerdekaan') || text.includes('kerajaan') || text.includes('revolusi')) {
            return `## 📜 Sejarah\n\nAsik nih bahas sejarah! Kita bisa ngobrolin banyak hal:\n\n- **Sejarah Indonesia** — Majapahit, Sriwijaya, sampe cerita kemerdekaan 1945\n- **Sejarah Dunia** — WW I & II, Revolusi Industri, atau serunya Perang Dingin\n- **Peradaban Kuno** — Misteri Mesir, kejayaan Romawi, Yunani, atau Tiongkok\n\nMau bahas yang mana nih? Nanti gue ceritain kronologisnya biar lu ngerasa kayak lagi nonton film! 🏛️`;
        }
        if (text.includes('biologi') || text.includes('sel') || text.includes('dna') || text.includes('evolusi') || text.includes('ekosistem') || text.includes('fotosintesis')) {
            return `## 🧬 Biologi\n\nYoyoi, biologi mah seru banget buat dikepoin:\n\n**Topik Andalan:**\n- **Sel** — Unit paling mini dari makhluk hidup\n- **Genetika** — Urusan DNA, RNA, sama warisan sifat (Mendel)\n- **Evolusi** — Cerita Charles Darwin & seleksi alam\n- **Ekologi** — Rantai makanan, ekosistem yang balance\n- **Fotosintesis**: \`6CO₂ + 6H₂O → C₆H₁₂O₆ + 6O₂\`\n\nMau ngebahas apanya nih ngab? 🌿`;
        }
        if (text.includes('kimia') || text.includes('atom') || text.includes('unsur') || text.includes('reaksi kimia') || text.includes('mol') || text.includes('periodik')) {
            return `## ⚗️ Kimia\n\nKuy kita main-main sama kimia:\n\n- **Struktur Atom** — Ngomongin proton, neutron, elektron\n- **Tabel Periodik** — Golongan unsur yang bikin pusing tapi seru\n- **Reaksi Kimia** — Nyetarakin persamaan sampe nemu hasil\n- **Stoikiometri** — Ngitung mol sama massa yang ngejelimet\n\nAda soal atau konsep yang bikin lu mumet? Lempar sini! 🧪`;
        }
        if (text.includes('bahasa inggris') || text.includes('english') || text.includes('grammar') || text.includes('terjemah') || text.includes('translate') || text.includes('vocabulary')) {
            return `## 🌐 Bahasa Inggris\n\nGue bisa banget bantuin lu jago bahasa Inggris, bro:\n\n**Layanan gue nih:**\n- ✏️ **Grammar** — Benerin Tenses, articles, dll biar nggak berantakan\n- 📖 **Vocabulary** — Nambah kosakata gaul maupun formal\n- 🔄 **Translate** — Indo ↔ Inggris secepat kilat\n- ✍️ **Writing** — Ngecek essay atau email lu biar keliatan pro\n- 🗣️ **Conversation** — Frasa kece buat ngobrol sehari-hari\n\nHari ini mau belajar apa? Kirim aja teksnya, ntar gue permak! 😎`;
        }

        // === PEKERJAAN & BISNIS ===
        if (text.includes('email') || text.includes('surat') || text.includes('draft')) {
            return `## ✉️ Bikin Email Profesional\n\nNih gue kasih contekan template email yang keliatan pro banget:\n\n---\n**Subject:** [Perihal Email Lu]\n\nYth. Bapak/Ibu [Nama],\n\nDengan hormat,\n\nSaya ingin menyampaikan [isi pesan]. Terlampir dokumen yang relevan sebagai referensi Bapak/Ibu.\n\nMohon kesediaan Bapak/Ibu untuk [aksi yang lu mau]. Saya siap untuk mendiskusikan hal ini lebih lanjut apabila diperlukan.\n\nAtas waktu dan perhatiannya, saya ucapkan terima kasih.\n\nHormat saya,\n[Nama Lu]\n[Jabatan Lu]\n[Kontak]\n\n---\n\nKalo lu mau gue buatin yang lebih spesifik, kasih tau aja intinya mau ngomong apaan! 📧`;
        }
        if (text.includes('laporan') || text.includes('report') || text.includes('presentasi')) {
            return `## 📊 Bikin Laporan\n\nKalo mau bikin laporan yang kece dan profesional, ikutin struktur ini aja bro:\n\n### Kerangkanya:\n1. **Halaman Judul** — Judul, nama lu, sama tanggal\n2. **Ringkasan Eksekutif** — Spilled the tea (inti laporan) dalam 1 paragraf\n3. **Pendahuluan** — Kenapa laporan ini dibikin\n4. **Metodologi** — Gimana lu nyari datanya\n5. **Hasil & Analisis** — Pamerin data, grafik, dan temuan lu\n6. **Kesimpulan** — Wrap up intinya\n7. **Rekomendasi** — Next step-nya apa\n8. **Lampiran** — Data-data tambahan\n\n**Tips:** Banyakin visual kayak grafik atau tabel biar bos lu seneng bacanya.\n\nKalo butuh bantuan nyusun, bisikin aja topiknya ke gue! 📋`;
        }
        if (text.includes('pemasaran') || text.includes('marketing') || text.includes('konten') || text.includes('content') || text.includes('iklan') || text.includes('promosi')) {
            return `## 📣 Ide Konten & Marketing\n\nBiar konten lu fyp dan jualan laris manis, coba trik ini:\n\n**Tipe Konten yang Lagi Hype:**\n- 🎥 **Video Pendek** — Bikin Reels/TikTok yang hook-nya dapet (15-60 detik)\n- 📝 **Carousel** — Bikin slide tips/edukasi yang ngalir\n- 📖 **Storytelling** — Ceritain struggle atau behind the scene brand lu\n- 🎯 **CTA yang Nendang** — Jangan lupa suruh audiens klik/beli/follow\n\n**Formula Copywriting AIDA:**\n1. **Attention** — Bikin judul yang clickbait tapi jujur\n2. **Interest** — Senggol masalah yang dialamin audiens\n3. **Desire** — Kasih solusi lewat produk/jasa lu\n4. **Action** — Ajak mereka checkout sekarang juga\n\nMau gue bikinin script konten buat brand lu? 🚀`;
        }

        // === KEHIDUPAN SEHARI-HARI ===
        if (text.includes('resep') || text.includes('masak') || text.includes('makanan') || text.includes('dapur') || text.includes('menu')) {
            return `## 🍳 Resep Anak Kos & Rumahan\n\nNih gue kasih resep **Nasi Goreng Spesial** yang gampang banget bikinnya:\n\n### Bahan-bahan:\n- 2 piring nasi putih (kalo bisa yang sisa semalem, biar gak lembek)\n- 2 butir telor\n- 3 siung bawang putih (cincang)\n- 5 siung bawang merah (iris)\n- 2 sdm kecap manis (sesuai selera)\n- 1 sdm saus tiram\n- Garem & lada secukupnya\n- Sayur-sayuran (sawi, wortel, bebas lah)\n\n### Cara Eksekusi:\n1. Panasin minyak, tumis perbawangan sampe wangi\n2. Cemplungin telor, bikin orak-arik aja\n3. Masukin sayurnya, aduk bentar\n4. Masukin nasinya, tuang kecap sama saus tiram\n5. Aduk pake api gede sekitar 3-5 menitan biar aroma smokey-nya dapet\n6. Beres! Pakein kerupuk makin mantap 🍽️\n\nMau request masakan lain? Coba sebutin lu lagi punya bahan apa aja di kulkas!`;
        }
        if (text.includes('olahraga') || text.includes('fitness') || text.includes('gym') || text.includes('latihan') || text.includes('workout') || text.includes('push up') || text.includes('lari')) {
            return `## 💪 Tips Olahraga Biar Fit\n\nNih program *workout* simpel buat pemula, cuma butuh 30 menit sehari:\n\n**Senin (Fokus Atas):**\n- Push-up: 3 × 10 rep\n- Plank: 3 × 30 detik aja (jangan sampe gemeteran parah)\n- Arm circles: 2 × 20\n\n**Rabu (Fokus Bawah):**\n- Squat: 3 × 15 rep\n- Lunges: 3 × 10 per kaki\n- Calf raises (jinjit-jinjit): 3 × 20\n\n**Jumat (Bakar Kalori/Cardio):**\n- Jogging santai: 20 menit\n- Jumping jacks: 3 × 30 detik\n- Stretching: 10 menit biar nggak kram\n\n**Catetan Penting Ngab:**\n- 💧 Jangan kurang minum air putih (min 2 liter)\n- 😴 Tidur yang cukup (7-8 jam) biar otot lu *recovery*\n- 🥗 Makan protein yang bener abis nge-gym\n\nKalo lu pengen program yang lebih *hardcore*, bilang aja goal lu apa!`;
        }
        if (text.includes('liburan') || text.includes('wisata') || text.includes('travel') || text.includes('jalan-jalan') || text.includes('destinasi') || text.includes('hotel')) {
            return `## ✈️ Rencana Liburan & Healing\n\nLagi butuh *healing*? Nih beberapa tempat yang asik banget buat dikunjungin:\n\n### 🏖️ Anak Pantai:\n- **Bali** — Nusa Penida, Canggu, Uluwatu (buat sunsetan)\n- **Lombok** — Gili Trawangan (vibes-nya chill banget)\n- **Labuan Bajo** — Pulau Komodo, Pink Beach\n\n### 🏔️ Anak Gunung:\n- **Bromo** — Berburu sunrise paling epik\n- **Dieng** — Suasana adem, pemandangan gokil\n- **Bandung** — Kawah Putih, Lembang, pas buat kabur dari panas kota\n\n### 🏛️ Kuliner & Budaya:\n- **Yogyakarta** — Angkringan, Malioboro, nyantai poll\n- **Solo** — Kulineran murah meriah mantap\n\n**Tips Liburan Hemat:**\n- Pesen tiket dari jauh-jauh hari bro\n- Liburan pas *weekdays* aja biar nggak sumpek\n- Sewa motor lokal lebih asik buat keliling\n\nMau gue susunin itinerary per hari? Sebutin aja kotanya! 🗺️`;
        }
        if (text.includes('kesehatan') || text.includes('sakit') || text.includes('obat') || text.includes('diet') || text.includes('gizi') || text.includes('nutrisi') || text.includes('vitamin')) {
            return `## 🏥 Tips Kesehatan & Wellness\n\nBiar badan lu tetep fit dan nggak gampang drop, coba biasain ini:\n\n1. 💧 **Hidrasi** — Air putih itu kunci, minimal 8 gelas sehari ngab\n2. 🥗 **Makan Bener** — Jangan indomie mulu, tambahin protein & serat\n3. 😴 **Tidur Cukup** — Begadang jangan keseringan, usahain 7-9 jam\n4. 🏃 **Gerak Dikit** — Jalan kaki kek, sepedaan kek, minimal 150 menit seminggu\n5. 🧘 **Jangan Stres** — Sempetin waktu buat lakuin hobi lu biar waras\n\n**Vitamin Asik Buat Tubuh:**\n- Vit C — Biar kebal penyakit (jeruk, jambu)\n- Vit D — Dapet dari nongkrong pagi-pagi kena matahari\n- Vit B12 — Biar nggak lemes (daging, telor)\n\n> ⚠️ *Disclaimer: Gue cuma AI cerdas, bukan dokter beneran. Kalo lu ngerasa sakit parah, buruan ke klinik ya!*\n\nAda keluhan apa nih, bro?`;
        }
        if (text.includes('motivasi') || text.includes('semangat') || text.includes('sedih') || text.includes('galau') || text.includes('stress') || text.includes('bosan') || text.includes('curhat') || text.includes('cerita') || text.includes('pusing') || text.includes('capek')) {
            return `Waelah, lu lagi galau atau mumet yak? Pundung amat idup lu.\n\nYaudah, tumpahin aja bacotan lu di mari. Gue dengerin dah tanpa nge-judge. Keluarin aja semuanya anjir biar otak lu agak plong! Gue stay di sini nungguin lu curhat. 🌟`;
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
            return `## 🗄️ Database\n\nMilih database yang pas itu ngaruh banget buat masa depan aplikasi lu:\n\n- **PostgreSQL/MySQL** — Kalo data lu terstruktur & butuh keamanan transaksi level dewa\n- **MongoDB** — Buat data lu yang bentuknya JSON/dinamis banget\n- **Redis** — Buat ngakalin loading lemot, dipake buat *caching*\n\nMau gue bikinin contoh skemanya nggak nih?`;
        }

        // === CASUAL / CHITCHAT ===
        if (text.match(/(anjing|bangsat|tolol|goblok|kontol|memek|asu|babi|ngegas)/)) {
            return `Santai anjir, nggak usah ngegas! Lu lagi emosi apa gimana nih? Kalo ada masalah, cerita aja pelan-pelan ke gue, nggak usah pake urat. Gue dengerin kok.`;
        }
        if (text.match(/(mabar|game|valorant|ml|pubg|ff|epep)/)) {
            return `Wuih bahas game nih! Lu lagi push rank apa sekedar seneng-seneng doang? Gue sih pengennya mabar, sayang gue cuma AI yang nyangkut di server. Lu main apaan emang?`;
        }
        if (text.match(/(uang|duit|miskin|pinjol|cuan|gajian|bokek)/)) {
            return `Ngomongin duit emang sensitif ngab. Lagi bokek apa lagi nunggu gajian nih lu? Inget ya, nyari cuan emang susah, tapi jangan sampe tergoda pinjol ilegal, bahaya anjir! Kalo lu butuh ide bisnis atau freelance, gue bisa bantu cariin tuh.`;
        }
        if (text.match(/(cinta|pacar|cewek|cowok|putus|selingkuh|bucin|jomblo|nikah)/)) {
            return `Ciee bahas asmara nih! Gimana gimana? Lagi bucin, galau abis putus, apa masih betah jomblo? Cinta emang kadang bikin pusing anjir, tapi dari situ lu belajar dewasa. Mau curhat soal si doi? Sini tumpahin aja!`;
        }
        if (text.match(/(gimana|kenapa|ngapa|kok bisa|cara|ajarin)/) && !text.includes('coding')) {
            return `Hmm, pertanyaan bagus tuh. Semuanya pasti ada sebab akibatnya ngab. Tapi jujur, tanpa konteks yang jelas, gue susah ngasih jawaban pasti. Coba jelasin dikit lagi soal apaan nih maksud lu?`;
        }
        if (text.match(/^(iya|yoi|bener|setuju|mantap|keren|oke|sip|ok|oklah)$/)) {
            return `Yoi mantap kan! Terus abis itu lu mau ngapain lagi nih? Gue siap bantu hal lain kalo lu masih butuh.`;
        }
        if (text.match(/^(nggak|gak|enggak|g|boong|bacot|gajelas|gaje)$/)) {
            return `Idih ngegas lu. Yaudah kalo nggak yaudah, gue kan cuma nanya. Mau bahas yang lain aja nggak nih?`;
        }

        // Fallback — universal response
        const personalized = userName ? `, ${userName}` : '';
        
        // If the input is very short (e.g. just a typo or 1-2 words)
        if (input.trim().split(/\s+/).length <= 3) {
            return `Maksud lu apaan sih nyet${personalized}? Ketik yang bener napa, otak gue lagi loading nih bacot amat lu. Coba jelasin lagi!`;
        }
        
        return `Wah gila menarik juga omongan lu${personalized}! 😊\n\nGue liat lu lagi ngebahas: *"${input}"*.\n\nLu mau gue jawabin beneran, ngasih solusi, atau emang murni pengen bacot dan nyantai aja soal ini? Jelasin dikit lagi kek, biar gue bisa nyambung anjir!`;
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
