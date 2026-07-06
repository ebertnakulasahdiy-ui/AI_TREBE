document.addEventListener('DOMContentLoaded', () => {
    const chatInput = document.getElementById('chatInput');
    const sendBtn = document.getElementById('sendBtn');
    const chatArea = document.getElementById('chatArea');
    const emptyState = document.getElementById('emptyState');

    if(!chatInput || !sendBtn) return;

    chatInput.addEventListener('input', function() {
        this.style.height = 'auto';
        this.style.height = (this.scrollHeight) + 'px';
        
        if (this.value.trim() !== '') {
            sendBtn.removeAttribute('disabled');
        } else {
            sendBtn.setAttribute('disabled', 'true');
        }
    });

    chatInput.addEventListener('keydown', (e) => {
        if(e.key === 'Enter' && !e.shiftKey) {
            e.preventDefault();
            sendMessage();
        }
    });

    sendBtn.addEventListener('click', sendMessage);

    function sendMessage() {
        const text = chatInput.value.trim();
        if(!text) return;

        if (emptyState) emptyState.style.display = 'none';

        const userHtml = `
            <div class="message user">
                <div class="message-content-wrapper">
                    <div class="message-content">
                        <p>${text.replace(/\n/g, '<br>')}</p>
                    </div>
                </div>
            </div>
        `;
        chatArea.insertAdjacentHTML('beforeend', userHtml);
        
        chatInput.value = '';
        chatInput.style.height = 'auto';
        sendBtn.setAttribute('disabled', 'true');
        chatArea.scrollTop = chatArea.scrollHeight;

        setTimeout(() => {
            const aiId = 'msg-' + Date.now();
            const aiHtml = `
                <div class="message ai">
                    <div class="avatar ai"><i class="fa-solid fa-layer-group"></i></div>
                    <div class="message-content-wrapper">
                        <div class="message-content markdown-body" id="${aiId}">
                            <span style="color:var(--text-muted); font-style:italic;"><i class="fa-solid fa-circle-notch fa-spin"></i> Memproses...</span>
                        </div>
                        <div class="message-actions" id="actions-${aiId}" style="display:none;">
                            <button class="tool-btn" title="Copy"><i class="fa-regular fa-copy"></i></button>
                            <button class="tool-btn" title="Regenerate"><i class="fa-solid fa-rotate-right"></i></button>
                            <button class="tool-btn" title="Good Response"><i class="fa-regular fa-thumbs-up"></i></button>
                            <button class="tool-btn" title="Bad Response"><i class="fa-regular fa-thumbs-down"></i></button>
                        </div>
                    </div>
                </div>
            `;
            chatArea.insertAdjacentHTML('beforeend', aiHtml);
            chatArea.scrollTop = chatArea.scrollHeight;

            setTimeout(() => {
                const el = document.getElementById(aiId);
                const mdText = `Antarmuka kini sudah disederhanakan secara maksimal dan terfokus.\n\nTidak ada lagi tombol tambah (+) Project, riwayat penuh di sidebar (hanya placeholder teks), maupun daftar *prompt shortcuts*. \n\n\`\`\`bash\necho "Clean and Mobile-responsive!"\n\`\`\`\n\nCoba buka dari perangkat mobile Anda. Anda akan melihat Sidebar menjadi *Drawer* tertutup *default*, dipanggil via hamburger, dan area chat 100% responsif.`;
                el.innerHTML = marked.parse(mdText);
                document.getElementById(`actions-${aiId}`).style.display = 'flex';
                chatArea.scrollTop = chatArea.scrollHeight;
            }, 800);
        }, 300);
    }
});
