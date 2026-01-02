document.addEventListener('DOMContentLoaded', function() {
    const widgetHMTL = `
        <div id="ai-chat-widget">
            <!-- Tombol Buka Chat -->
            <button class="chat-toggle-btn" id="chatToggleBtn">
                <i class="fas fa-robot"></i>
            </button>
            <!-- Jendela Chat -->
            <div class="chat-box" id="chatBox">
                <div class="chat-header">
                    <i class="fas fa-robot"></i>
                    <h3>CrypBot Asisten</h3>
                </div>
                
                <div class="chat-messages" id="chatMessages">
                    <div class="message ai">Halo! Saya CrypBot. Ada yang bisa saya bantu hari ini? 😊</div>
                </div>
                <div class="chat-input-area">
                    <input type="text" id="chatInput" placeholder="Ketik pesan..." autocomplete="off">
                    <button id="sendBtn"><i class="fas fa-paper-plane"></i></button>
                </div>
            </div>
        </div>
    `;

    document.body.insertAdjacentHTML('beforeend', widgetHMTL);
    const toggleBtn = document.getElementById('chatToggleBtn'); 
    const chatBox = document.getElementById('chatBox'); 
    const chatInput = document.getElementById('chatInput'); 
    const sendBtn = document.getElementById('sendBtn'); 
    const chatMessages = document.getElementById('chatMessages'); 

    toggleBtn.addEventListener('click', () => {
        chatBox.classList.toggle('active');
        if (chatBox.classList.contains('active')) {
            chatInput.focus();
        }
    });

    // Kirim Pesan
    async function sendMessage() {
        const text = chatInput.value.trim();
        if (!text) return;

        // Tampilkan pesan User
        addMessage(text, 'user');
        chatInput.value = '';

        // Loading state
        const loadingId = addMessage('Sedang mengetik...', 'ai', true);

        try {
            // Panggil API Backend
            const response = await fetch('../api/ai/chat.php', {
                method: 'POST',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify({ message: text })
            });

            const data = await response.json();

             removeMessage(loadingId);
            addMessage(data.reply, 'ai');
        } catch (error) {
            removeMessage(loadingId);
            addMessage("Maaf, terjadi kesalahan koneksi.", 'ai');
            console.error(error);
        }
    }

    // Helper: Tambah Pesan ke UI
    function addMessage(text, sender, isLoading = false) {
        const div = document.createElement('div');
        div.className = `message ${sender}`;
        
        // Parse Markdown Link: [Label](url) -> <a href="url">Label</a>
        // Hanya proses parsing link jika bukan loading state
        if (!isLoading) {
            const formattedText = text.replace(/\[([^\]]+)\]\(([^)]+)\)/g, '<a href="$2" target="_self" style="color: inherit; text-decoration: underline; font-weight: bold;">$1</a>');
            div.innerHTML = formattedText;
        } else {
            div.innerText = text;
        }

        if (isLoading) div.id = 'loadingMsg';

        chatMessages.appendChild(div);
        chatMessages.scrollTop = chatMessages.scrollHeight;
        return div.id;
    }

    // Helper: Hapus Pesan dari UI
    function removeMessage(id) {
        const el = document.getElementById(id);
        if (el) el.remove();
    }

    // Event Listeners
    sendBtn.addEventListener('click', sendMessage);
    chatInput.addEventListener('keypress', (e) => {
        if (e.key === 'Enter') sendMessage();
    });
});