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
