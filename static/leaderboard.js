function escapeHtml(str) {
  const div = document.createElement("div");
  div.textContent = str;
  return div.innerHTML;
}

async function loadLeaderboard() {
  const content = document.getElementById("fc-lb-content");
  try {
    const res = await fetch("/api/top?limit=20");
    const data = await res.json();

    if (!data.ok || data.players.length === 0) {
      content.innerHTML = `<div class="fc-notfound">Hali hech kim ro'yxatda yo'q. Birinchi bo'ling! <a href="/register">Ro'yxatdan o'tish</a></div>`;
      return;
    }

    content.innerHTML = data.players
      .map((p, i) => {
        const rank = i + 1;
        return `
          <div class="fc-lb-row">
            <div class="fc-lb-rank ${rank <= 3 ? "top3" : ""}">#${rank}</div>
            <div class="fc-lb-nick">${escapeHtml(p.nick)}</div>
            <div class="fc-lb-level">LVL ${p.level}</div>
            <div class="fc-lb-exp">${p.exp} EXP</div>
          </div>
        `;
      })
      .join("");
  } catch (e) {
    content.innerHTML = `<div class="fc-notfound">Ma'lumot olishda xatolik.</div>`;
  }
}

loadLeaderboard();
