let allTexts = [];

async function loadTexts() {
  const lang = getLang();
  try {
    const res = await fetch(`texts/${lang}.json`);
    allTexts = await res.json();
  } catch {
    allTexts = [];
  }
}

function getTexts() {
  return allTexts;
}

async function init() {
  initLang();

  const darkMode = localStorage.getItem("rfm_darkMode") === "true";
  if (darkMode) document.documentElement.classList.add("dark");

  const fontSize = localStorage.getItem("rfm_fontSize") || "normal";
  document.documentElement.setAttribute("data-font", fontSize);

  await loadTexts();

  if ("serviceWorker" in navigator) {
    navigator.serviceWorker.register("sw.js").catch(() => {});
  }

  initSync();

  updateNavLabels();
  showScreen("home");

  document.querySelectorAll(".nav-btn").forEach((btn) => {
    btn.addEventListener("click", async () => {
      const screen = btn.dataset.screen;
      if (screen === "home") {
        await loadTexts();
      }
      showScreen(screen);
    });
  });
}

function updateNavLabels() {
  document.querySelectorAll("[data-i18n]").forEach((el) => {
    el.textContent = t(el.dataset.i18n);
  });
}

document.addEventListener("DOMContentLoaded", init);
