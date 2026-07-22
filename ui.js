const screens = {
  home: renderHome,
  select: renderSelect,
  reading: renderReading,
  quiz: renderQuiz,
  results: renderResults,
  stats: renderStats,
  settings: renderSettings
};

let currentScreen = "home";

function showScreen(name, data) {
  currentScreen = name;
  const app = document.getElementById("app");
  app.innerHTML = "";
  app.classList.add("fade-in");
  setTimeout(() => app.classList.remove("fade-in"), 300);

  if (screens[name]) {
    screens[name](app, data);
  }
  updateNav(name);
}

function updateNav(name) {
  document.querySelectorAll(".nav-btn").forEach((btn) => {
    btn.classList.toggle("active", btn.dataset.screen === name);
  });
}

function renderHome(container) {
  const progress = loadProgress();
  const texts = getTexts();
  const totalAvailable = texts.length;
  const completed = progress.totalTextsRead;
  const accuracy = progress.totalQuestions > 0
    ? Math.round((progress.totalCorrect / progress.totalQuestions) * 100)
    : 0;
  const streak = progress.currentStreak || 0;

  container.innerHTML = `
    <div class="screen home-screen">
      <div class="home-header">
        <h1>${t("appTitle")}</h1>
        <p class="subtitle">${completed} ${t("texts")} ${t("completed").toLowerCase()}</p>
      </div>

      <div class="quick-stats">
        <div class="stat-card">
          <span class="stat-value">${accuracy}%</span>
          <span class="stat-label">${t("overallAccuracy")}</span>
        </div>
        <div class="stat-card">
          <span class="stat-value">${streak}</span>
          <span class="stat-label">${t("dayStreak")}</span>
        </div>
        <div class="stat-card">
          <span class="stat-value">${completed}</span>
          <span class="stat-label">${t("totalTexts")}</span>
        </div>
      </div>

      <div class="mode-section">
        <h2>${t("selectMode")}</h2>
        <div class="mode-cards">
          <button class="mode-card" data-mode="custom">
            <div class="mode-icon">&#9998;</div>
            <div class="mode-info">
              <span class="mode-title">${t("customMode")}</span>
              <span class="mode-desc">${t("customModeDesc")}</span>
            </div>
            <span class="mode-arrow">&#8250;</span>
          </button>
          <button class="mode-card" data-mode="adaptive">
            <div class="mode-icon">&#9881;</div>
            <div class="mode-info">
              <span class="mode-title">${t("adaptiveMode")}</span>
              <span class="mode-desc">${t("adaptiveModeDesc")}</span>
            </div>
            <span class="mode-arrow">&#8250;</span>
          </button>
          <button class="mode-card" data-mode="random">
            <div class="mode-icon">&#9861;</div>
            <div class="mode-info">
              <span class="mode-title">${t("randomMode")}</span>
              <span class="mode-desc">${t("randomModeDesc")}</span>
            </div>
            <span class="mode-arrow">&#8250;</span>
          </button>
        </div>
      </div>
    </div>
  `;

  container.querySelectorAll(".mode-card").forEach((card) => {
    card.addEventListener("click", () => {
      showScreen("select", { mode: card.dataset.mode });
    });
  });
}

function renderSelect(container, data) {
  const mode = data.mode;
  const texts = getTexts();

  let html = `<div class="screen select-screen">
    <button class="back-btn" id="backBtn">&#8249; ${t("home")}</button>
    <h2>${t("selectMode")}: <span class="highlight">${t(mode + "Mode")}</span></h2>`;

  if (mode === "custom") {
    const themes = [...new Set(texts.map((tx) => tx.theme))];
    const difficulties = [...new Set(texts.map((tx) => tx.difficulty))];

    html += `
      <div class="select-section">
        <h3>${t("selectTheme")}</h3>
        <div class="chip-group" id="themeChips">
          <button class="chip active" data-value="all">${t("allThemes")}</button>
          ${themes.map((th) => `<button class="chip" data-value="${th}">${t("themes." + th)}</button>`).join("")}
        </div>
      </div>
      <div class="select-section">
        <h3>${t("selectDifficulty")}</h3>
        <div class="chip-group" id="diffChips">
          <button class="chip active" data-value="all">${t("allDifficulties")}</button>
          ${DIFFICULTIES.filter((d) => difficulties.includes(d)).map((d) => `<button class="chip" data-value="${d}">${t(d)}</button>`).join("")}
        </div>
      </div>
      <button class="btn-primary" id="startBtn">${t("startReading")}</button>
    `;
  } else {
    html += `<p class="info-text">${mode === "adaptive" ? t("adaptiveModeDesc") : t("randomModeDesc")}</p>
      <button class="btn-primary" id="startBtn">${t("startReading")}</button>`;
  }

  html += `</div>`;
  container.innerHTML = html;

  document.getElementById("backBtn").addEventListener("click", () => showScreen("home"));

  container.querySelectorAll(".chip-group").forEach((group) => {
    group.addEventListener("click", (e) => {
      if (e.target.classList.contains("chip")) {
        group.querySelectorAll(".chip").forEach((c) => c.classList.remove("active"));
        e.target.classList.add("active");
      }
    });
  });

  document.getElementById("startBtn").addEventListener("click", () => {
    let text;
    if (mode === "custom") {
      const selectedTheme = container.querySelector("#themeChips .chip.active")?.dataset.value || "all";
      const selectedDiff = container.querySelector("#diffChips .chip.active")?.dataset.value || "all";
      const filtered = filterTexts(texts, selectedTheme, selectedDiff);
      if (filtered.length === 0) {
        alert(t("noTextsAvailable"));
        return;
      }
      text = filtered[Math.floor(Math.random() * filtered.length)];
    } else if (mode === "adaptive") {
      const progress = loadProgress();
      text = pickAdaptive(texts, progress);
    } else {
      text = pickRandom(texts);
    }

    if (!text) {
      alert(t("noTextsAvailable"));
      return;
    }
    showScreen("reading", { text });
  });
}

function renderReading(container, data) {
  const { text } = data;
  const fontSize = localStorage.getItem("rfm_fontSize") || "normal";

  container.innerHTML = `
    <div class="screen reading-screen">
      <div class="reading-header">
        <button class="back-btn" id="backBtn">&#8249; ${t("home")}</button>
        <div class="reading-meta">
          <span class="badge">${t("themes." + text.theme)}</span>
          <span class="badge badge-diff badge-${text.difficulty}">${t(text.difficulty)}</span>
        </div>
      </div>
      <article class="text-content font-${fontSize}">
        <h2>${text.title}</h2>
        ${text.content.split("\n\n").map((p) => `<p>${p}</p>`).join("")}
        <p class="source">${t("source")}: ${text.source}</p>
      </article>
      <button class="btn-primary btn-fixed" id="startQuizBtn">${t("questions")} (${text.questions.length})</button>
    </div>
  `;

  document.getElementById("backBtn").addEventListener("click", () => showScreen("home"));
  document.getElementById("startQuizBtn").addEventListener("click", () => {
    startQuiz(text);
    showScreen("quiz");
  });
}

function renderQuiz(container) {
  const quiz = getQuiz();
  if (!quiz) { showScreen("home"); return; }

  const progress = getQuizProgress();
  const q = quiz.questions[quiz.currentQuestion];

  container.innerHTML = `
    <div class="screen quiz-screen">
      <div class="quiz-header">
        <span class="quiz-progress">${t("question")} ${progress.current + 1} ${t("of")} ${progress.total}</span>
        <div class="progress-bar">
          <div class="progress-fill" style="width: ${((progress.current) / progress.total) * 100}%"></div>
        </div>
      </div>
      <div class="quiz-body">
        <p class="question-text">${q.question}</p>
        <div class="options" id="options">
          ${q.options.map((opt, i) => `
            <button class="option-btn" data-index="${i}">
              <span class="option-letter">${String.fromCharCode(65 + i)}</span>
              <span class="option-text">${opt}</span>
            </button>
          `).join("")}
        </div>
      </div>
    </div>
  `;

  container.querySelectorAll(".option-btn").forEach((btn) => {
    btn.addEventListener("click", () => {
      const idx = parseInt(btn.dataset.index);
      const result = answerQuestion(idx);

      container.querySelectorAll(".option-btn").forEach((b) => {
        b.disabled = true;
        const bIdx = parseInt(b.dataset.index);
        if (bIdx === q.correct) b.classList.add("correct");
        if (bIdx === idx && !result.isCorrect) b.classList.add("wrong");
      });

      setTimeout(() => {
        if (isQuizFinished()) {
          const results = getQuizResults();
          let progress = loadProgress();
          const skillData = {};
          results.answers.forEach((ans) => {
            const skill = ans.skill || 'unknown';
            if (!skillData[skill]) {
              skillData[skill] = { correct: 0, total: 0 };
            }
            skillData[skill].total += 1;
            if (ans.isCorrect) {
              skillData[skill].correct += 1;
            }
          });
          progress = recordScore(progress, results.text.id, results.text.theme, results.text.difficulty, results.score, results.total, skillData);
          showScreen("results", { results, progress });
        } else {
          showScreen("quiz");
        }
      }, 800);
    });
  });
}

function renderResults(container, data) {
  const { results, progress } = data;
  const pct = results.percentage;
  const emoji = pct >= 80 ? "&#9733;" : pct >= 50 ? "&#9679;" : "&#9675;";
  clearQuiz();

  container.innerHTML = `
    <div class="screen results-screen">
      <div class="results-header">
        <div class="results-emoji">${emoji}</div>
        <h2>${t("results")}</h2>
      </div>
      <div class="results-card">
        <div class="score-circle ${pct >= 80 ? "score-great" : pct >= 50 ? "score-ok" : "score-low"}">
          <span class="score-number">${results.score}/${results.total}</span>
        </div>
        <div class="results-info">
          <p><strong>${results.text.title}</strong></p>
          <p>${t("themes." + results.text.theme)} &middot; ${t(results.text.difficulty)}</p>
        </div>
      </div>
      <div class="results-detail">
        <div class="detail-item">
          <span class="detail-value correct-color">${results.score}</span>
          <span class="detail-label">${t("correct")}</span>
        </div>
        <div class="detail-item">
          <span class="detail-value wrong-color">${results.total - results.score}</span>
          <span class="detail-label">${t("wrong")}</span>
        </div>
        <div class="detail-item">
          <span class="detail-value">${pct}%</span>
          <span class="detail-label">${t("overallAccuracy")}</span>
        </div>
      </div>
      <div class="results-actions">
        <button class="btn-primary" id="readAnotherBtn">${t("readAnother")}</button>
        <button class="btn-secondary" id="homeBtn">${t("backToHome")}</button>
      </div>
    </div>
  `;

  document.getElementById("readAnotherBtn").addEventListener("click", () => showScreen("select", { mode: "random" }));
  document.getElementById("homeBtn").addEventListener("click", () => showScreen("home"));
}

function renderStats(container) {
  const progress = loadProgress();
  const accuracy = progress.totalQuestions > 0
    ? Math.round((progress.totalCorrect / progress.totalQuestions) * 100)
    : 0;

  let themeHtml = "";
  for (const [theme, data] of Object.entries(progress.themeAccuracy || {})) {
    const pct = Math.round((data.correct / data.total) * 100);
    themeHtml += `
      <div class="bar-row">
        <span class="bar-label">${t("themes." + theme)}</span>
        <div class="bar-track"><div class="bar-fill" style="width: ${pct}%"></div></div>
        <span class="bar-value">${pct}%</span>
      </div>
    `;
  }

  let diffHtml = "";
  for (const [diff, data] of Object.entries(progress.difficultyAccuracy || {})) {
    const pct = Math.round((data.correct / data.total) * 100);
    diffHtml += `
      <div class="bar-row">
        <span class="bar-label">${t(diff)}</span>
        <div class="bar-track"><div class="bar-fill" style="width: ${pct}%"></div></div>
        <span class="bar-value">${pct}%</span>
      </div>
    `;
  }

  container.innerHTML = `
    <div class="screen stats-screen">
      <h2>${t("stats")}</h2>
      <div class="stats-grid">
        <div class="stat-card big">
          <span class="stat-value">${progress.totalTextsRead}</span>
          <span class="stat-label">${t("totalTexts")}</span>
        </div>
        <div class="stat-card big">
          <span class="stat-value">${accuracy}%</span>
          <span class="stat-label">${t("overallAccuracy")}</span>
        </div>
        <div class="stat-card">
          <span class="stat-value">${progress.currentStreak || 0}</span>
          <span class="stat-label">${t("currentStreak")}</span>
        </div>
        <div class="stat-card">
          <span class="stat-value">${progress.bestStreak || 0}</span>
          <span class="stat-label">${t("bestStreak")}</span>
        </div>
      </div>

      ${themeHtml ? `<div class="stats-section"><h3>${t("themeAccuracy")}</h3>${themeHtml}</div>` : ""}
      ${diffHtml ? `<div class="stats-section"><h3>${t("difficultyAccuracy")}</h3>${diffHtml}</div>` : ""}
      ${!themeHtml && !diffHtml ? `<p class="info-text">${t("noData")}</p>` : ""}
    </div>
  `;
}

function renderSettings(container) {
  const lang = getLang();
  const fontSize = localStorage.getItem("rfm_fontSize") || "normal";
  const darkMode = document.documentElement.classList.contains("dark");
  const syncCode = getSyncCode();
  const fbEnabled = isFirebaseEnabled();
  const online = navigator.onLine;

  let syncHtml = "";
  if (!fbEnabled) {
    syncHtml = `
      <div class="setting-section">
        <h3>${t("syncTitle")}</h3>
        <p class="info-text">${t("syncNotConfigured")}</p>
      </div>
    `;
  } else if (syncCode) {
    syncHtml = `
      <div class="setting-section">
        <h3>${t("syncTitle")}</h3>
        <div class="sync-status ${online ? "status-online" : "status-offline"}">
          <span class="status-dot"></span>
          ${online ? t("syncStatusOnline") : t("syncStatusOffline")}
        </div>
        <div class="sync-code-box">
          <label>${t("yourSyncCode")}</label>
          <div class="sync-code-row">
            <code class="sync-code">${syncCode}</code>
            <button class="btn-small" id="copyCodeBtn">${t("copyCode")}</button>
          </div>
          <p class="sync-hint">${t("syncCodeHint")}</p>
        </div>
        <button class="btn-secondary" id="unlinkBtn">${t("unlink")}</button>
      </div>
    `;
  } else {
    syncHtml = `
      <div class="setting-section">
        <h3>${t("syncTitle")}</h3>
        <p class="info-text">${t("syncDesc")}</p>
        <button class="btn-primary" id="createSyncBtn">${t("createSyncProfile")}</button>

        <div class="sync-divider"><span>ou</span></div>

        <label class="sync-label">${t("enterSyncCode")}</label>
        <div class="sync-input-row">
          <input type="text" id="syncCodeInput" placeholder="RFM-XXXXXX" maxlength="10" class="sync-input">
          <button class="btn-small" id="linkBtn">${t("link")}</button>
        </div>
      </div>
    `;
  }

  container.innerHTML = `
    <div class="screen settings-screen">
      <h2>${t("settings")}</h2>

      <div class="setting-section">
        <h3>${t("language")}</h3>
        <div class="chip-group" id="langChips">
          <button class="chip ${lang === "pt" ? "active" : ""}" data-value="pt">PT</button>
          <button class="chip ${lang === "en" ? "active" : ""}" data-value="en">EN</button>
        </div>
      </div>

      <div class="setting-section">
        <h3>${t("fontSize")}</h3>
        <div class="chip-group" id="fontChips">
          <button class="chip ${fontSize === "small" ? "active" : ""}" data-value="small">${t("small")}</button>
          <button class="chip ${fontSize === "normal" ? "active" : ""}" data-value="normal">${t("normal")}</button>
          <button class="chip ${fontSize === "large" ? "active" : ""}" data-value="large">${t("large")}</button>
        </div>
      </div>

      <div class="setting-section">
        <h3>${t("darkMode")}</h3>
        <label class="toggle">
          <input type="checkbox" id="darkToggle" ${darkMode ? "checked" : ""}>
          <span class="toggle-slider"></span>
        </label>
      </div>

      ${syncHtml}

      <div class="setting-section danger-zone">
        <h3>${t("resetProgress")}</h3>
        <button class="btn-danger" id="resetBtn">${t("resetProgress")}</button>
      </div>
    </div>
  `;

  document.getElementById("langChips").addEventListener("click", async (e) => {
    if (e.target.classList.contains("chip")) {
      const val = e.target.dataset.value;
      setLang(val);
      await loadTexts();
      updateNavLabels();
      showScreen("settings");
    }
  });

  document.getElementById("fontChips").addEventListener("click", (e) => {
    if (e.target.classList.contains("chip")) {
      const val = e.target.dataset.value;
      localStorage.setItem("rfm_fontSize", val);
      showScreen("settings");
    }
  });

  document.getElementById("darkToggle").addEventListener("change", (e) => {
    document.documentElement.classList.toggle("dark", e.target.checked);
    localStorage.setItem("rfm_darkMode", e.target.checked);
  });

  document.getElementById("resetBtn").addEventListener("click", () => {
    if (confirm(t("resetConfirm"))) {
      resetProgress();
      showScreen("home");
    }
  });

  const copyBtn = document.getElementById("copyCodeBtn");
  if (copyBtn) {
    copyBtn.addEventListener("click", () => {
      navigator.clipboard.writeText(syncCode).then(() => {
        copyBtn.textContent = t("copied");
        setTimeout(() => { copyBtn.textContent = t("copyCode"); }, 2000);
      });
    });
  }

  const unlinkBtn = document.getElementById("unlinkBtn");
  if (unlinkBtn) {
    unlinkBtn.addEventListener("click", () => {
      if (confirm(t("unlinkConfirm"))) {
        unlinkSyncProfile();
        showScreen("settings");
      }
    });
  }

  const createSyncBtn = document.getElementById("createSyncBtn");
  if (createSyncBtn) {
    createSyncBtn.addEventListener("click", async () => {
      createSyncBtn.disabled = true;
      createSyncBtn.textContent = "...";
      const result = await createSyncProfile();
      if (result.error) {
        alert(t("syncError") + ": " + result.error);
        createSyncBtn.disabled = false;
        createSyncBtn.textContent = t("createSyncProfile");
      } else {
        showScreen("settings");
      }
    });
  }

  const linkBtn = document.getElementById("linkBtn");
  if (linkBtn) {
    linkBtn.addEventListener("click", async () => {
      const code = document.getElementById("syncCodeInput").value.trim().toUpperCase();
      if (!code) return;
      linkBtn.disabled = true;
      linkBtn.textContent = "...";
      const result = await linkSyncProfile(code);
      if (result.error === "code_not_found") {
        alert(t("codeNotFound"));
        linkBtn.disabled = false;
        linkBtn.textContent = t("link");
      } else if (result.error) {
        alert(t("syncError") + ": " + result.error);
        linkBtn.disabled = false;
        linkBtn.textContent = t("link");
      } else {
        alert(t("linked"));
        showScreen("home");
      }
    });
  }
}
