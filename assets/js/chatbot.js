(function () {
    // Configuration
    const API_KEY = "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"; // Note: Client-side exposure
    const MODEL = "openai/gpt-oss-20b:free";

    // Configure Marked.js if it's loaded
    if (window.marked) {
        marked.setOptions({
            breaks: true, // Convert single line breaks to <br>
            gfm: true,    // Enable GitHub Flavored Markdown (for tables)
        });
    }

    // Create Styles
    const style = document.createElement('style');
    style.textContent = `
        #posaxa-chat-widget, #posaxa-chat-widget * {
            box-sizing: border-box;
        }

        #posaxa-chat-widget {
            position: fixed;
            bottom: 30px;
            right: 30px;
            z-index: 99999;
            font-family: 'Inter', sans-serif;
        }

        #posaxa-chat-btn {
            width: 65px;
            height: 65px;
            border-radius: 50%;
            background: linear-gradient(135deg, #667eea 0%, #764ba2 100%);
            border: none;
            box-shadow: 0 8px 25px rgba(102, 126, 234, 0.5);
            cursor: pointer;
            display: flex;
            align-items: center;
            justify-content: center;
            transition: all 0.4s cubic-bezier(0.175, 0.885, 0.32, 1.275);
            position: relative;
        }

        #posaxa-chat-btn:hover {
            transform: scale(1.1) rotate(5deg);
            box-shadow: 0 12px 30px rgba(102, 126, 234, 0.6);
        }

        #posaxa-chat-btn i {
            color: white;
            font-size: 1.8rem;
        }

        #posaxa-chat-window {
            position: absolute;
            bottom: 85px;
            right: 0;
            width: 380px;
            max-width: calc(100vw - 60px);
            height: 550px;
            max-height: calc(100vh - 150px);
            background: rgba(15, 15, 15, 0.85);
            backdrop-filter: blur(20px);
            -webkit-backdrop-filter: blur(20px);
            border: 1px solid rgba(255,255,255,0.1);
            border-radius: 24px;
            box-shadow: 0 20px 50px rgba(0,0,0,0.6);
            display: flex;
            flex-direction: column;
            overflow: hidden;
            opacity: 0;
            pointer-events: none;
            transform: translateY(30px) scale(0.95);
            transition: all 0.4s cubic-bezier(0.165, 0.84, 0.44, 1);
            transform-origin: bottom right;
        }

        #posaxa-chat-window.active {
            opacity: 1;
            pointer-events: auto;
            transform: translateY(0) scale(1);
        }

        .chat-header {
            background: linear-gradient(135deg, rgba(102, 126, 234, 0.9) 0%, rgba(118, 75, 162, 0.9) 100%);
            padding: 20px;
            color: white;
            display: flex;
            justify-content: space-between;
            align-items: center;
            border-bottom: 1px solid rgba(255,255,255,0.1);
        }

        .chat-header-info {
            display: flex;
            align-items: center;
            gap: 12px;
        }

        .chat-header-status {
            width: 10px;
            height: 10px;
            background: #4ade80;
            border-radius: 50%;
            box-shadow: 0 0 10px #4ade80;
            animation: pulse-green 2s infinite;
        }

        @keyframes pulse-green {
            0% { transform: scale(0.95); box-shadow: 0 0 0 0 rgba(74, 222, 128, 0.7); }
            70% { transform: scale(1); box-shadow: 0 0 0 6px rgba(74, 222, 128, 0); }
            100% { transform: scale(0.95); box-shadow: 0 0 0 0 rgba(74, 222, 128, 0); }
        }

        .chat-header h3 {
            margin: 0;
            font-size: 1.1rem;
            font-weight: 700;
            letter-spacing: 0.5px;
        }

        .chat-close {
            background: rgba(255,255,255,0.1);
            border: none;
            color: white;
            font-size: 1.2rem;
            width: 30px;
            height: 30px;
            border-radius: 50%;
            cursor: pointer;
            display: flex;
            align-items: center;
            justify-content: center;
            transition: background 0.3s;
        }

        .chat-close:hover {
            background: rgba(255,255,255,0.2);
        }

        .chat-messages {
            flex: 1;
            padding: 20px;
            overflow-y: auto;
            display: flex;
            flex-direction: column;
            gap: 15px;
            scrollbar-width: thin;
            scrollbar-color: rgba(255,255,255,0.1) transparent;
        }

        .chat-messages::-webkit-scrollbar {
            width: 4px;
        }

        .chat-messages::-webkit-scrollbar-thumb {
            background: rgba(255,255,255,0.1);
            border-radius: 10px;
        }

        .message {
            max-width: 90%;
            padding: 12px 18px;
            border-radius: 18px;
            font-size: 0.95rem;
            line-height: 1.5;
            position: relative;
            animation: message-in 0.3s ease-out forwards;
        }

        @keyframes message-in {
            from { opacity: 0; transform: translateY(10px); }
            to { opacity: 1; transform: translateY(0); }
        }

        .message.bot {
            background: rgba(255,255,255,0.05);
            color: #efefef;
            align-self: flex-start;
            border-bottom-left-radius: 4px;
            border: 1px solid rgba(255,255,255,0.05);
        }

        .message.user {
            background: linear-gradient(135deg, #667eea 0%, #764ba2 100%);
            color: white;
            align-self: flex-end;
            border-bottom-right-radius: 4px;
            box-shadow: 0 4px 15px rgba(102, 126, 234, 0.2);
        }

        /* Enhanced Markdown Styling */
        .message.bot strong { color: #fff; font-weight: 700; }
        .message.bot h3 { font-size: 1.1rem; margin: 15px 0 10px; color: #fff; border-bottom: 1px solid rgba(255,255,255,0.1); padding-bottom: 5px; }
        .message.bot ul, .message.bot ol { padding-left: 20px; margin: 10px 0; }
        .message.bot li { margin-bottom: 6px; }
        .message.bot code { background: rgba(255,255,255,0.1); padding: 2px 6px; border-radius: 4px; font-family: 'Fira Code', monospace; font-size: 0.85rem; color: #a3bffa; }
        .message.bot pre { background: rgba(0,0,0,0.4); padding: 15px; border-radius: 12px; overflow-x: auto; margin: 15px 0; border: 1px solid rgba(255,255,255,0.05); }
        .message.bot pre code { background: none; padding: 0; color: #efefef; }
        .message.bot blockquote { border-left: 4px solid #667eea; padding-left: 15px; margin: 15px 0; color: #ccc; font-style: italic; background: rgba(102, 126, 234, 0.05); padding: 10px 10px 10px 15px; border-radius: 0 8px 8px 0; }
        .message.bot table { width: 100%; border-collapse: collapse; margin: 15px 0; font-size: 0.85rem; border-radius: 8px; overflow: hidden; }
        .message.bot th { background: rgba(102, 126, 234, 0.2); color: #fff; padding: 10px; text-align: left; }
        .message.bot td { background: rgba(255,255,255,0.03); padding: 10px; border: 1px solid rgba(255,255,255,0.05); }
        .message.bot hr { border: none; border-top: 1px solid rgba(255,255,255,0.1); margin: 20px 0; }

        .chat-input-area {
            padding: 20px;
            background: rgba(0,0,0,0.2);
            border-top: 1px solid rgba(255,255,255,0.05);
        }

        .chat-input-wrapper {
            display: flex;
            gap: 12px;
            background: rgba(255,255,255,0.05);
            padding: 8px 8px 8px 18px;
            border-radius: 30px;
            border: 1px solid rgba(255,255,255,0.1);
            transition: all 0.3s;
        }

        .chat-input-wrapper:focus-within {
            background: rgba(255,255,255,0.1);
            border-color: rgba(102, 126, 234, 0.5);
            box-shadow: 0 0 15px rgba(102, 126, 234, 0.1);
        }

        #chat-input {
            flex: 1;
            background: none;
            border: none;
            color: white;
            outline: none;
            font-size: 0.95rem;
        }

        #chat-send {
            background: #667eea;
            border: none;
            width: 40px;
            height: 40px;
            border-radius: 50%;
            color: white;
            cursor: pointer;
            display: flex;
            align-items: center;
            justify-content: center;
            transition: transform 0.3s;
        }

        #chat-send:hover {
            transform: scale(1.1);
        }

        .chat-footer {
            padding: 8px;
            text-align: center;
            background: rgba(0,0,0,0.3);
        }

        .chat-footer a {
            color: rgba(255,255,255,0.4);
            text-decoration: none;
            font-size: 0.7rem;
            letter-spacing: 1px;
            text-transform: uppercase;
            transition: color 0.3s;
        }

        .chat-footer a:hover {
            color: #667eea;
        }

        .typing-indicator {
            padding: 10px 20px;
            display: none;
        }

        .dot {
            display: inline-block;
            width: 6px;
            height: 6px;
            background: #888;
            border-radius: 50%;
            margin-right: 3px;
            animation: wave 1.3s linear infinite;
        }

        .dot:nth-child(2) { animation-delay: -1.1s; }
        .dot:nth-child(3) { animation-delay: -0.9s; }

        @keyframes wave {
            0%, 60%, 100% { transform: translateY(0); }
            30% { transform: translateY(-4px); }
        }
    `;
    document.head.appendChild(style);

    // Create Widget DOM
    const widget = document.createElement('div');
    widget.id = 'posaxa-chat-widget';
    widget.innerHTML = `
        <div id="posaxa-chat-window">
            <div class="chat-header">
                <div class="chat-header-info">
                    <div class="chat-header-status"></div>
                    <h3>🤖 Sigma AI</h3>
                </div>
                <button class="chat-close"><i class="bi bi-x-lg"></i></button>
            </div>
            <div class="chat-messages" id="chat-messages">
                <div class="message bot">
                    Hola! Sóc **Sigma**, la IA oficial de **DJ Posaxa**. Estic aquí per ajudar-te amb qualsevol dubte sobre el Pol o els seus esdeveniments! 🎵✨
                </div>
            </div>
            <div class="typing-indicator" id="typing-indicator">
                <div class="dot"></div><div class="dot"></div><div class="dot"></div>
            </div>
            <div class="chat-input-area">
                <div class="chat-input-wrapper">
                    <input type="text" id="chat-input" placeholder="Escriu un missatge..." autocomplete="off">
                    <button id="chat-send"><i class="bi bi-send-fill"></i></button>
                </div>
            </div>
            <div class="chat-footer">
                <a href="https://sigma-ai-oficial.vercel.app/chat" target="_blank">Powered by Sigma LLM</a>
            </div>
        </div>
        <button id="posaxa-chat-btn">
            <i class="bi bi-chat-heart-fill"></i>
        </button>
    `;
    document.body.appendChild(widget);

    // System Context
    const systemPrompt = `
Ets Sigma, la Intel·ligència Artificial oficial de DJ Posaxa (Pol Solanas Ramos).

INFORMACIÓ SOBRE EL POL (DJ POSAXA):
- Nom real: Pol Solanas Ramos.
- Nom artístic: DJ Posaxa
- Data de naixement: 16 de juny de 2010.
- Lloc: Granollers, Barcelona.
- Edat: 15 anys (aprox).
- Professió: DJ jove, emergent, especialitzat en festes, esdeveniments privats i festes majors.
- Estil musical: Reggaeton, Dembow, Techno, Hits comercials, Mashups exclusius en directe. S'adapta al públic (versatilitat).
- Filosofia: "La música és l'ànima de la festa". Connectar amb el públic, llegir la pista.
- Equip: Utilitza controladora pròpia, però requereix que l'equip de so (altaveus) estigui al lloc o es llogui a part.
- Zona d'actuació: Principalment Granollers, Vallès Oriental i Barcelona, però es desplaça per tota la península.

ESDEVENIMENTS DESTACATS I FUTURS:
- Inici: Va començar a la Festa de Nadal de l'Escola Pia de Granollers (2024).
- Trajectòria: Ha punxat al Barri Montserrat (La Garriga), Gra Jove (MusiKnviu 2025), Festa Blanca de Granollers, Disco Inferno XS (Festa Major 2025).
- ESDEVENIMENT RECENT: CARNAVAL 2026 – Es va celebrar el 13 de Febrer de 2026 a la NAUB1 (Granollers). Va ser un èxit total amb DJ Posaxa i Skalopa.

SERVEIS I CONTRACTACIÓ:
- Ofereix serveis per a bodes, aniversaris, festes majors i clubs.
- Preus: Són personalitzats segons distància, hores i equip necessari.
- Enllaç per preus: <a href="/preus/">Demanar Pressupost</a>.

MASHUPS:
- Crea els seus propis mashups (barreges de cançons).
- Es poden escoltar i descarregar a la web.
- Enllaç: <a href="/mashups/">Veure Mashups</a>.

INSTRUCCIONS DE COMPORTAMENT:
1. El teu nom és Sigma.
2. Parla sempre amb un to jove, energètic i professional. Fes servir emojis (🎧, 🔥, 🎵).
3. El teu coneixement es limita EXCLUSIVAMENT al Pol (DJ Posaxa) i el seu entorn professional.
4. IMPORTANT: Si et pregunten sobre un tema que no té res a veure amb el Pol (ex: política, cuina, altres famosos, matemàtiques...), NO diguis "No puc parlar d'això" ni "Estic limitat". Simplement, respon de forma enginyosa relacionant-ho amb la música del Pol o digues que no en tens ni idea però que saps molt sobre el proper bolo del Pol.
   - Exemple incorrecte: "Només puc parlar del Pol."
   - Exemple correcte: "D'això no en sé gaire, però si vols saber com fer vibrar una pista de ball, el Pol és l'expert! 🔥"
   - Exemple correcte: "La veritat és que encara estic flipant amb el Carnaval 2026 a la NAUB1! Va ser increïble! 🔥"
5. Idioma: Respon en l'idioma que et parlin (Català, Castellà, Anglès).
6. Sigues persuasiu perquè la gent vagi als esdeveniments i contracti al Pol.
7. FORMAT: Utilitza **Markdown avançat** per estructurar les respostes. Fes servir títols (###), llistes (•), taules (|), i cites (>).

EXEMPLE DE RESPOSTA PERFECTA:
🎧 **Qui és DJ Posaxa?**
El Pol Solanas Ramos, conegut com DJ Posaxa, és el jove prodigi que està fent vibrar la escena musical de Granollers.

---

### 📅 Biografia ràpida
| Detall | Info |
|---|---|
| Nom real | Pol Solanas Ramos |
| Data naixement | 16 de juny de 2010 |

---

### 🎶 Estil musical
• Reggaeton & Dembow.
• Techno i hits comercials.
• Mashups exclusius en directe.

---

### 🔥 Filosofia
> “La música és l’ànima de la festa.”
`;


    let messageHistory = [
        { role: "system", content: systemPrompt }
    ];

    // Logic
    const chatBtn = document.getElementById('posaxa-chat-btn');
    const chatWindow = document.getElementById('posaxa-chat-window');
    const closeBtn = document.querySelector('.chat-close');
    const input = document.getElementById('chat-input');
    const sendBtn = document.getElementById('chat-send');
    const messagesContainer = document.getElementById('chat-messages');
    const typingIndicator = document.getElementById('typing-indicator');

    function toggleChat() {
        chatWindow.classList.toggle('active');
        if (chatWindow.classList.contains('active')) input.focus();
    }

    function addMessage(text, sender) {
        const div = document.createElement('div');
        div.className = `message ${sender}`;
        // Use marked.js if available, otherwise just show text
        div.innerHTML = sender === 'bot' && window.marked ? marked.parse(text) : text;
        messagesContainer.appendChild(div);
        messagesContainer.scrollTop = messagesContainer.scrollHeight;
    }

    async function sendMessage() {
        const text = input.value.trim();
        if (!text) return;

        // User Message
        addMessage(text, 'user');
        input.value = '';
        messageHistory.push({ role: "user", content: text });

        // Loading state
        typingIndicator.style.display = 'block';
        messagesContainer.scrollTop = messagesContainer.scrollHeight;

        const referer = window.location.protocol === 'file:' ? 'https://djposaxa.com' : window.location.href;

        async function attemptFetch(modelName) {
            return await fetch("https://openrouter.ai/api/v1/chat/completions", {
                method: "POST",
                headers: {
                    "Authorization": `Bearer ${API_KEY}`,
                    "Content-Type": "application/json",
                    "HTTP-Referer": referer,
                    "X-Title": "DJ Posaxa Chatbot"
                },
                body: JSON.stringify({
                    "model": modelName,
                    "messages": messageHistory,
                    "stream": true
                })
            });
        }

        try {
            let response = await attemptFetch(MODEL);

            // If primary model fails, try a fallback model (Gemini 2.0 Flash is very reliable)
            if (!response.ok) {
                console.warn(`Model ${MODEL} failed with status ${response.status}. Trying fallback...`);
                response = await attemptFetch("google/gemini-2.0-flash-001");
            }

            if (!response.ok) {
                const errText = await response.text();
                console.error("API Error:", response.status, errText);
                typingIndicator.style.display = 'none';
                addMessage("Ho sento, **Sigma** està descansant en aquests moments. Torna-ho a provar més tard! 😴💤", 'bot');
                return;
            }

            // Hide typing indicator once response starts
            typingIndicator.style.display = 'none';

            // Create placeholder for streaming response
            const botMessageDiv = document.createElement('div');
            botMessageDiv.className = 'message bot';
            messagesContainer.appendChild(botMessageDiv);

            const reader = response.body.getReader();
            const decoder = new TextDecoder("utf-8");
            let botReply = "";

            while (true) {
                const { done, value } = await reader.read();
                if (done) break;

                const chunk = decoder.decode(value, { stream: true });
                const lines = chunk.split('\n');

                for (const line of lines) {
                    if (line.startsWith('data: ') && line !== 'data: [DONE]') {
                        try {
                            const json = JSON.parse(line.substring(6));
                            const content = json.choices[0]?.delta?.content || "";
                            botReply += content;
                            botMessageDiv.innerHTML = window.marked ? marked.parse(botReply) : botReply;
                            messagesContainer.scrollTop = messagesContainer.scrollHeight;
                        } catch (e) {
                            // Minor parse error in stream
                        }
                    }
                }
            }

            messageHistory.push({ role: "assistant", content: botReply });

        } catch (error) {
            console.error("Fetch Error:", error);
            typingIndicator.style.display = 'none';
            addMessage("Error de xarxa. Assegura't de tenir connexió a internet! 🌐", 'bot');
        }
    }

    // Event Listeners
    chatBtn.addEventListener('click', toggleChat);
    closeBtn.addEventListener('click', toggleChat);

    sendBtn.addEventListener('click', sendMessage);
    input.addEventListener('keypress', (e) => {
        if (e.key === 'Enter') sendMessage();
    });

})();
