import { auth, database, ref, onValue, update, remove, onAuthStateChanged } from "./firebase-config.js";
import { initializeApp } from "https://www.gstatic.com/firebasejs/10.12.2/firebase-app.js";
import { getAuth, GoogleAuthProvider, signInWithPopup, signInWithEmailAndPassword, createUserWithEmailAndPassword, updateProfile, onAuthStateChanged, signOut } from "https://www.gstatic.com/firebasejs/10.12.2/firebase-auth.js";
import { getDatabase, ref, push, set, update, get, onValue, remove, serverTimestamp, runTransaction } from "https://www.gstatic.com/firebasejs/10.12.2/firebase-database.js";
import { getStorage, ref as storageRef, uploadBytes, getDownloadURL } from "https://www.gstatic.com/firebasejs/10.12.2/firebase-storage.js";
import { auth } from './firebase-config.js';

/* --- booking.js --- */

// Booking Form Logic
document.addEventListener('DOMContentLoaded', () => {
    // Set year
    const yearEl = document.getElementById('year');
    if (yearEl) yearEl.textContent = new Date().getFullYear();

    // Navbar scroll effect
    const navbar = document.querySelector('.navbar');
    window.addEventListener('scroll', () => {
        if (window.scrollY > 100) {
            navbar.classList.add('scrolled');
        } else {
            navbar.classList.remove('scrolled');
        }
    });

    const bookingForm = document.getElementById('booking-form');
    if (!bookingForm) return;

    // Show "Altres" text field when "Otro" is selected
    const otherRadio = document.getElementById('eventTypeOther');
    if (otherRadio) {
        otherRadio.addEventListener('change', function (e) {
            document.getElementById('eventTypeOtherText').style.display = e.target.checked ? 'block' : 'none';
        });
    }

    // Hide "Altres" text field when other options are selected
    document.querySelectorAll('input[name="eventType"]').forEach(radio => {
        if (radio.id !== 'eventTypeOther') {
            radio.addEventListener('change', function () {
                const otherText = document.getElementById('eventTypeOtherText');
                if (otherText) otherText.style.display = 'none';
            });
        }
    });

    // Form submission handler
    bookingForm.addEventListener('submit', function (e) {
        e.preventDefault();

        // Ensure Firebase is ready
        if (!window.database) {
            alert("Error: No s'ha pogut connectar amb la base de dades.");
            return;
        }

        const { database, ref, push, set } = window; // Use exposed Firebase

        const submitBtn = this.querySelector('button[type="submit"]');
        const originalText = submitBtn.innerHTML;
        submitBtn.disabled = true;
        submitBtn.innerHTML = '<span class="spinner-border spinner-border-sm" role="status" aria-hidden="true"></span> Enviant...';

        // Collect selected music styles
        const musicStyles = [];
        document.querySelectorAll('input[name="musicStyle"]:checked').forEach((checkbox) => {
            musicStyles.push(checkbox.value);
        });

        const formData = {
            contactName: document.getElementById('contactName').value,
            contactPhone: document.getElementById('contactPhone').value,
            contactEmail: document.getElementById('contactEmail').value,
            eventType: document.querySelector('input[name="eventType"]:checked')?.value,
            eventTypeOther: document.getElementById('eventTypeOtherText').value,
            eventDate: document.getElementById('eventDate').value,
            eventTime: document.getElementById('eventTime').value,
            eventLocation: document.getElementById('eventLocation').value,
            attendees: document.querySelector('input[name="attendees"]:checked')?.value,
            audience: document.querySelector('input[name="audience"]:checked')?.value,
            previousEvent: document.querySelector('input[name="previousEvent"]:checked')?.value,
            otherActs: document.querySelector('input[name="otherActs"]:checked')?.value,
            duration: document.querySelector('input[name="duration"]:checked')?.value,
            tech: document.querySelector('input[name="tech"]:checked')?.value,
            musicStyle: musicStyles.join(', '),
            discovery: document.querySelector('input[name="discovery"]:checked')?.value,
            comments: document.getElementById('comments').value,
            submittedAt: new Date().toISOString(),
            status: 'pending' // pending, contacted, booked, cancelled
        };

        // Push to Firebase
        const newBookingRef = push(ref(database, 'booking-requests'));
        set(newBookingRef, formData)
            .then(() => {
                alert('Sol·licitud enviada correctament! Et contactarem aviat.');
                document.getElementById('booking-form').reset();
                const otherText = document.getElementById('eventTypeOtherText');
                if (otherText) otherText.style.display = 'none';
            })
            .catch((error) => {
                console.error(error);
                alert('Hi ha hagut un error al enviar la sol·licitud. Si us plau, intenta-ho més tard o contacta per Instagram.');
            })
            .finally(() => {
                submitBtn.disabled = false;
                submitBtn.innerHTML = originalText;
            });
    });

    // Intersection Observer for animations
    const observerOptions = {
        threshold: 0.1,
        rootMargin: '0px 0px -100px 0px'
    };

    const observer = new IntersectionObserver((entries) => {
        entries.forEach(entry => {
            if (entry.isIntersecting) {
                entry.target.style.opacity = '1';
                entry.target.style.transform = 'translateY(0)';
            }
        });
    }, observerOptions);

    // Observe elements
    document.querySelectorAll('.feature-card').forEach(el => {
        observer.observe(el);
    });
});




/* --- chatbot.js --- */

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




/* --- cookies.js --- */

document.addEventListener("DOMContentLoaded", function () {
    const cookieKey = "djposaxa_cookies_accepted";

    // Check if user already accepted
    if (localStorage.getItem(cookieKey)) {
        return;
    }

    // Create Banner HTML
    const banner = document.createElement("div");
    banner.id = "cookie-banner";
    banner.innerHTML = `
        <div class="cookie-content">
            <div class="cookie-text">
                <h4>🍪 Cookies</h4>
                <p>Utilitzem cookies pròpies i de tercers per millorar la teva experiència i analitzar el trànsit. Si continues navegant, acceptes el seu ús.</p>
            </div>
            <div class="cookie-buttons">
                <button id="accept-cookies" class="btn-accept">Acceptar</button>
                <a href="/legal.html#cookies" class="btn-policy">Veure Política</a>
            </div>
        </div>
    `;

    // Styles
    const style = document.createElement("style");
    style.textContent = `
        #cookie-banner {
            position: fixed;
            bottom: 20px;
            left: 50%;
            transform: translateX(-50%);
            width: 90%;
            max-width: 600px;
            background: rgba(15, 15, 15, 0.95);
            backdrop-filter: blur(10px);
            border: 1px solid rgba(255, 255, 255, 0.1);
            border-radius: 15px;
            padding: 20px;
            z-index: 100000;
            box-shadow: 0 10px 30px rgba(0,0,0,0.5);
            animation: slideUp 0.5s ease-out;
        }
        .cookie-content {
            display: flex;
            flex-direction: column;
            gap: 15px;
            color: #fff;
        }
        .cookie-text h4 { margin: 0 0 5px 0; font-size: 1.1rem; }
        .cookie-text p { margin: 0; font-size: 0.9rem; color: #ccc; }
        .cookie-buttons {
            display: flex;
            gap: 10px;
            justify-content: flex-end;
        }
        .btn-accept {
            background: #fff;
            color: #000;
            border: none;
            padding: 8px 20px;
            border-radius: 50px;
            font-weight: 600;
            cursor: pointer;
            transition: transform 0.2s;
        }
        .btn-accept:hover { transform: scale(1.05); }
        .btn-policy {
            color: #aaa;
            text-decoration: underline;
            padding: 8px 10px;
            font-size: 0.9rem;
        }
        @keyframes slideUp { from { transform: translate(-50%, 100px); opacity: 0; } to { transform: translate(-50%, 0); opacity: 1; } }
    `;

    document.head.appendChild(style);
    document.body.appendChild(banner);

    // Logic
    document.getElementById("accept-cookies").addEventListener("click", () => {
        localStorage.setItem(cookieKey, "true");
        banner.style.opacity = "0";
        setTimeout(() => banner.remove(), 500);
    });
});



/* --- corporate.js --- */

document.addEventListener("DOMContentLoaded", function () {

    // 1. Initialize Lenis for smooth scrolling
    const lenis = new Lenis({
        duration: 1.2,
        easing: (t) => Math.min(1, 1.001 - Math.pow(2, -10 * t)),
        direction: 'vertical',
        gestureDirection: 'vertical',
        smooth: true,
        mouseMultiplier: 1,
        smoothTouch: false,
        touchMultiplier: 2,
    });

    function raf(time) {
        lenis.raf(time);
        requestAnimationFrame(raf);
    }

    requestAnimationFrame(raf);

    // Sync ScrollTrigger with Lenis
    gsap.registerPlugin(ScrollTrigger);

    // 2. Custom Cursor Logic
    const cursor = document.querySelector('.cursor');
    const follower = document.querySelector('.cursor-follower');

    // Only init cursor if elements exist
    if (cursor && follower) {
        document.addEventListener('mousemove', (e) => {
            gsap.to(cursor, { x: e.clientX, y: e.clientY, duration: 0.1 });
            gsap.to(follower, { x: e.clientX, y: e.clientY, duration: 0.3 });
        });

        const interactables = document.querySelectorAll('a, button, .project-card');
        interactables.forEach(el => {
            el.addEventListener('mouseenter', () => {
                gsap.to(cursor, { scale: 3, opacity: 0 });
                gsap.to(follower, { scale: 1.5, borderColor: 'transparent', backgroundColor: 'rgba(255,255,255,0.1)' });
            });
            el.addEventListener('mouseleave', () => {
                gsap.to(cursor, { scale: 1, opacity: 1 });
                gsap.to(follower, { scale: 1, borderColor: 'rgba(255,255,255,0.5)', backgroundColor: 'transparent' });
            });
        });
    }

    // 3. Hero Animation
    const heroTl = gsap.timeline();

    // Split text for hero lines
    new SplitType('.hero-title .line', { types: 'lines, chars' });

    heroTl.from('.hero-title .line .char', {
        y: 100,
        opacity: 0,
        duration: 1,
        stagger: 0.05,
        ease: "power4.out",
        delay: 0.5
    })
        .from('.hero-subtitle', {
            y: 20,
            opacity: 0,
            duration: 1,
            ease: "power2.out"
        }, "-=0.5")
        .from('.scroll-indicator', {
            opacity: 0,
            duration: 1,
            ease: "power2.out"
        }, "-=0.5");

    // 4. Text Reveal Animation
    const revealText = new SplitType('.reveal-text', { types: 'words' });

    gsap.from(revealText.words, {
        scrollTrigger: {
            trigger: ".intro",
            start: "top 70%",
            end: "bottom 80%",
            scrub: true,
        },
        opacity: 0.1,
        stagger: 0.1
    });

    // 5. Parallax Section
    gsap.to('.parallax-bg', {
        scrollTrigger: {
            trigger: ".parallax-section",
            start: "top bottom",
            end: "bottom top",
            scrub: true
        },
        yPercent: 30, // Move background slower than scroll
        ease: "none"
    });

    // 6. Horizontal Scroll Section
    const horizontalWrap = document.querySelector('.horizontal-wrap');

    // Calculate scroll amount based on width
    const getScrollAmount = () => -(horizontalWrap.scrollWidth - window.innerWidth);

    const tween = gsap.to(horizontalWrap, {
        x: getScrollAmount,
        ease: "none",
    });

    ScrollTrigger.create({
        trigger: ".horizontal-scroll",
        start: "top top",
        end: () => `+=${getScrollAmount() * -1}`, // Adjust end based on scroll width
        pin: true,
        animation: tween,
        scrub: 1,
        invalidateOnRefresh: true,
        // markers: true // for debugging
    });

    // 7. Grid Animation (Fade and Scale In)
    const cards = document.querySelectorAll('.project-card');
    cards.forEach((card, index) => {
        gsap.from(card, {
            scrollTrigger: {
                trigger: card,
                start: "top 85%",
                toggleActions: "play none none reverse"
            },
            y: 100,
            opacity: 0,
            duration: 1,
            ease: "power3.out"
        });
    });

    // 8. Footer Reveal
    gsap.from('.footer h2', {
        scrollTrigger: {
            trigger: ".footer",
            start: "top 70%",
        },
        y: 100,
        opacity: 0,
        duration: 1.2,
        ease: "power4.out"
    });

    // Background color change based on section data-color
    const sections = document.querySelectorAll('[data-color]');
    sections.forEach(section => {
        ScrollTrigger.create({
            trigger: section,
            start: "top 50%",
            end: "bottom 50%",
            onEnter: () => updateColor(section.dataset.color),
            onEnterBack: () => updateColor(section.dataset.color)
        });
    });

    function updateColor(color) {
        if (color === 'light') {
            gsap.to('body', { backgroundColor: '#ffffff', color: '#050505', duration: 0.5 });
            gsap.to('.nav', { color: '#050505', duration: 0.5 });
        } else { // dark or black
            const bg = color === 'black' ? '#000000' : '#050505';
            gsap.to('body', { backgroundColor: bg, color: '#ffffff', duration: 0.5 });
            gsap.to('.nav', { color: '#ffffff', duration: 0.5 });
        }
    }

});




/* --- dj-panel.js --- */


// DOM Elements
const requestsContainer = document.getElementById('requests-container');
const pendingCountEl = document.getElementById('pending-count');
const playedCountEl = document.getElementById('played-count');
const totalCountEl = document.getElementById('total-count');
const loadingEl = document.getElementById('loading');
const statsBar = document.getElementById('stats-bar');
const accessDenied = document.getElementById('access-denied');

// Auth Check
onAuthStateChanged(auth, (user) => {
  if (user) {
    initDashboard();
  } else {
    // If not logged in, show access denied
    if (loadingEl) loadingEl.style.display = 'none';
    if (accessDenied) accessDenied.style.display = 'block';
  }
});

function initDashboard() {
  if (loadingEl) loadingEl.style.display = 'none';
  if (statsBar) statsBar.style.display = 'grid';
  if (requestsContainer) requestsContainer.style.display = 'grid';

  // Listen to requests - MATCHING THE PATH FROM pedir-cancion.html
  const requestsRef = ref(database, 'song-requests/carnaval-2026');

  onValue(requestsRef, (snapshot) => {
    if (snapshot.exists()) {
      const data = snapshot.val();
      const requests = Object.entries(data).map(([key, val]) => ({
        id: key,
        ...val
      }));

      // Sort: Pending first, then by timestamp desc
      requests.sort((a, b) => {
        if (a.status === 'pending' && b.status !== 'pending') return -1;
        if (a.status !== 'pending' && b.status === 'pending') return 1;
        return b.timestamp - a.timestamp;
      });

      renderRequests(requests);
      updateStats(requests);
    } else {
      renderEmptyState();
      updateStats([]);
    }
  });
}

function renderRequests(requests) {
  if (!requestsContainer) return;
  requestsContainer.innerHTML = '';

  requests.forEach(req => {
    const isPlayed = req.status === 'played';
    const card = document.createElement('div');
    card.className = `request-card ${isPlayed ? 'played' : 'new'}`;
    card.id = `req-${req.id}`;

    const timeString = req.timestamp ? new Date(req.timestamp).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' }) : '';

    card.innerHTML = `
            <div>
                <div class="song-name">${escapeHtml(req.songName)}</div>
                <div class="request-meta">
                    <span><i class="bi bi-person-fill"></i> ${escapeHtml(req.userName || 'Anònim')}</span>
                    <span><i class="bi bi-clock"></i> ${timeString}</span>
                </div>
            </div>
            <div class="request-actions">
                <button class="btn-action btn-played" onclick="window.markPlayed('${req.id}', ${!isPlayed})">
                    ${isPlayed ? '<i class="bi bi-arrow-counterclockwise"></i> Recuperar' : '<i class="bi bi-check-lg"></i> Fet'}
                </button>
                <button class="btn-action btn-delete" onclick="window.deleteRequest('${req.id}')">
                    <i class="bi bi-trash"></i>
                </button>
            </div>
        `;
    requestsContainer.appendChild(card);
  });
}

function renderEmptyState() {
  if (!requestsContainer) return;
  requestsContainer.innerHTML = `
        <div class="empty-state">
            <i class="bi bi-music-note-beamed"></i>
            <h3>Sense peticions</h3>
            <p>Encara no hi ha cap sol·licitud de cançó.</p>
        </div>
    `;
}

function updateStats(requests) {
  const total = requests.length;
  const played = requests.filter(r => r.status === 'played').length;
  const pending = total - played;

  if (pendingCountEl) pendingCountEl.innerText = pending;
  if (playedCountEl) playedCountEl.innerText = played;
  if (totalCountEl) totalCountEl.innerText = total;
}

// Expose functions to window for onclick events in HTML strings
window.markPlayed = function (id, setPlayed) {
  const status = setPlayed ? 'played' : 'pending';
  update(ref(database, `song-requests/carnaval-2026/${id}`), {
    status: status
  });
};

window.deleteRequest = function (id) {
  if (confirm('Segur que vols esborrar aquesta petició?')) {
    remove(ref(database, `song-requests/carnaval-2026/${id}`));
  }
};

function escapeHtml(text) {
  if (!text) return '';
  return text
    .replace(/&/g, "&amp;")
    .replace(/</g, "&lt;")
    .replace(/>/g, "&gt;")
    .replace(/"/g, "&quot;")
    .replace(/'/g, "&#039;");
}



/* --- firebase-config.js --- */


const firebaseConfig = {
    apiKey: "AIzaSyAfNLKv-jNyyAaVrYSbwPnJKyNClDiF94Y",
    authDomain: "dj-posaxa-web.firebaseapp.com",
    databaseURL: "https://dj-posaxa-web-default-rtdb.europe-west1.firebasedatabase.app",
    projectId: "dj-posaxa-web",
    storageBucket: "dj-posaxa-web.appspot.com",
    messagingSenderId: "647042791526",
    appId: "1:647042791526:web:3b870e05ab0ed34cbd95a7",
    measurementId: "G-C8R4Z4TLE1"
};

const app = initializeApp(firebaseConfig);
console.log("Firebase App Initialized:", app.name);

const auth = getAuth(app);
const database = getDatabase(app);
const storage = getStorage(app);

// Expose to window for legacy support and other scripts
// Safe exposure logic to handle load order differences
const firebaseAuthObj = {
    GoogleAuthProvider,
    signInWithPopup,
    signInWithEmailAndPassword,
    createUserWithEmailAndPassword,
    updateProfile,
    onAuthStateChanged,
    signOut,
    onValue,
    remove,
    push,
    set,
    serverTimestamp,
    runTransaction,
    getStorage,
    storageRef,
    uploadBytes,
    getDownloadURL
};

if (typeof window.exposeFirebase === 'function') {
    window.exposeFirebase(auth, database, ref, update, get, firebaseAuthObj);
} else {
    // Fallback if main.js hasn't loaded yet
    window.auth = auth;
    window.database = database;
    window.ref = ref;
    window.update = update;
    window.get = get;
    window.onValue = onValue;
    window.remove = remove;
    window.push = push;
    window.set = set;
    window.serverTimestamp = serverTimestamp;
    window.runTransaction = runTransaction;
    window.firebaseAuth = firebaseAuthObj;
}

// Also export for ES module usage
export {
    auth, database, storage, ref, update, get, onValue, remove, push, set,
    onAuthStateChanged, serverTimestamp, runTransaction,
    GoogleAuthProvider, signInWithPopup, signInWithEmailAndPassword,
    createUserWithEmailAndPassword, updateProfile, signOut,
    getStorage, storageRef, uploadBytes, getDownloadURL
};




/* --- main.js --- */

// Check for file protocol which blocks modules
if (window.location.protocol === 'file:') {
    alert("⚠️ AVÍS: Estàs obrint la web directament des de l'arxiu (file://). Això bloqueja la connexió amb Firebase i altres funcions. \n\nSi us plau, utilitza un servidor local (com 'Live Server' a VS Code) o puja la web a un servidor (GitHub Pages, Vercel, etc.) per veure-la correctament.");
    console.warn("Running from file:// protocol. Modules and CORS will likely fail.");
}

let currentTranslations = {};

const commonTranslations = {
    ca: {
        onboarding_title: "Benvingut a la família!",
        onboarding_subtitle: "Abans de començar, ens agradaria conèixer-te una mica millor.",
        onboarding_genre: "Quin és el teu estil musical preferit?",
        onboarding_discovery: "Com has conegut a DJ Posaxa?",
        onboarding_submit: "Completar Registre",
        auth_modal_title: "Inicia Sessió",
        auth_google_prompt: "Fes servir el teu compte de Google per accedir de forma ràpida i segura.",
        auth_google_btn: "Continua amb Google",
        login_button: "Inicia Sessió"
    },
    es: {
        onboarding_title: "¡Bienvenido a la familia!",
        onboarding_subtitle: "Antes de empezar, nos gustaría conocerte un poco mejor.",
        onboarding_genre: "¿Cuál es tu estilo musical favorito?",
        onboarding_discovery: "¿Cómo conociste a DJ Posaxa?",
        onboarding_submit: "Completar Registro",
        auth_modal_title: "Iniciar Sesión",
        auth_google_prompt: "Usa tu cuenta de Google para acceder de forma rápida y segura.",
        auth_google_btn: "Continúa con Google",
        login_button: "Iniciar Sesión"
    },
    en: {
        onboarding_title: "Welcome to the family!",
        onboarding_subtitle: "Before we start, we'd like to get to know you a bit better.",
        onboarding_genre: "What is your favorite music genre?",
        onboarding_discovery: "How did you hear about DJ Posaxa?",
        onboarding_submit: "Complete Registration",
        auth_modal_title: "Sign In",
        auth_google_prompt: "Use your Google account for quick and secure access.",
        auth_google_btn: "Continue with Google",
        login_button: "Sign In"
    },
    fr: {
        onboarding_title: "Bienvenue dans la famille !",
        onboarding_subtitle: "Avant de commencer, nous aimerions mieux vous connaître.",
        onboarding_genre: "Quel est votre style musical préféré ?",
        onboarding_discovery: "Comment avez-vous connu DJ Posaxa ?",
        onboarding_submit: "Terminer l'inscription",
        auth_modal_title: "Se connecter",
        auth_google_prompt: "Utilisez votre compte Google pour un accès rapide et sécurisé.",
        auth_google_btn: "Continuer avec Google",
        login_button: "Se connecter"
    },
    de: {
        onboarding_title: "Willkommen in der Familie!",
        onboarding_subtitle: "Bevor wir beginnen, möchten wir Sie etwas besser kennenlernen.",
        onboarding_genre: "Was ist Ihr Lieblingsmusikstil?",
        onboarding_discovery: "Wie haben Sie von DJ Posaxa erfahren?",
        onboarding_submit: "Registrierung abschließen",
        auth_modal_title: "Anmelden",
        auth_google_prompt: "Verwenden Sie Ihr Google-Konto für einen schnellen und sicheren Zugriff.",
        auth_google_btn: "Weiter mit Google",
        login_button: "Anmelden"
    }
};

window.getLanguage = function () {
    const savedLang = localStorage.getItem('language');
    if (savedLang && currentTranslations[savedLang]) {
        return savedLang;
    }
    const browserLang = navigator.language.slice(0, 2);
    if (currentTranslations[browserLang]) {
        return browserLang;
    }
    return 'ca'; // Default language
}

window.setLanguage = function (lang) {
    if (!currentTranslations[lang]) return;

    document.documentElement.lang = lang;
    const translation = currentTranslations[lang];

    document.querySelectorAll('[data-translate]').forEach(el => {
        const key = el.getAttribute('data-translate');
        if (translation[key]) {
            if (el.tagName === 'META') {
                el.content = translation[key];
            } else {
                el.innerHTML = translation[key];
            }
        }
    });
}

window.changeLanguage = function (lang) {
    localStorage.setItem('language', lang);
    if (window.updateFirebasePreference) window.updateFirebasePreference('language', lang);
    // Recarreguem les traduccions i apliquem l'idioma a l'instant
    if (window.pageTranslations) {
        currentTranslations = window.pageTranslations;
        setLanguage(lang);
    }
};

window.translateAll = function () {
    window.setLanguage(window.getLanguage());
};

function getTheme() {
    return localStorage.getItem('theme') || 'dark'; // Default to dark
}

function applyTheme() {
    const theme = getTheme();
    if (theme === 'light') {
        document.body.classList.add('light-mode');
    } else {
        document.body.classList.remove('light-mode');
    }
}

window.toggleTheme = function (theme) {
    localStorage.setItem('theme', theme);
    window.updateFirebasePreference('theme', theme);
    applyTheme();
}

function getFontSize() {
    return localStorage.getItem('fontSize') || 'normal'; // Default to normal
}

function applyFontSize() {
    const size = getFontSize();
    const html = document.documentElement;
    html.classList.remove('font-size-small', 'font-size-normal', 'font-size-large');
    if (size === 'small' || size === 'large') {
        html.classList.add(`font-size-${size}`);
    }
}

window.changeFontSize = function (size) {
    if (['small', 'normal', 'large'].includes(size)) {
        localStorage.setItem('fontSize', size);
        window.updateFirebasePreference('fontSize', size);
        applyFontSize();
    }
}

window.applyAnimations = function () {
    const animationsEnabled = localStorage.getItem('animations') !== 'false';
    if (!animationsEnabled) {
        document.body.classList.add('no-animations');
        if (!document.getElementById('no-animations-style')) {
            const style = document.createElement('style');
            style.id = 'no-animations-style';
            style.textContent = '.no-animations *, .no-animations *::before, .no-animations *::after { animation: none !important; transition: none !important; }';
            document.head.appendChild(style);
        }
    } else {
        document.body.classList.remove('no-animations');
        const style = document.getElementById('no-animations-style');
        if (style) style.remove();
    }
}

async function initializePage(translations, specialLogic = null) {
    // Merge common translations
    for (const lang in translations) {
        if (commonTranslations[lang]) {
            translations[lang] = { ...translations[lang], ...commonTranslations[lang] };
        }
    }
    currentTranslations = translations;

    // Injectar el modal d'autenticació
    await injectAuthModal();

    // Set year
    const yearSpan = document.getElementById('year');
    if (yearSpan) {
        yearSpan.textContent = new Date().getFullYear();
    }

    // Apply theme
    applyTheme();

    // Apply font size
    applyFontSize();

    // Apply animations
    window.applyAnimations();

    // Set language
    const savedLang = window.getLanguage();
    window.setLanguage(savedLang);

    // Run page-specific logic if it exists
    if (specialLogic) {
        specialLogic();
    }
}

window.updateFirebasePreference = function (key, value) {
    if (window.auth && window.database && window.ref && window.update && window.auth.currentUser) {
        const { auth, database, ref, update } = window;
        const user = auth.currentUser;
        update(ref(database, `users/${user.uid}/preferences`), { [key]: value }).catch(console.error);
    }
}
/**
 * Sincronitza les preferències de l'usuari (tema, idioma, etc.) amb Firebase Realtime Database.
 * @param {object} auth - Instància d'autenticació de Firebase.
 * @param {object} database - Instància de la base de dades de Firebase.
 * @param {function} get - Funció 'get' de Firebase Database.
 * @param {function} ref - Funció 'ref' de Firebase Database.
 * @param {function} update - Funció 'update' de Firebase Database.
 */
window.syncPreferencesWithFirebase = function (auth, database, get, ref, update) {
    const user = auth.currentUser;
    if (!user) return;

    const userRef = ref(database, `users/${user.uid}`);

    // Actualitzem la data de l'últim inici de sessió immediatament
    update(userRef, { lastLogin: new Date().toISOString() }).catch(console.error);

    get(userRef).then((snapshot) => {
        if (snapshot.exists()) {
            const userData = snapshot.val();
            const prefs = userData.preferences || {};

            // L'usuari té preferències guardades, les carreguem.
            console.log('Preferències carregades des de Firebase:', prefs);

            // Gestió de Rols
            const userRole = userData.role || 'cliente';
            const adminLinkContainer = document.getElementById('admin-link-container');
            const authContainer = document.getElementById('auth-container');

            // Actualitza la icona de perfil i l'enllaç d'admin
            const photoURL = user.photoURL || 'Fotos/images.png'; // Imatge per defecte

            if (userRole === 'administrador' || userRole === 'admin') {
                if (authContainer) authContainer.innerHTML = `<a class="nav-link" href="admin.html" aria-label="Perfil"><img src="${photoURL}" alt="Perfil" style="width: 28px; height: 28px; border-radius: 50%;"></a>`;
                if (adminLinkContainer) adminLinkContainer.innerHTML = `<a class="nav-link" href="admin.html">Admin Panel</a>`;
            } else {
                if (authContainer) authContainer.innerHTML = `<a class="nav-link" href="perfil.html" aria-label="Perfil"><img src="${photoURL}" alt="Perfil" style="width: 28px; height: 28px; border-radius: 50%;"></a>`;
                if (adminLinkContainer) adminLinkContainer.innerHTML = ''; // Buidem el contenidor si no és admin
            }

            if (adminLinkContainer) {
            }

            if (prefs.theme) localStorage.setItem('theme', prefs.theme);
            if (prefs.fontSize) localStorage.setItem('fontSize', prefs.fontSize);
            // Donem prioritat al valor de Firebase. Si no existeix, mantenim el local o 'false'.
            if (prefs.djPosaxaFollowVerified) {
                localStorage.setItem('djPosaxaFollowVerified', prefs.djPosaxaFollowVerified);
            }

            // Apliquem la configuració carregada
            applyTheme();
            applyFontSize();
            window.applyAnimations();
            window.setLanguage(window.getLanguage());
        }
    });
};

window.handleLoggedOutState = function () {
    const authContainer = document.getElementById('auth-container');
    if (authContainer) {
        authContainer.innerHTML = `<button id="login-button" class="btn btn-primary" data-bs-toggle="modal" data-bs-target="#authModal" data-translate="login_button">Inicia Sessió</button>`;
        if (window.translateAll) window.translateAll();
    }
};

async function injectAuthModal() {
    // Evita injectar el modal si ja existeix
    if (document.getElementById('authModal')) return;

    try {
        const response = await fetch('auth-modal.html'); // Usar ruta relativa
        if (!response.ok) {
            throw new Error(`No s'ha pogut carregar auth-modal.html: ${response.statusText}`);
        }
        const modalHtml = await response.text();
        document.body.insertAdjacentHTML('beforeend', modalHtml);
    } catch (error) {
        console.error("Error injectant el modal d'autenticació:", error);
    }
}

let authListenersSetup = false;

function setupAuthModalListeners(auth, database, ref, get, update, firebaseAuth) {
    if (authListenersSetup) return; // Evitar duplicar listeners

    if (!firebaseAuth || !firebaseAuth.GoogleAuthProvider) return;
    const { GoogleAuthProvider, signInWithPopup, signInWithEmailAndPassword, createUserWithEmailAndPassword, updateProfile } = firebaseAuth;

    const authModal = new bootstrap.Modal(document.getElementById('authModal'));
    const googleSigninBtn = document.getElementById('google-signin-btn');

    // Forms
    const loginForm = document.getElementById('login-form');
    const registerForm = document.getElementById('register-form');
    const onboardingForm = document.getElementById('onboarding-form');

    // Sections for visibility toggle
    const authTabs = document.getElementById('authTabs');
    const authTabContent = document.getElementById('authTabContent');
    const onboardingSection = document.getElementById('auth-onboarding-section');

    // Feedbacks
    const loginFeedback = document.getElementById('auth-feedback-login');
    const registerFeedback = document.getElementById('auth-feedback-register');

    function showFeedback(element, message, isError = true) {
        if (!element) return;
        element.textContent = message;
        element.className = `alert ${isError ? 'alert-danger' : 'alert-success'}`;
        element.classList.remove('d-none');
        element.style.display = 'block';
    }

    function hideFeedback() {
        if (loginFeedback) loginFeedback.classList.add('d-none');
        if (registerFeedback) registerFeedback.classList.add('d-none');
    }

    function showOnboarding() {
        if (authTabs) authTabs.style.display = 'none';
        if (authTabContent) {
            // Hide tab panes by manipulating bootstrap classes or manually hiding
            // Simplest way for this specific modal structure:
            authTabContent.style.display = 'none';
        }
        if (onboardingSection) {
            onboardingSection.classList.remove('d-none');
            onboardingSection.style.display = 'block';
        }
    }

    function resetModalState() {
        if (authTabs) authTabs.style.display = 'flex';
        if (authTabContent) authTabContent.style.display = 'block';
        if (onboardingSection) {
            onboardingSection.classList.add('d-none');
            onboardingSection.style.display = 'none';
        }

        // Reset to first tab
        const loginTab = document.getElementById('login-tab');
        if (loginTab) {
            const tab = new bootstrap.Tab(loginTab);
            tab.show();
        }

        if (loginForm) loginForm.reset();
        if (registerForm) registerForm.reset();
        if (onboardingForm) onboardingForm.reset();
        hideFeedback();
    }

    // Reset modal state when closed
    document.getElementById('authModal').addEventListener('hidden.bs.modal', resetModalState);

    function getErrorMessage(code) {
        switch (code) {
            case 'auth/invalid-email': return 'El correu electrònic no és vàlid.';
            case 'auth/user-disabled': return 'Aquest usuari ha estat inhabilitat.';
            case 'auth/user-not-found': return 'No s\'ha trobat cap usuari amb aquest correu.';
            case 'auth/wrong-password': return 'Contrasenya incorrecta.';
            case 'auth/email-already-in-use': return 'Aquest correu ja està registrat.';
            case 'auth/weak-password': return 'La contrasenya ha de tenir almenys 6 caràcters.';
            default: return code;
        }
    }

    function checkUserAndProceed(user, isNewRegistration = false) {
        const userRef = ref(database, 'users/' + user.uid);
        get(userRef).then((snapshot) => {
            const val = snapshot.val();
            // If new registration OR user data missing/incomplete -> show onboarding
            if (isNewRegistration || !snapshot.exists() || !val || !val.onboardingCompleted) {
                showOnboarding();
            } else {
                // Everything OK
                window.syncPreferencesWithFirebase(auth, database, get, ref, update);
                authModal.hide();
            }
        });
    }

    // --- Login Handler ---
    if (loginForm) {
        loginForm.addEventListener('submit', (e) => {
            e.preventDefault();
            hideFeedback();

            const email = document.getElementById('loginEmail').value;
            const password = document.getElementById('loginPassword').value;

            signInWithEmailAndPassword(auth, email, password)
                .then((userCredential) => {
                    checkUserAndProceed(userCredential.user);
                })
                .catch((error) => {
                    showFeedback(loginFeedback, "Error: " + getErrorMessage(error.code));
                });
        });
    }

    // --- Register Handler ---
    if (registerForm) {
        registerForm.addEventListener('submit', (e) => {
            e.preventDefault();
            hideFeedback();

            const name = document.getElementById('registerName').value;
            const email = document.getElementById('registerEmail').value;
            const password = document.getElementById('registerPassword').value;

            createUserWithEmailAndPassword(auth, email, password)
                .then((userCredential) => {
                    const user = userCredential.user;
                    // Update Display Name
                    updateProfile(user, { displayName: name })
                        .then(() => {
                            checkUserAndProceed(user, true); // true = isNewUser
                        });
                })
                .catch((error) => {
                    showFeedback(registerFeedback, "Error: " + getErrorMessage(error.code));
                });
        });
    }

    // Inici de sessió amb Google
    if (googleSigninBtn) {
        googleSigninBtn.addEventListener('click', () => {
            const provider = new GoogleAuthProvider();
            signInWithPopup(auth, provider)
                .then((result) => {
                    checkUserAndProceed(result.user);
                }).catch((error) => {
                    if (loginFeedback) showFeedback(loginFeedback, `Error amb Google: ${error.message}`);
                });
        });
    }

    // Handle Onboarding Submit
    onboardingForm.addEventListener('submit', (e) => {
        e.preventDefault();
        const user = auth.currentUser;
        if (!user) return;

        const genre = document.getElementById('ob-genre').value;
        const discovery = document.getElementById('ob-discovery').value;

        const userData = {
            email: user.email,
            displayName: user.displayName,
            photoURL: user.photoURL,
            favoriteGenre: genre,
            discoverySource: discovery,
            onboardingCompleted: true,
            role: 'cliente', // Default role
            lastLogin: new Date().toISOString()
        };

        // Update user data
        update(ref(database, 'users/' + user.uid), userData)
            .then(() => {
                window.syncPreferencesWithFirebase(auth, database, get, ref, update);
                authModal.hide();
            })
            .catch((error) => {
                console.error("Error saving onboarding data:", error);
                showFeedback(authFeedback, "Error en desar les dades. Intenta-ho de nou.");
            });
    });

    authListenersSetup = true;
}


/**
 * Exposa les funcions de Firebase a l'objecte window perquè siguin accessibles globalment
 * @param {object} auth - Instància d'autenticació de Firebase.
 * @param {object} database - Instància de la base de dades de Firebase.
 * @param {function} ref - Funció 'ref' de Firebase Database.
 * @param {function} update - Funció 'update' de Firebase Database.
 * @param {function} get - Funció 'get' de Firebase Database.
 * @param {object} firebaseAuth - Objecte amb funcions d'autenticació.
 */
window.exposeFirebase = function (auth, database, ref, update, get, firebaseAuth) {
    window.auth = auth;
    window.database = database;
    window.ref = ref;
    window.update = update;
    window.get = get;

    // Merge or set firebaseAuth
    if (firebaseAuth) {
        if (!window.firebaseAuth) window.firebaseAuth = {};
        Object.assign(window.firebaseAuth, firebaseAuth);
    }

    console.log('Firebase exposed to window');
};

/**
 * Funció principal d'inicialització que s'assegura que tot es carrega en ordre.
 * Aquesta funció és cridada des dels fitxers HTML després que Firebase s'hagi inicialitzat.
 */
window.initAuth = async function () {
    // 1. Injecta el modal d'autenticació i espera que estigui al DOM.
    await injectAuthModal();

    // 2. Ara que el modal existeix, configura els seus listeners.
    // Aquest codi només s'executa si Firebase s'ha carregat correctament (perquè window.auth existirà).
    if (window.auth && window.firebaseAuth) {
        setupAuthModalListeners(window.auth, window.database, window.ref, window.get, window.update, window.firebaseAuth);
    }
};



/* --- mashups.js --- */

// Mashups Page Logic

document.addEventListener('DOMContentLoaded', function () {
    // Check if Tesseract is available
    if (typeof Tesseract === 'undefined') {
        console.error('Tesseract.js not loaded');
    }

    // Initialize translations logic if available
    if (typeof initializePage === 'function' && window.pageTranslations) {
        initializePage(window.pageTranslations, (translations, getLanguage) => {
            setupMashupsPage(translations, getLanguage);
        });
    } else {
        // Fallback if translations script isn't ready
        setupMashupsPage(null, () => 'ca');
    }
});

function setupMashupsPage(translations, getLanguage) {
    const followGate = document.getElementById('follow-gate');
    const mashupsContent = document.getElementById('mashups-content');
    const verifyButton = document.getElementById('verify-button');
    const modal = document.getElementById('verification-modal');
    const cancelBtn = document.getElementById('cancel-verification');
    const uploadArea = document.getElementById('upload-area');
    const fileInput = document.getElementById('screenshot-input');
    const uploadText = document.getElementById('upload-text');
    const statusText = document.getElementById('verification-status');
    const progressContainer = document.getElementById('progress-container');
    const progressBar = document.getElementById('progress-bar');

    // Helper to getText safely
    const getText = (key) => {
        const lang = getLanguage();
        return translations && translations[lang] && translations[lang][key] ? translations[lang][key] : key;
    };

    // Check if already verified
    const djPosaxaFollowVerified = localStorage.getItem('djPosaxaFollowVerified');
    if (djPosaxaFollowVerified === 'true') {
        if (followGate) followGate.style.display = 'none';
        if (mashupsContent) mashupsContent.style.display = 'block';
    }

    if (!verifyButton || !fileInput) return;

    // Verify button click
    verifyButton.addEventListener('click', () => {
        // We use the global auth object from firebase-config if available
        // Or check if user is logged in via UI state
        // For simplicity, we just prompt login if we can't find a user

        const currentUser = auth.currentUser;

        if (currentUser) {
            modal.style.display = 'flex';
        } else {
            const authModal = document.getElementById('authModal');
            if (authModal) {
                const bsModal = new bootstrap.Modal(authModal);
                bsModal.show();
            } else {
                alert("Error: Auth modal not found");
            }
        }
    });

    // Cancel button
    if (cancelBtn) {
        cancelBtn.addEventListener('click', () => {
            modal.style.display = 'none';
            fileInput.value = '';
            statusText.innerHTML = '';
            progressContainer.style.display = 'none';
            uploadText.textContent = getText('modal_upload_text');
        });
    }

    // Upload area click
    if (uploadArea) {
        uploadArea.addEventListener('click', () => {
            fileInput.click();
        });
    }

    // File input change
    fileInput.addEventListener('change', async (e) => {
        const file = e.target.files[0];
        if (!file) return;

        uploadText.textContent = `Arxiu: ${file.name}`;
        statusText.innerHTML = "Analitzant amb Sigma AI...";
        statusText.style.color = '#667eea';
        progressBar.style.width = '0%';
        progressContainer.style.display = 'block';

        const followWords = [
            "siguiendo", "following", "seguint", "sigues a", "follows you",
            "suivi", "suivant", "gefolgt", "folgen", "seguito", "seguindo",
            "volgend", "takiptesin", "читаю", "подписан", "متابع", "フォロー中", "팔로잉", "正在关注",
            "amistades", "amigos", "friends", "amis", "freunde" // Expanded keywords to cover more "following" states
        ];

        try {
            const { data: { text } } = await Tesseract.recognize(file, 'eng+spa+cat', {
                logger: m => {
                    if (m.status === 'recognizing text') {
                        const progress = m.progress * 100;
                        progressBar.style.width = `${progress}%`;
                        statusText.innerHTML = `Analitzant amb Sigma AI... (${Math.round(progress)}%)`;
                    }
                }
            });

            progressContainer.style.display = 'none';
            const texto = text.toLowerCase();

            // Validation Logic
            const follows = followWords.some(word => texto.includes(word));

            // Relaxed name matching to avoid OCR errors (e.g "posaxa" is unique enough)
            const hasName = texto.includes("dj.posaxa") ||
                texto.includes("dj posaxa") ||
                texto.includes("posaxa") ||
                texto.includes("dj_posaxa") ||
                texto.includes("djposaxa");

            if (follows && hasName) {
                statusText.innerHTML = '✅ <b>Verificat:</b> S\'ha detectat que segueixes a DJ Posaxa.';
                statusText.style.color = '#10b981';
                localStorage.setItem('djPosaxaFollowVerified', 'true');

                // Update Firebase if possible
                if (window.updateFirebasePreference) {
                    window.updateFirebasePreference('djPosaxaFollowVerified', 'true');
                }

                setTimeout(() => {
                    modal.style.display = 'none';
                    followGate.style.display = 'none';
                    mashupsContent.style.display = 'block';
                }, 2000);
            } else {
                let errorMsg = '❌ <b>No verificat.</b><br>';
                if (!hasName) errorMsg += 'No hem trobat el nom "dj.posaxa". ';
                if (!follows) errorMsg += 'No hem trobat l\'indicador de "Seguint". ';

                statusText.innerHTML = errorMsg + '<br>Prova amb una altra captura més clara.';
                statusText.style.color = '#ef4444';
                fileInput.value = '';
                uploadText.textContent = getText('modal_upload_text');
            }
        } catch (err) {
            progressContainer.style.display = 'none';
            statusText.innerHTML = "⚠️ Error en processar la imatge. Intenta-ho de nou.";
            statusText.style.color = '#ef4444';
            console.error(err);
            fileInput.value = '';
            uploadText.textContent = getText('modal_upload_text');
        }
    });
}




/* --- mixer.js --- */

document.addEventListener('DOMContentLoaded', () => {
    const audioContext = new (window.AudioContext || window.webkitAudioContext)();
    if (!audioContext) {
        alert("Web Audio API no es compatible en este navegador. Por favor, usa Chrome o Firefox.");
        return;
    }

    // --- NODOS GLOBALES ---
    const masterGain = audioContext.createGain();
    const headphoneGain = audioContext.createGain();
    const masterAnalyser = audioContext.createAnalyser();
    masterAnalyser.fftSize = 256;
    masterGain.connect(masterAnalyser);
    masterAnalyser.connect(audioContext.destination);
    // Headphone out no se conecta a destination

    const decks = {
        a: createDeck('a'),
        b: createDeck('b')
    };

    // --- CREACIÓN DE DECK ---
    function createDeck(id) {
        const deck = {
            id: id,
            audioBuffer: null,
            source: null,
            bpm: 0,
            hotCues: new Array(8).fill(null),
            loopStart: null,
            loopEnd: null,
            isLooping: false,
            key: '',
            gainNode: audioContext.createGain(),
            crossfadeGain: audioContext.createGain(),
            analyserNode: audioContext.createAnalyser(),
            eq: {
                low: createBiquadFilter('lowshelf', 250),
                mid: createBiquadFilter('peaking', 1000, 0.5),
                high: createBiquadFilter('highshelf', 4000),
            },
            isPlaying: false,
            playbackRate: 1,
            startTime: 0,
            startOffset: 0,
            isScratching: false,
            lastPlatterAngle: 0,
            // Elementos UI
            platter: document.getElementById(`platter-${id}`),
            playBtn: document.getElementById(`play-${id}`),
            cueBtn: document.getElementById(`cue-${id}`),
            syncBtn: document.getElementById(`sync-${id}`),
            trackInfo: document.getElementById(`track-info-${id}`),
            waveformCanvas: document.getElementById(`waveform-${id}`),
            vuMeterCanvas: document.getElementById(`vu-meter-${id}`),
            hotCueContainer: document.getElementById(`hot-cues-${id}`),
            pitchSlider: document.getElementById(`pitch-${id}`),
            headphoneCueBtn: document.getElementById(`headphone-cue-${id}`),
        };
        deck.analyserNode.fftSize = 256;

        // Cadena de audio: source -> gain -> EQ -> analyser -> crossfade
        deck.gainNode.connect(deck.eq.low);
        deck.eq.low.connect(deck.eq.mid);
        deck.eq.mid.connect(deck.eq.high);
        deck.eq.high.connect(deck.analyserNode);
        deck.analyserNode.connect(deck.crossfadeGain);
        deck.crossfadeGain.connect(masterGain);
        deck.crossfadeGain.connect(headphoneGain);

        setupEventListeners(deck);
        return deck;
    }

    function createBiquadFilter(type, freq, q = 1) {
        const filter = audioContext.createBiquadFilter();
        filter.type = type;
        filter.frequency.value = freq;
        filter.gain.value = 0;
        filter.Q.value = q;
        return filter;
    }

    // --- EVENT LISTENERS ---
    function setupEventListeners(deck) {
        deck.playBtn.addEventListener('click', () => togglePlay(deck));
        deck.cueBtn.addEventListener('click', () => cue(deck));
        deck.syncBtn.addEventListener('click', () => sync(deck));
        deck.headphoneCueBtn.addEventListener('click', () => toggleHeadphoneCue(deck));

        // Loop controls
        document.getElementById(`loop-in-${deck.id}`).addEventListener('click', () => setLoop(deck, 'in'));
        document.getElementById(`loop-out-${deck.id}`).addEventListener('click', () => setLoop(deck, 'out'));
        document.getElementById(`loop-toggle-${deck.id}`).addEventListener('click', () => toggleLoop(deck));
        document.getElementById(`loop-half-${deck.id}`).addEventListener('click', () => modifyLoop(deck, 0.5));
        document.getElementById(`loop-double-${deck.id}`).addEventListener('click', () => modifyLoop(deck, 2));


        // Controles de volumen y EQ
        document.getElementById(`volume-${deck.id}`).addEventListener('input', e => deck.gainNode.gain.setTargetAtTime(e.target.value, audioContext.currentTime, 0.01));
        document.getElementById(`hi-${deck.id}`).addEventListener('input', e => deck.eq.high.gain.setTargetAtTime(parseFloat(e.target.value), audioContext.currentTime, 0.01));
        document.getElementById(`mid-${deck.id}`).addEventListener('input', e => deck.eq.mid.gain.setTargetAtTime(parseFloat(e.target.value), audioContext.currentTime, 0.01));
        document.getElementById(`low-${deck.id}`).addEventListener('input', e => deck.eq.low.gain.setTargetAtTime(parseFloat(e.target.value), audioContext.currentTime, 0.01));

        // Pitch
        deck.pitchSlider.addEventListener('input', e => {
            deck.playbackRate = 1 + parseFloat(e.target.value);
            updatePlaybackRate(deck);
        });

        // Platter Scratching
        deck.platter.addEventListener('mousedown', () => deck.isScratching = true);
        window.addEventListener('mouseup', () => deck.isScratching = false);
        deck.platter.addEventListener('mousemove', e => handleScratch(e, deck));

        // Generar y configurar Hot Cue Pads
        for (let i = 0; i < 8; i++) {
            const pad = document.createElement('button');
            pad.className = 'hot-cue-pad';
            pad.textContent = `CUE ${i + 1}`;
            pad.dataset.index = i;
            pad.addEventListener('click', (e) => handleHotCue(e, deck));
            deck.hotCueContainer.appendChild(pad);
        }
    }

    // --- CARGA Y ANÁLISIS DE PISTAS ---
    async function loadTrack(file, deck) {
        if (deck.source) deck.source.stop();
        deck.trackInfo.textContent = `ANALYSING: ${file.name}`;
        deck.playBtn.classList.remove('active');

        const arrayBuffer = await file.arrayBuffer();
        deck.audioBuffer = await audioContext.decodeAudioData(arrayBuffer);

        // Análisis de BPM
        analyzeBPM(deck.audioBuffer).then(bpm => {
            deck.bpm = bpm;
            updateTrackInfo(deck);
        });

        deck.trackInfo.textContent = file.name.replace(/\.[^/.]+$/, "");
        deck.startOffset = 0;
        deck.pitchSlider.value = 0;
        deck.playbackRate = 1;
        deck.hotCues.fill(null);
        updateHotCueUI(deck);
        drawWaveform(deck);
    }

    // Variable global para la tecla Shift
    let shiftPressed = false;
    window.addEventListener('keydown', (e) => {
        if (e.key === 'Shift') shiftPressed = true;
    });
    window.addEventListener('keyup', (e) => {
        if (e.key === 'Shift') shiftPressed = false;
    });

    function updateTrackInfo(deck) {
        const name = deck.trackInfo.textContent.split(' | ')[0];
        deck.trackInfo.textContent = `${name} | ${deck.bpm.toFixed(2)} BPM`;
    }

    // --- CONTROLES DE REPRODUCCIÓN ---
    function togglePlay(deck) {
        if (deck.isPlaying) pause(deck);
        else play(deck);
    }

    function play(deck) {
        if (!deck.audioBuffer || deck.isPlaying) return;
        audioContext.resume();

        deck.source = audioContext.createBufferSource();
        deck.source.buffer = deck.audioBuffer;
        deck.source.connect(deck.gainNode);
        updatePlaybackRate(deck);

        // Loop logic
        if (deck.isLooping && deck.loopStart !== null && deck.loopEnd !== null) {
            deck.source.loop = true;
            deck.source.loopStart = deck.loopStart;
            deck.source.loopEnd = deck.loopEnd;
        }

        deck.startTime = audioContext.currentTime - deck.startOffset;
        deck.source.start(0, deck.startOffset % deck.audioBuffer.duration);
        deck.isPlaying = true;
        deck.playBtn.classList.add('active');
        deck.platter.classList.add('playing');

        deck.source.onended = () => {
            if (deck.isPlaying && !deck.isScratching) {
                pause(deck);
                deck.startOffset = 0;
            }
        };
        requestAnimationFrame(() => updateVisuals(deck));
    }

    function pause(deck) {
        if (!deck.isPlaying || !deck.source) return;
        deck.startOffset = audioContext.currentTime - deck.startTime;
        deck.source.stop();
        deck.source = null;
        deck.isPlaying = false;
        deck.playBtn.classList.remove('active');
        deck.platter.classList.remove('playing');
    }

    function cue(deck) {
        if (deck.isPlaying) pause(deck);
        deck.startOffset = 0;
        drawWaveform(deck);
    }

    function updatePlaybackRate(deck) {
        if (deck.source) {
            deck.source.playbackRate.setTargetAtTime(deck.playbackRate, audioContext.currentTime, 0.01);
        }
    }

    function sync(deck) {
        const otherDeckId = deck.id === 'a' ? 'b' : 'a';
        const otherDeck = decks[otherDeckId];
        if (!otherDeck.bpm || !deck.bpm) return;

        const rate = otherDeck.bpm / deck.bpm;
        deck.playbackRate = rate;
        deck.pitchSlider.value = rate - 1;
        updatePlaybackRate(deck);
        deck.syncBtn.classList.add('active');
        setTimeout(() => deck.syncBtn.classList.remove('active'), 1000);
    }

    function handleScratch(event, deck) {
        if (!deck.isScratching || !deck.isPlaying || !deck.source) return;

        const platterRect = deck.platter.getBoundingClientRect();
        const centerX = platterRect.left + platterRect.width / 2;
        const centerY = platterRect.top + platterRect.height / 2;
        const angle = Math.atan2(event.clientY - centerY, event.clientX - centerX);

        if (deck.lastPlatterAngle !== 0) {
            const delta = angle - deck.lastPlatterAngle;
            const scratchAmount = delta / (Math.PI * 2) * 2; // Sensibilidad
            deck.startOffset += scratchAmount;
            
            // Reiniciar el source para aplicar el nuevo offset
            deck.source.stop();
            play(deck);
        }
        deck.lastPlatterAngle = angle;
        
        // Reset angle when mouse leaves platter
        deck.platter.onmouseleave = () => {
            deck.isScratching = false;
            deck.lastPlatterAngle = 0;
        };
    }

    // --- LÓGICA DE HOT CUES Y LOOPS ---
    function handleHotCue(event, deck) {
        if (!deck.audioBuffer) return;
        const index = parseInt(event.target.dataset.index);
        const currentTime = (audioContext.currentTime - deck.startTime) * deck.playbackRate;

        if (shiftPressed) {
            // Borrar Hot Cue
            deck.hotCues[index] = null;
            event.target.classList.remove('set');
        } else {
            if (deck.hotCues[index] !== null) {
                // Saltar al Hot Cue
                deck.startOffset = deck.hotCues[index];
                if (deck.isPlaying) {
                    deck.source.stop();
                    play(deck);
                } else {
                    drawWaveform(deck, deck.startOffset / deck.audioBuffer.duration);
                }
            } else {
                // Establecer Hot Cue
                deck.hotCues[index] = deck.isPlaying ? currentTime : deck.startOffset;
                event.target.classList.add('set');
            }
        }
    }

    function updateHotCueUI(deck) {
        const pads = deck.hotCueContainer.querySelectorAll('.hot-cue-pad');
        pads.forEach((pad, i) => {
            if (deck.hotCues[i] !== null) {
                pad.classList.add('set');
            } else {
                pad.classList.remove('set');
            }
        });
    }

    function setLoop(deck, type) {
        if (!deck.isPlaying) return;
        const currentTime = (audioContext.currentTime - deck.startTime) * deck.playbackRate;
        if (type === 'in') {
            deck.loopStart = currentTime;
        } else if (type === 'out') {
            deck.loopEnd = currentTime;
            if (deck.loopStart !== null && deck.loopEnd > deck.loopStart) {
                toggleLoop(deck, true); // Activar loop automáticamente
            }
        }
    }

    function toggleLoop(deck, forceActive = null) {
        if (deck.loopStart === null || deck.loopEnd === null) return;

        deck.isLooping = forceActive !== null ? forceActive : !deck.isLooping;
        document.getElementById(`loop-toggle-${deck.id}`).classList.toggle('active', deck.isLooping);

        if (deck.isPlaying) {
            deck.source.stop();
            play(deck); // Reinicia la reproducción con la nueva configuración de loop
        }
    }

    function modifyLoop(deck, factor) {
        if (!deck.isLooping || deck.loopStart === null || deck.loopEnd === null) return;
        const loopDuration = deck.loopEnd - deck.loopStart;
        deck.loopEnd = deck.loopStart + loopDuration * factor;
        if (deck.isPlaying) {
            deck.source.stop();
            play(deck);
        }
    }

    // --- VISUALIZACIÓN ---
    function drawWaveform(deck, playheadPosition = 0) {
        if (!deck.audioBuffer) return;
        const canvas = deck.waveformCanvas;
        const ctx = canvas.getContext('2d');
        const width = canvas.width;
        const height = canvas.height;
        const data = deck.audioBuffer.getChannelData(0);
        const step = Math.ceil(data.length / width);
        const amp = height / 2;
        ctx.clearRect(0, 0, width, height);
        ctx.fillStyle = deck.id === 'a' ? '#00A9FF' : '#FF4500';

        // Dibuja la onda
        for (let i = 0; i < width; i++) {
            let min = 1.0;
            let max = -1.0;
            for (let j = 0; j < step; j++) {
                const datum = data[(i * step) + j];
                if (datum < min) min = datum;
                if (datum > max) max = datum;
            }
            const rectHeight = Math.max(1, (max - min) * amp);
            ctx.fillRect(i, (1 - max) * amp, 1, rectHeight);
        }

        // Dibuja el cabezal de reproducción
        if (playheadPosition > 0) {
            ctx.fillStyle = 'rgba(255, 255, 255, 0.8)';
            ctx.fillRect(playheadPosition * width, 0, 2, height);
        }
    }

    function updateVisuals(deck) {
        if (deck.audioBuffer) {
            // Actualizar playhead
            const elapsedTime = deck.isPlaying ? audioContext.currentTime - deck.startTime : deck.startOffset;
            const progress = elapsedTime / deck.audioBuffer.duration;
            drawWaveform(deck, progress);

            // Actualizar VU meter
            drawVuMeter(deck.analyserNode, deck.vuMeterCanvas);
        }
        if (deck.isPlaying) {
            requestAnimationFrame(() => updateVisuals(deck));
        }
    }

    function drawVuMeter(analyser, canvas) {
        const bufferLength = analyser.frequencyBinCount;
        const dataArray = new Uint8Array(bufferLength);
        analyser.getByteTimeDomainData(dataArray);

        let sumSquares = 0.0;
        for (const amplitude of dataArray) {
            const value = (amplitude - 128) / 128;
            sumSquares += value * value;
        }
        const rms = Math.sqrt(sumSquares / bufferLength);

        const ctx = canvas.getContext('2d');
        const { width, height } = canvas;
        ctx.clearRect(0, 0, width, height);

        const meterHeight = rms * height;
        const gradient = ctx.createLinearGradient(0, height, 0, 0);
        gradient.addColorStop(0, '#0f0');
        gradient.addColorStop(0.8, '#ff0');
        gradient.addColorStop(1, '#f00');

        ctx.fillStyle = gradient;
        ctx.fillRect(0, height - meterHeight, width, meterHeight);
    }

    function drawSpectrum() {
        const canvas = document.getElementById('spectrum-canvas');
        const ctx = canvas.getContext('2d');
        const { width, height } = canvas;
        const bufferLength = masterAnalyser.frequencyBinCount;
        const dataArray = new Uint8Array(bufferLength);

        masterAnalyser.getByteFrequencyData(dataArray);
        ctx.clearRect(0, 0, width, height);

        const barWidth = (width / bufferLength) * 2.5;
        let x = 0;
        for (let i = 0; i < bufferLength; i++) {
            const barHeight = dataArray[i] / 2;
            ctx.fillStyle = `rgb(50, ${barHeight + 100}, 200)`;
            ctx.fillRect(x, height - barHeight, barWidth, barHeight);
            x += barWidth + 1;
        }
        requestAnimationFrame(drawSpectrum);
    }

    // --- LÓGICA DE BPM ---
    async function analyzeBPM(audioBuffer) {
        // Implementación simplificada de detección de picos
        const data = audioBuffer.getChannelData(0);
        const sampleRate = audioBuffer.sampleRate;
        const peaks = [];
        const threshold = 0.8;

        for (let i = 0; i < data.length; i++) {
            if (data[i] > threshold) {
                peaks.push(i);
                i += Math.floor(sampleRate * 0.3); // Evitar picos muy cercanos
            }
        }

        if (peaks.length < 2) return 120; // Default

        const intervals = [];
        for (let i = 1; i < peaks.length; i++) {
            intervals.push(peaks[i] - peaks[i - 1]);
        }

        const avgInterval = intervals.reduce((a, b) => a + b, 0) / intervals.length;
        const bpm = (60 * sampleRate) / avgInterval;
        return bpm > 180 ? bpm / 2 : bpm; // Ajustar rango
    }

    // --- LÓGICA DE BIBLIOTECA ---
    const openLibraryBtn = document.getElementById('open-library-btn');
    const trackList = document.getElementById('track-list');
    const searchInput = document.getElementById('search-library');
    let musicLibrary = [];

    if ('showDirectoryPicker' in window) {
        openLibraryBtn.addEventListener('click', async () => {
            const dirHandle = await window.showDirectoryPicker();
            trackList.innerHTML = '<li>Cargando biblioteca...</li>';
            musicLibrary = [];
            for await (const entry of dirHandle.values()) {
                if (entry.kind === 'file' && (entry.name.endsWith('.mp3') || entry.name.endsWith('.wav'))) {
                    musicLibrary.push(entry);
                }
            }
            renderLibrary();
        });
    } else {
        openLibraryBtn.textContent = "Carregar Arxiu";
        openLibraryBtn.addEventListener('click', () => {
            // Fallback para navegadores sin File System Access API
            document.getElementById('file-a').click();
        });
        document.getElementById('file-a').addEventListener('change', async e => {
            const file = e.target.files[0];
            if(file) await loadTrack(await file.getFile(), decks.a);
        });
    }

    function renderLibrary(filter = '') {
        trackList.innerHTML = '';
        const filteredLibrary = musicLibrary.filter(f => f.name.toLowerCase().includes(filter.toLowerCase()));

        if (filteredLibrary.length === 0) {
            trackList.innerHTML = '<li>No s\'han trobat pistes.</li>';
            return;
        }

        filteredLibrary.forEach(fileHandle => {
            const li = document.createElement('li');
            li.textContent = fileHandle.name.replace(/\.[^/.]+$/, "");
            
            const loadButtons = document.createElement('div');
            loadButtons.className = 'load-buttons';
            
            const loadA = document.createElement('button');
            loadA.textContent = 'A';
            loadA.onclick = async () => loadTrack(await fileHandle.getFile(), decks.a);
            
            const loadB = document.createElement('button');
            loadB.textContent = 'B';
            loadB.onclick = async () => loadTrack(await fileHandle.getFile(), decks.b);

            loadButtons.append(loadA, loadB);
            li.appendChild(loadButtons);
            trackList.appendChild(li);
        });
    }

    searchInput.addEventListener('input', () => renderLibrary(searchInput.value));

    // --- CONTROLES MASTER Y CROSSFADER ---
    function toggleHeadphoneCue(deck) {
        deck.headphoneCueBtn.classList.toggle('active');
        // Lógica de enrutamiento de audio para CUE (simplificada)
        if (deck.headphoneCueBtn.classList.contains('active')) {
            deck.gainNode.connect(headphoneGain);
        } else {
            try { deck.gainNode.disconnect(headphoneGain); } catch(e) {}
        }
    }

    document.getElementById('crossfader').addEventListener('input', e => {
        const value = parseFloat(e.target.value);
        const gainA = Math.cos(value * 0.5 * Math.PI);
        const gainB = Math.cos((1.0 - value) * 0.5 * Math.PI);
        decks.a.crossfadeGain.gain.setTargetAtTime(gainA, audioContext.currentTime, 0.01);
        decks.b.crossfadeGain.gain.setTargetAtTime(gainB, audioContext.currentTime, 0.01);
    });

    document.getElementById('master-volume').addEventListener('input', e => {
        masterGain.gain.setTargetAtTime(parseFloat(e.target.value), audioContext.currentTime, 0.01);
    });

    // --- INICIALIZACIÓN ---
    drawSpectrum();
    // Disparar eventos iniciales para establecer valores
    document.getElementById('crossfader').dispatchEvent(new Event('input'));
    document.getElementById('master-volume').dispatchEvent(new Event('input'));
});



/* --- opinions.js --- */

// DJ Posaxa - Opiniones interactions
(function(){
  const cards = Array.from(document.querySelectorAll('.card'));

  // Stagger reveal delay
  cards.forEach((card, i)=>{
    card.style.transitionDelay = `${Math.min(i*70, 400)}ms`;
    card.classList.add('reveal');
  });

  // Reveal on scroll
  const io = new IntersectionObserver((entries)=>{
    entries.forEach(entry=>{
      if(entry.isIntersecting){
        entry.target.classList.add('is-visible');
        io.unobserve(entry.target);
      }
    });
  }, { threshold:.15 });
  cards.forEach(c=> io.observe(c));

  // Gradient spotlight follows mouse on hover
  const root = document.documentElement;
  function onMove(e){
    const rect = e.currentTarget.getBoundingClientRect();
    const x = (e.clientX - rect.left) / rect.width * 100;
    e.currentTarget.style.setProperty('--mx', `${x}%`);
  }
  cards.forEach(card=>{
    card.addEventListener('mousemove', onMove);
  });

  // Subtle tilt for image figure
  document.querySelectorAll('.figure').forEach(fig=>{
    let raf = null;
    function handle(e){
      const r = fig.getBoundingClientRect();
      const cx = e.clientX - r.left; const cy = e.clientY - r.top;
      const rx = ((cy/r.height)-.5)*-6; // rotateX
      const ry = ((cx/r.width)-.5)*6;   // rotateY
      if(raf) cancelAnimationFrame(raf);
      raf = requestAnimationFrame(()=>{
        fig.style.transform = `perspective(800px) rotateX(${rx.toFixed(2)}deg) rotateY(${ry.toFixed(2)}deg)`;
      });
    }
    function reset(){ fig.style.transform = 'perspective(800px)'; }
    fig.addEventListener('mousemove', handle);
    fig.addEventListener('mouseleave', reset);
  });

  // Smooth scroll for nav links (same page anchors)
  document.querySelectorAll('a[href^="#"]').forEach(a=>{
    a.addEventListener('click', (e)=>{
      const id = a.getAttribute('href');
      if(id.length>1){
        const el = document.querySelector(id);
        if(el){ e.preventDefault(); el.scrollIntoView({behavior:'smooth', block:'start'}); }
      }
    });
  });
})();



/* --- premium-index.js --- */

document.addEventListener("DOMContentLoaded", function () {

    // 1. Native Smooth Scrolling Enforced
    document.documentElement.style.scrollBehavior = 'smooth';


    // Sync GSAP
    gsap.registerPlugin(ScrollTrigger);

    // 2. Custom Cursor
    const cursor = document.querySelector('.cursor');
    const follower = document.querySelector('.cursor-follower');
    if (cursor && follower) {
        document.addEventListener('mousemove', (e) => {
            gsap.to(cursor, { x: e.clientX, y: e.clientY, duration: 0.1 });
            gsap.to(follower, { x: e.clientX, y: e.clientY, duration: 0.3 });
        });
        document.querySelectorAll('a, button, .event-card, .project-card').forEach(el => {
            el.addEventListener('mouseenter', () => {
                gsap.to(cursor, { scale: 3, opacity: 0 });
                gsap.to(follower, { scale: 1.5, borderColor: 'transparent', backgroundColor: 'rgba(255,255,255,0.1)' });
            });
            el.addEventListener('mouseleave', () => {
                gsap.to(cursor, { scale: 1, opacity: 1 });
                gsap.to(follower, { scale: 1, borderColor: 'rgba(255, 255, 255, 1)', backgroundColor: 'transparent' });
            });
        });
    }

    // 3. Hero Animations (Corporate Style)
    // Split text for hero lines
    if (document.querySelector('.hero-title')) {
        // Wrap content in lines if not present, or just split chars
        const typeSplit = new SplitType('.hero-title', { types: 'lines, chars' });

        const heroTl = gsap.timeline();
        heroTl.from(typeSplit.chars, {
            y: 100,
            opacity: 0,
            duration: 1,
            stagger: 0.03,
            ease: "power4.out",
            delay: 0.2
        })
            .from('.hero-subtitle', { y: 20, opacity: 0, duration: 1, ease: "power2.out" }, "-=0.5");
    }

    // 4. Bio Text Reveal (The "Scrub" effect requested)
    if (document.querySelector('.bio-text')) {
        const revealText = new SplitType('.bio-text', { types: 'words' });
        gsap.from(revealText.words, {
            scrollTrigger: {
                trigger: ".bio-section",
                start: "top 70%",
                end: "bottom 80%",
                scrub: true, // IMPORTANT: User specifically requested this
            },
            opacity: 0.1,
            stagger: 0.1
        });
    }

    // 5. Parallax Section
    if (document.querySelector('.hero-bg')) {
        gsap.to('.hero-bg', {
            scrollTrigger: {
                trigger: ".hero",
                start: "top top",
                end: "bottom top",
                scrub: true
            },
            yPercent: 50,
            ease: "none"
        });
    }

    // 6. Horizontal Scroll (Features)
    // 6. Horizontal Scroll (Optimized)
    const horizontalSection = document.querySelector(".horizontal-scroll");
    if (horizontalSection) {
        const wrapper = horizontalSection.querySelector(".horizontal-wrap");
        if (wrapper) {
            let mm = gsap.matchMedia();

            // Desktop: Pin and scrub
            mm.add("(min-width: 769px)", () => {
                const xMove = -(wrapper.scrollWidth - window.innerWidth);

                const tl = gsap.timeline({
                    scrollTrigger: {
                        trigger: horizontalSection,
                        start: "top top",
                        end: () => "+=" + (wrapper.scrollWidth * 2), // SLOWER SCROLL (2x distance)
                        pin: true,
                        scrub: 1.5, // Smoother scrub
                        invalidateOnRefresh: true,
                    }
                });

                tl.to(wrapper, {
                    x: xMove,
                    ease: "none"
                });
            });

            // Mobile: Native scroll (cleanup if switching)
            mm.add("(max-width: 768px)", () => {
                // Should return a cleanup function if needed, but mainly just NOT adding the tween is enough.
                // We might want to ensure 'x' is reset if resizing window
                gsap.set(wrapper, { x: 0 });
            });
        }
    }

    // 7. Generic Scroll Reveal (Events / Timelines)
    const scrollReveals = document.querySelectorAll('.scroll-reveal, .timeline-item, .event-card');
    scrollReveals.forEach(el => {
        gsap.from(el, {
            scrollTrigger: {
                trigger: el,
                start: "top 90%", // Start earlier for better visibility
                toggleActions: "play none none none" // Play once, stay visible (no reverse)
            },
            y: 100,
            opacity: 0,
            duration: 1,
            ease: "power3.out"
        });
    });

    // 7. Color Changer
    const sections = document.querySelectorAll('[data-color]');
    sections.forEach(section => {
        ScrollTrigger.create({
            trigger: section,
            start: "top 50%",
            end: "bottom 50%",
            onEnter: () => updateColor(section.dataset.color),
            onEnterBack: () => updateColor(section.dataset.color)
        });
    });

    function updateColor(color) {
        if (color === 'light') {
            gsap.to('body', { backgroundColor: '#ffffff', color: '#050505', duration: 0.5 });
            gsap.to('.nav', { color: '#050505', duration: 0.5 });
        } else {
            gsap.to('body', { backgroundColor: '#050505', color: '#ffffff', duration: 0.5 });
            gsap.to('.nav', { color: '#ffffff', duration: 0.5 });
        }
    }

});




/* --- security.js --- */


// ** Security: Prevent stealing HTML/Code **
document.addEventListener("contextmenu", function (e) {
    e.preventDefault();
}, false);

document.addEventListener("keydown", function (e) {
    // F12
    if (e.keyCode == 123) {
        e.preventDefault();
        return false;
    }
    // Ctrl+Shift+I (DevTools)
    if (e.ctrlKey && e.shiftKey && e.keyCode == 73) {
        e.preventDefault();
        return false;
    }
    // Ctrl+Shift+J (Console)
    if (e.ctrlKey && e.shiftKey && e.keyCode == 74) {
        e.preventDefault();
        return false;
    }
    // Ctrl+U (View Source)
    if (e.ctrlKey && e.keyCode == 85) {
        e.preventDefault();
        return false;
    }
});




/* --- sigma.js --- */

// Sigma AI Beta - Bottom-left Floating Chat using Puter.js and gpt-5-nano
(function () {
  // Crear botón flotante (FAB)
  const fab = document.createElement('button');
  fab.className = 'sigma-fab';
  fab.title = 'Sigma AI Beta';
  fab.textContent = 'Σ';

  // Crear panel de chat
  const panel = document.createElement('div');
  panel.className = 'sigma-panel';
  panel.innerHTML = `
    <div class="sigma-header">
      <div>
        <div class="sigma-title">Sigma AI Beta</div>
        <div class="sigma-sub">Model: gpt-5-nano</div>
      </div>
      <button class="sigma-send" data-close>✕</button>
    </div>
    <div class="sigma-body">
      <div class="sigma-messages" aria-live="polite"></div>
      <div class="sigma-input">
        <textarea rows="1" placeholder="Escribe tu pregunta... (Shift+Enter = salto de línea)"></textarea>
        <button class="sigma-send">Enviar</button>
      </div>
    </div>`;

  function toggle() {
    panel.classList.toggle('open');
  }
  fab.addEventListener('click', toggle);
  panel.querySelector('[data-close]').addEventListener('click', toggle);

  document.addEventListener('DOMContentLoaded', () => {
    document.body.appendChild(fab);
    document.body.appendChild(panel);
  });

  const messagesEl = panel.querySelector('.sigma-messages');
  const textarea = panel.querySelector('textarea');
  const sendBtn = panel.querySelector('.sigma-send:not([data-close])');

  const addMsg = (text, who) => {
    const div = document.createElement('div');
    div.className = `msg ${who}`;
    div.textContent = text;
    messagesEl.appendChild(div);
    messagesEl.scrollTop = messagesEl.scrollHeight;
    return div;
  };

  // historial de conversación para contexto
  const history = [];

  async function handlePrompt(p) {
    if (!p) return;
    textarea.value = "";
    addMsg(p, 'user');
    history.push({ role: "user", content: p });

    if (!(window.puter && puter.ai && typeof puter.ai.chat === 'function')) {
      addMsg('Sigma no está disponible ahora mismo. Revisa tu conexión e intenta de nuevo.', 'bot');
      return;
    }

    let botDiv = addMsg("...", 'bot'); // placeholder
    let acc = "";

    try {
      const response = await puter.ai.chat(history, { model: 'gpt-5-nano', stream: true });
      for await (const part of response) {
        if (part?.text) {
          acc += part.text;
          botDiv.textContent = acc;
          messagesEl.scrollTop = messagesEl.scrollHeight;
        }
      }
      history.push({ role: "assistant", content: acc });
    } catch (e) {
      botDiv.textContent = "⚠️ Error. Reintenta en unos segundos.";
      console.error(e);
    }
  }

  sendBtn.addEventListener('click', () => handlePrompt(textarea.value.trim()));
  textarea.addEventListener('keydown', (e) => {
    if (e.key === 'Enter' && !e.shiftKey) {
      e.preventDefault();
      sendBtn.click();
    }
  });
})();




/* --- streetwear.js --- */

// Register Plugins
gsap.registerPlugin(ScrollTrigger);

// --- PRELOADER & HERO ANIME.JS ---
const counterElement = document.querySelector('.counter');
const loaderProgress = document.querySelector('.loader-progress');
const preloader = document.querySelector('.preloader');

let count = 0;
const updateCounter = () => {
    if (!counterElement || !preloader) return;

    count++;
    counterElement.textContent = count;
    if (loaderProgress) loaderProgress.style.width = count + '%';

    if (count < 100) {
        setTimeout(updateCounter, 15);
    } else {
        // Anime.js Preloader Exit - Always hide preloader
        anime({
            targets: preloader,
            translateY: '-100%',
            easing: 'easeInOutExpo',
            duration: 1200,
            delay: 500,
            complete: () => {
                preloader.style.display = 'none'; // Ensure it's hidden
                startHeroAnime(); // Start hero animation if elements exist
            }
        });
    }
};

window.addEventListener('load', () => {
    updateCounter();
});

// --- HERO ANIMATION (ANIME.JS) ---
function startHeroAnime() {
    // Only animate if elements exist
    const heroLines = document.querySelectorAll('.hero-title .line');
    const heroFooter = document.querySelector('.hero-footer');

    if (heroLines.length > 0) {
        anime({
            targets: '.hero-title .line',
            translateY: [100, 0],
            opacity: [0, 1],
            skewY: [10, 0],
            easing: 'easeOutElastic(1, .6)',
            duration: 1800,
            delay: anime.stagger(150)
        });
    }

    if (heroFooter) {
        anime({
            targets: '.hero-footer',
            opacity: [0, 1],
            translateY: [20, 0],
            easing: 'easeOutExpo',
            duration: 1000,
            delay: 800
        });
    }
}

// --- PARALLAX (GSAP is best for scroll scrub) ---
gsap.to('.hero-bg img', {
    yPercent: 30,
    ease: 'none',
    scrollTrigger: {
        trigger: '.hero',
        start: 'top top',
        end: 'bottom top',
        scrub: true
    }
});

// --- CUSTOM CURSOR & MAGNETIC (ANIME.JS) ---
// Using pure Anime.js for smoother tick
const cursor = document.querySelector('.cursor');
const magneticBtns = document.querySelectorAll('.btn-ticket, .nav-link');

if (cursor && window.innerWidth > 992) {
    document.addEventListener('mousemove', (e) => {
        // Very fast easing for cursor
        anime({
            targets: cursor,
            translateX: e.clientX,
            translateY: e.clientY,
            easing: 'linear', // Immediate follow
            duration: 0
        });
    });

    // Magnetic Links
    magneticBtns.forEach(btn => {
        btn.addEventListener('mousemove', (e) => {
            const rect = btn.getBoundingClientRect();
            const x = e.clientX - rect.left - rect.width / 2;
            const y = e.clientY - rect.top - rect.height / 2;

            anime({
                targets: btn,
                translateX: x * 0.4,
                translateY: y * 0.4,
                easing: 'easeOutElastic(1, .5)',
                duration: 800
            });
        });

        btn.addEventListener('mouseleave', () => {
            anime({
                targets: btn,
                translateX: 0,
                translateY: 0,
                easing: 'easeOutElastic(1, .5)',
                duration: 600
            });
        });
    });

    // Scale on Hover
    document.querySelectorAll('a, button').forEach(el => {
        el.addEventListener('mouseenter', () => cursor.classList.add('hovered'));
        el.addEventListener('mouseleave', () => cursor.classList.remove('hovered'));
    });
}

// --- VISUAL REVEALS (ANIME.JS + INTERSECTION OBSERVER) ---
// We use IntersectionObserver to trigger Anime.js timelines

const observeAnime = (selector, animationOpts) => {
    const elements = document.querySelectorAll(selector);
    const observer = new IntersectionObserver((entries) => {
        entries.forEach(entry => {
            if (entry.isIntersecting) {
                // Play animation
                anime({
                    targets: entry.target,
                    ...animationOpts
                });
                observer.unobserve(entry.target); // Run once
            }
        });
    }, { threshold: 0.2 });

    elements.forEach(el => observer.observe(el));
};

// 1. Narrative Text
observeAnime('.narrative-text', {
    translateY: [50, 0],
    opacity: [0, 1],
    easing: 'easeOutExpo',
    duration: 1500
});

// 2. Info Panels (Staggered Children if any, or just self)
observeAnime('.event-info', {
    translateX: [-50, 0],
    opacity: [0, 1],
    easing: 'easeOutExpo',
    duration: 1200
});

// 3. Grid Items (Stagger) - Complex case, observe wrapper
const grid = document.querySelector('.archive-grid');
if (grid) {
    const gridObserver = new IntersectionObserver((entries) => {
        entries.forEach(entry => {
            if (entry.isIntersecting) {
                anime({
                    targets: '.archive-item',
                    translateY: [100, 0],
                    opacity: [0, 1],
                    easing: 'easeOutExpo',
                    delay: anime.stagger(150),
                    duration: 1200
                });
                gridObserver.unobserve(entry.target);
            }
        });
    }, { threshold: 0.1 });
    gridObserver.observe(grid);
}

// --- TEXT SCRAMBLE (Vanilla + Anime helper) ---
const scrambleElements = document.querySelectorAll('[data-scramble]');
const letters = "ABCDEFGHIJKLMNOPQRSTUVWXYZ";

scrambleElements.forEach(el => {
    el.addEventListener('mouseenter', event => {
        const originalText = event.target.dataset.scramble || event.target.innerText;
        let iteration = 0;

        // Anime.js object for value tweening could be used, but setInterval is fine for raw text
        let interval = setInterval(() => {
            event.target.innerText = event.target.innerText
                .split("")
                .map((letter, index) => {
                    if (index < iteration) {
                        return originalText[index];
                    }
                    return letters[Math.floor(Math.random() * 26)]
                })
                .join("");

            if (iteration >= originalText.length) {
                clearInterval(interval);
            }
            iteration += 1 / 2;
        }, 30);
    });
});



