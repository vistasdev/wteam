document.getElementById('year').textContent = new Date().getFullYear();

// ---------- MOBILE MENU TOGGLE ----------
const menuToggle = document.getElementById('menu-toggle');
const mainNav = document.getElementById('main-nav');
if (menuToggle && mainNav) {
  menuToggle.addEventListener('click', () => {
    mainNav.classList.toggle('open');
  });
  mainNav.querySelectorAll('a').forEach(link => {
    link.addEventListener('click', () => mainNav.classList.remove('open'));
  });
}

// ---------- HEADER SCROLL STATE ----------
const siteHeader = document.querySelector('.site-header');
function updateHeaderScrollState() {
  if (window.scrollY > 8) {
    siteHeader.classList.add('scrolled');
  } else {
    siteHeader.classList.remove('scrolled');
  }
}
window.addEventListener('scroll', updateHeaderScrollState);
updateHeaderScrollState();

// ---------- TOASTS ----------
function showToast(message, type = 'default') {
  const container = document.getElementById('toast-container');
  const toast = document.createElement('div');
  toast.className = `toast ${type === 'error' ? 'error' : ''}`;
  toast.textContent = message;
  container.appendChild(toast);
  setTimeout(() => {
    toast.classList.add('toast-out');
    setTimeout(() => toast.remove(), 300);
  }, 3200);
}

// ---------- COPY IP ----------
document.getElementById('ip-copy-btn').addEventListener('click', async () => {
  const ip = document.getElementById('ip-code').textContent;
  try {
    await navigator.clipboard.writeText(ip);
    showToast("IP nusxalandi: " + ip);
  } catch (e) {
    showToast("Nusxalab bo'lmadi, qo'lda ko'chiring", 'error');
  }
});

// ---------- FORMAT DURATION ----------
function formatDuration(seconds) {
  const m = Math.floor(seconds / 60);
  const s = Math.floor(seconds % 60);
  return `${m}:${s.toString().padStart(2, '0')}`;
}

// ---------- SERVER STATUS ----------
let firstLoad = true;

async function fetchStatus() {
  try {
    const res = await fetch('/api/status');
    const data = await res.json();
    renderStatus(data);
  } catch (e) {
    renderOffline();
    if (firstLoad) showToast("Server bilan bog'lanib bo'lmadi", 'error');
  }
  firstLoad = false;
}

function renderStatus(data) {
  const heroStatus = document.getElementById('hero-status');
  const heroStatusText = document.getElementById('hero-status-text');
  const liveBadge = document.getElementById('live-badge');
  const onlineText = document.getElementById('server-online-text');

  if (!data.online) {
    renderOffline();
    return;
  }

  // Hero
  heroStatus.querySelector('.dot').className = 'dot dot-online';
  heroStatusText.textContent = `Server onlayn — ${data.players}/${data.max_players} o'yinchi`;

  // Server card
  liveBadge.classList.remove('offline');
  liveBadge.innerHTML = `<span class="live-dot"></span> JONLI`;
  document.getElementById('server-name').textContent = data.name || 'WEIT CS Server';
  document.getElementById('server-map').textContent = data.map || '—';
  onlineText.textContent = 'Onlayn';
  document.getElementById('slots-current').textContent = data.players;
  document.getElementById('slots-max').textContent = data.max_players;

  const pct = data.max_players ? Math.min(100, (data.players / data.max_players) * 100) : 0;
  document.getElementById('slots-bar-fill').style.width = pct + '%';

  renderPlayers(data.player_list || []);
}

function renderOffline() {
  const heroStatus = document.getElementById('hero-status');
  const heroStatusText = document.getElementById('hero-status-text');
  const liveBadge = document.getElementById('live-badge');
  const onlineText = document.getElementById('server-online-text');

  heroStatus.querySelector('.dot').className = 'dot dot-offline';
  heroStatusText.textContent = 'Server hozircha offlayn';

  liveBadge.classList.add('offline');
  liveBadge.innerHTML = `<span class="live-dot"></span> OFLAYN`;
  onlineText.textContent = 'Oflayn';
  document.getElementById('server-map').textContent = '—';
  document.getElementById('slots-current').textContent = '0';
  document.getElementById('slots-bar-fill').style.width = '0%';

  const tbody = document.getElementById('players-tbody');
  tbody.innerHTML = `<tr class="players-empty-row"><td colspan="4">Server oflayn — o'yinchilar ko'rinmayapti</td></tr>`;
}

function renderPlayers(players) {
  const tbody = document.getElementById('players-tbody');

  if (!players.length) {
    tbody.innerHTML = `<tr class="players-empty-row"><td colspan="4">Hozircha hech kim o'ynamayapti</td></tr>`;
    return;
  }

  tbody.innerHTML = players.map((p, i) => `
    <tr>
      <td class="player-rank">${i + 1}</td>
      <td class="player-name">${escapeHtml(p.name)}</td>
      <td class="player-score">${p.score}</td>
      <td class="player-time">${formatDuration(p.duration)}</td>
    </tr>
  `).join('');
}

function escapeHtml(str) {
  const div = document.createElement('div');
  div.textContent = str;
  return div.innerHTML;
}

fetchStatus();
setInterval(fetchStatus, 5000);

// ---------- STEAM CONNECT ----------
function handleSteamConnect(e) {
  const ip = "84.54.82.234:27047";
  let steamLikelyOpened = false;

  const onBlur = () => { steamLikelyOpened = true; };
  window.addEventListener('blur', onBlur);

  setTimeout(async () => {
    window.removeEventListener('blur', onBlur);
    if (!steamLikelyOpened) {
      // Steam ochilmadi — IP'ni nusxalab, xabar beramiz
      try {
        await navigator.clipboard.writeText(ip);
        showToast("Steam ochilmadi. IP nusxalandi — Steam > Play > Connect to server orqali kiriting", 'error');
      } catch (err) {
        showToast("Steam ochilmadi. Steam o'rnatilganligini tekshiring", 'error');
      }
    }
  }, 1500);
}

document.getElementById('nav-connect-btn').addEventListener('click', handleSteamConnect);
document.getElementById('hero-connect-btn').addEventListener('click', handleSteamConnect);