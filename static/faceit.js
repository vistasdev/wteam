const content = document.getElementById("fc-content");
const searchInput = document.getElementById("fc-search-input");

function getQueryParam(name) {
  const params = new URLSearchParams(window.location.search);
  return params.get(name);
}

function renderLoading() {
  content.innerHTML = `<div class="fc-loading"><i class="fa-solid fa-spinner fa-spin"></i> Yuklanmoqda...</div>`;
}

function renderNotFound() {
  content.innerHTML = `<div class="fc-notfound">O'yinchi topilmadi. SteamID to'g'riligini tekshiring yoki avval <a href="/register">ro'yxatdan o'ting</a>.</div>`;
}

function renderProfile(p) {
  const streakPct = Math.min((p.win_streak / 5) * 100, 100);

  content.innerHTML = `
    <div class="fc-profile-head">
      <div class="fc-level-badge">${p.level}</div>
      <div>
        <div class="fc-profile-nick">${escapeHtml(p.nick)}</div>
        <div class="fc-profile-rank">Reytingda #${p.rank} o'rin · ${p.exp} EXP</div>
      </div>
    </div>

    <div class="fc-streak-row">
      <div class="fc-streak-label">
        <span>Win Streak (levelgacha)</span>
        <span>${p.streak_progress}</span>
      </div>
      <div class="fc-streak-bar">
        <div class="fc-streak-fill" style="width: ${streakPct}%"></div>
      </div>
    </div>

    <div class="fc-stats-grid">
      <div class="fc-stat-box">
        <div class="fc-stat-value">${p.round_wins}</div>
        <div class="fc-stat-label">Round Win</div>
      </div>
      <div class="fc-stat-box">
        <div class="fc-stat-value">${p.round_losses}</div>
        <div class="fc-stat-label">Round Loss</div>
      </div>
      <div class="fc-stat-box">
        <div class="fc-stat-value">${p.winrate}%</div>
        <div class="fc-stat-label">Winrate</div>
      </div>
      <div class="fc-stat-box">
        <div class="fc-stat-value">${p.mvp_count}</div>
        <div class="fc-stat-label">MVP</div>
      </div>
    </div>
  `;
}

function escapeHtml(str) {
  const div = document.createElement("div");
  div.textContent = str;
  return div.innerHTML;
}

async function loadProfile(steamid) {
  renderLoading();
  try {
    const res = await fetch(`/api/player/${encodeURIComponent(steamid)}`);
    const data = await res.json();
    if (!data.ok) {
      renderNotFound();
      return;
    }
    renderProfile(data);
  } catch (e) {
    content.innerHTML = `<div class="fc-notfound">Ma'lumot olishda xatolik yuz berdi.</div>`;
  }
}

searchInput.addEventListener("keydown", (e) => {
  if (e.key === "Enter") {
    const steamid = searchInput.value.trim().toUpperCase();
    if (/^STEAM_[0-5]:[01]:\d+$/.test(steamid)) {
      loadProfile(steamid);
    }
  }
});

const initialSteamId = getQueryParam("steamid");
if (initialSteamId) {
  searchInput.value = initialSteamId;
  loadProfile(initialSteamId);
}
