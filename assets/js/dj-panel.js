// DJ Panel Logic
import { auth, database, ref, get, onValue, update, remove, onAuthStateChanged } from './firebase-config.js';

const loadingEl = document.getElementById('loading');
const accessDeniedEl = document.getElementById('access-denied');
const statsBarEl = document.getElementById('stats-bar');
const requestsContainerEl = document.getElementById('requests-container');

if (loadingEl) { // Only run if elements exist
  onAuthStateChanged(auth, async (user) => {
    if (!user) {
      console.log('DJ Panel: No user logged in.');
      loadingEl.style.display = 'none';
      accessDeniedEl.style.display = 'block';
      return;
    }

    try {
      console.log('DJ Panel: Checking admin role for', user.uid);
      // Check if user is admin
      const userRef = ref(database, 'users/' + user.uid);
      const userSnapshot = await get(userRef);

      if (!userSnapshot.exists()) {
        console.error('DJ Panel: User profile not found.');
        throw new Error("User profile not found");
      }

      const userData = userSnapshot.val();
      if (userData.role !== 'administrador' && userData.role !== 'admin') {
        console.warn('DJ Panel: User is not admin.');
        loadingEl.style.display = 'none';
        accessDeniedEl.style.display = 'block';
        return;
      }

      // User is admin, show the panel
      console.log('DJ Panel: Access granted.');
      loadingEl.style.display = 'none';
      statsBarEl.style.display = 'flex';
      requestsContainerEl.style.display = 'block';

      // Listen for song requests
      const songRequestsRef = ref(database, 'song-requests/carnaval-2026');
      onValue(songRequestsRef, (snapshot) => {
        console.log('DJ Panel: Data received', snapshot.val());
        renderRequests(snapshot);
      }, (error) => {
        console.error('DJ Panel: Listener error', error);
        requestsContainerEl.innerHTML = `<p class="text-danger text-center">Error carregant dades: ${error.message}</p>`;
      });

    } catch (error) {
      console.error('DJ Panel Error:', error);
      loadingEl.style.display = 'none';
      accessDeniedEl.innerHTML = `<i class="bi bi-exclamation-triangle"></i><h3>Error</h3><p>${error.message}</p>`;
      accessDeniedEl.style.display = 'block';
    }
  });
}

const knownRequestIds = new Set();
let isFirstLoad = true;

function renderRequests(snapshot) {
  const container = document.getElementById('requests-container');
  
  if (!snapshot.exists()) {
    container.innerHTML = `
      <div class="empty-state">
        <i class="bi bi-music-note-beamed"></i>
        <h3>Esperant sol·licituds...</h3>
        <p>Comparteix l'enllaç perquè la gent demani cançons!</p>
      </div>
    `;
    updateStats(0, 0);
    return;
  }

  const requests = [];
  snapshot.forEach((child) => {
    requests.push({ id: child.key, ...child.val() });
  });

  // Sort: pending first, then by timestamp (newest first)
  requests.sort((a, b) => {
    if (a.status === 'pending' && b.status !== 'pending') return -1;
    if (a.status !== 'pending' && b.status === 'pending') return 1;
    // Both same status, sort by time desc
    return (b.timestamp || 0) - (a.timestamp || 0);
  });

  let pendingCount = 0;
  let playedCount = 0;

  // Clear container to rebuild (react-style would be better but this is vanilla)
  // To preserve animations, we might want to be smarter, but full re-render is safer for sorting
  container.innerHTML = '';

  requests.forEach((request) => {
    if (request.status === 'pending') pendingCount++;
    else playedCount++;

    const time = request.timestamp
      ? new Date(request.timestamp).toLocaleTimeString('ca-ES', { hour: '2-digit', minute: '2-digit' })
      : 'Ara';

    const isNew = !knownRequestIds.has(request.id) && !isFirstLoad;
    knownRequestIds.add(request.id);

    const card = document.createElement('div');
    card.className = `request-card ${request.status === 'played' ? 'played' : ''} ${isNew ? 'new' : ''}`;
    card.id = `req-${request.id}`;
    
    card.innerHTML = `
      <div class="request-info">
        <div class="song-name">${escapeHtml(request.songName)}</div>
        <div class="request-meta">
          <span><i class="bi bi-clock me-1"></i>${time}</span>
          ${request.userName && request.userName !== 'Anònim' ? `<span><i class="bi bi-person me-1"></i>${escapeHtml(request.userName)}</span>` : ''}
        </div>
      </div>
      <div class="request-actions">
        ${request.status !== 'played' ? `
          <button class="btn-action btn-played" onclick="window.markAsPlayed('${request.id}')">
            <i class="bi bi-check-lg"></i> Feta
          </button>
        ` : `
          <button class="btn-action" style="background: rgba(255,255,255,0.1); color: #aaa; cursor: default;">
            <i class="bi bi-check2-all"></i> Reproduïda
          </button>
        `}
        <button class="btn-action btn-delete" onclick="window.deleteRequest('${request.id}')" title="Eliminar">
          <i class="bi bi-trash"></i>
        </button>
      </div>
    `;
    container.appendChild(card);
  });

  updateStats(pendingCount, playedCount);
  isFirstLoad = false;
}

function updateStats(pending, played) {
  document.getElementById('pending-count').textContent = pending;
  document.getElementById('played-count').textContent = played;
  document.getElementById('total-count').textContent = pending + played;
}

function escapeHtml(text) {
  const div = document.createElement('div');
  div.textContent = text;
  return div.innerHTML;
}

// Expose functions to window so inline onclick handlers work
window.markAsPlayed = async function (requestId) {
  const requestRef = ref(database, `song-requests/carnaval-2026/${requestId}`);
  await update(requestRef, { status: 'played' });
};

window.deleteRequest = async function (requestId) {
  if (confirm('Eliminar aquesta sol·licitud?')) {
    const requestRef = ref(database, `song-requests/carnaval-2026/${requestId}`);
    await remove(requestRef);
  }
};
