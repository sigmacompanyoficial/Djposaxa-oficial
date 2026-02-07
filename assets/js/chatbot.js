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
        #posaxa-chat-widget {
            position: fixed;
            bottom: 20px;
            right: 20px;
            z-index: 99999;
            font-family: 'Inter', sans-serif;
        }

        #posaxa-chat-btn {
            width: 60px;
            height: 60px;
            border-radius: 50%;
            background: linear-gradient(135deg, #667eea 0%, #764ba2 100%);
            border: none;
            box-shadow: 0 4px 15px rgba(0,0,0,0.3);
            cursor: pointer;
            display: flex;
            align-items: center;
            justify-content: center;
            transition: transform 0.3s ease;
        }

        #posaxa-chat-btn:hover {
            transform: scale(1.1);
        }

        #posaxa-chat-btn img {
            width: 35px;
            height: 35px;
            filter: invert(1);
        }

        #posaxa-chat-window {
            position: absolute;
            bottom: 80px;
            right: 0;
            width: 350px;
            height: 450px;
            background: #1a1a1a;
            border: 1px solid rgba(255,255,255,0.1);
            border-radius: 15px;
            box-shadow: 0 10px 30px rgba(0,0,0,0.5);
            display: flex;
            flex-direction: column;
            overflow: hidden;
            opacity: 0;
            pointer-events: none;
            transform: translateY(20px);
            transition: all 0.3s ease;
        }

        #posaxa-chat-window.active {
            opacity: 1;
            pointer-events: auto;
            transform: translateY(0);
        }

        .chat-header {
            background: linear-gradient(135deg, #667eea 0%, #764ba2 100%);
            padding: 15px;
            color: white;
            display: flex;
            justify-content: space-between;
            align-items: center;
        }

        .chat-header h3 {
            margin: 0;
            font-size: 1rem;
            font-weight: 600;
        }

        .chat-close {
            background: none;
            border: none;
            color: white;
            font-size: 1.2rem;
            cursor: pointer;
        }

        .chat-messages {
            flex: 1;
            padding: 15px;
            overflow-y: auto;
            display: flex;
            flex-direction: column;
            gap: 10px;
        }

        .message {
            max-width: 80%;
            padding: 10px 15px;
            border-radius: 15px;
            font-size: 0.9rem;
            line-height: 1.4;
        }

        .message.bot {
            background: rgba(255,255,255,0.1);
            color: #fff;
            align-self: flex-start;
            border-bottom-left-radius: 2px;
        }

        .message.user {
            background: #667eea;
            color: white;
            align-self: flex-end;
            border-bottom-right-radius: 2px;
        }

        .message strong {
            font-weight: 700;
        }

        .message.bot a {
            color: #a3bffa;
            text-decoration: underline;
        }
        .message.bot table {
            width: 100%;
            border-collapse: collapse;
            margin: 10px 0;
            font-size: 0.85rem;
            background: rgba(0,0,0,0.2);
            border-radius: 8px;
            overflow: hidden;
        }
        .message.bot th, .message.bot td {
            border: 1px solid rgba(255,255,255,0.2);
            padding: 8px 12px;
            text-align: left;
        }
        .message.bot th {
            background: rgba(255,255,255,0.1);
            font-weight: 600;
        }
        .message.bot blockquote {
            border-left: 3px solid #667eea;
            padding-left: 15px;
            margin: 10px 0 10px 5px;
            font-style: italic;
            color: #ccc;
        }
        .message.bot h3 {
            font-size: 1rem;
            font-weight: 700;
            margin-top: 15px;
            margin-bottom: 8px;
            padding-bottom: 5px;
            border-bottom: 1px solid rgba(255,255,255,0.1);
        }
        .message.bot hr {
            border: none;
            border-top: 1px solid rgba(255,255,255,0.2);
            margin: 15px 0;
        }
        .message.bot ul, .message.bot ol {
            padding-left: 20px;
        }
        .message.bot li {
            margin-bottom: 4px;
        }

        .chat-input-area {
            padding: 15px;
            border-top: 1px solid rgba(255,255,255,0.1);
            display: flex;
            gap: 10px;
            background: #111;
        }

        #chat-input {
            flex: 1;
            background: rgba(255,255,255,0.05);
            border: 1px solid rgba(255,255,255,0.1);
            border-radius: 20px;
            padding: 8px 15px;
            color: white;
            outline: none;
        }

        #chat-send {
            background: #667eea;
            border: none;
            border-radius: 50%;
            width: 35px;
            height: 35px;
            color: white;
            cursor: pointer;
            display: flex;
            align-items: center;
            justify-content: center;
        }

        .typing-indicator {
            font-size: 1.5rem;
            color: #888;
            margin-left: 15px;
            margin-bottom: 5px;
            display: none;
            line-height: 1;
        }
        .typing-indicator span {
            animation: blink 1.4s infinite both;
            margin: 0 2px;
        }
        .typing-indicator span:nth-child(2) { animation-delay: 0.2s; }
        .typing-indicator span:nth-child(3) { animation-delay: 0.4s; }
        @keyframes blink { 0% { opacity: 0.2; } 20% { opacity: 1; } 100% { opacity: 0.2; } }
    `;
    document.head.appendChild(style);

    // Create Widget DOM
    const widget = document.createElement('div');
    widget.id = 'posaxa-chat-widget';
    widget.innerHTML = `
        <div id="posaxa-chat-window">
            <div class="chat-header">
                <h3>🤖 Sigma AI</h3>
                <button class="chat-close">&times;</button>
            </div>
            <div class="chat-messages" id="chat-messages">
                <div class="message bot">
                    Hola! Sóc Sigma, la IA de DJ Posaxa. Pregunta'm el que vulguis sobre el Pol! 🎵
                </div>
            </div>
            <div class="typing-indicator" id="typing-indicator"><span>.</span><span>.</span><span>.</span></div>
            <div class="chat-input-area">
                <input type="text" id="chat-input" placeholder="Escriu un missatge..." autocomplete="off">
                <button id="chat-send"><i class="bi bi-send-fill"></i></button>
            </div>
        </div>
        <button id="posaxa-chat-btn">
            <i class="bi bi-chat-dots-fill" style="color: white; font-size: 1.5rem;"></i>
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
- PROPER ESDEVENIMENT: CARNAVAL 2026 – 13 de Febrer de 2026 a la NAUB1 (Granollers). Organitzat per Libèlia. Entrada gratuïta.

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
   - Exemple correcte: "La veritat és que el meu processador està ocupat pensant en el Carnaval 2026 a la NAUB1! Hi vindràs? 🎭"
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

        try {
            const response = await fetch("https://openrouter.ai/api/v1/chat/completions", {
                method: "POST",
                headers: {
                    "Authorization": `Bearer ${API_KEY}`,
                    "Content-Type": "application/json",
                    "HTTP-Referer": referer,
                    "X-Title": "DJ Posaxa Chatbot"
                },
                body: JSON.stringify({
                    "model": MODEL,
                    "messages": messageHistory,
                    "stream": true
                })
            });

            if (!response.ok) {
                const errText = await response.text();
                console.error("API Error:", response.status, errText);
                if (response.status === 401) {
                    addMessage("Error de configuració: La clau API no és vàlida. Revisa el fitxer chatbot.js.", 'bot');
                    throw new Error("Invalid API Key");
                }
                throw new Error(`API Error: ${response.status}`);
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
                            botMessageDiv.innerHTML = window.marked ? marked.parse(botReply) : botReply; // Update UI with parsed markdown
                            messagesContainer.scrollTop = messagesContainer.scrollHeight;
                        } catch (e) {
                            console.error("Error parsing stream", e);
                        }
                    }
                }
            }

            messageHistory.push({ role: "assistant", content: botReply });

        } catch (error) {
            console.error("Fetch Error:", error);
            typingIndicator.style.display = 'none';
            addMessage("Error de connexió. Revisa la consola per més detalls.", 'bot');
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
