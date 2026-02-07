import { auth, database, ref, onValue, update, remove, onAuthStateChanged } from "./firebase-config.js";

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