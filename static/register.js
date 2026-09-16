const stepForm = document.getElementById("fc-step-form");
const stepDone = document.getElementById("fc-step-done");
const errorBox = document.getElementById("fc-error");

const steamidInput = document.getElementById("fc-steamid");
const nickInput = document.getElementById("fc-nick");
const submitBtn = document.getElementById("fc-submit-btn");
const profileLink = document.getElementById("fc-profile-link");

function showError(msg) {
  errorBox.textContent = msg;
  errorBox.style.display = "block";
}

function hideError() {
  errorBox.style.display = "none";
}

submitBtn.addEventListener("click", async () => {
  hideError();
  const steamid = steamidInput.value.trim().toUpperCase();
  const nick = nickInput.value.trim();

  if (!/^STEAM_[0-5]:[01]:\d+$/.test(steamid)) {
    showError("SteamID formati noto'g'ri. Konsolda 'status' yozib to'g'ri formatda ko'chiring (masalan STEAM_0:1:12345678).");
    return;
  }
  if (nick.length < 2 || nick.length > 32) {
    showError("Nick 2-32 belgi orasida bo'lishi kerak.");
    return;
  }

  submitBtn.disabled = true;
  try {
    const res = await fetch("/api/register", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ steamid, nick }),
    });
    const data = await res.json();

    if (!data.ok) {
      showError(data.error || "Xatolik yuz berdi.");
      submitBtn.disabled = false;
      return;
    }

    stepForm.style.display = "none";
    stepDone.style.display = "block";
    profileLink.href = `/faceit?steamid=${encodeURIComponent(steamid)}`;
  } catch (e) {
    showError("Serverga ulanib bo'lmadi. Birozdan so'ng qayta urinib ko'ring.");
    submitBtn.disabled = false;
  }
});
