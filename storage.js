const STORAGE_KEY = "rfm_progress";

function getDefaultProgress() {
  return {
    completedTexts: [],
    scores: {},
    currentStreak: 0,
    bestStreak: 0,
    lastReadDate: null,
    totalTextsRead: 0,
    totalCorrect: 0,
    totalQuestions: 0,
    themeAccuracy: {},
    difficultyAccuracy: {},
    skillAccuracy: {},
    settings: {
      language: "pt",
      fontSize: "normal",
      darkMode: false
    }
  };
}

function loadProgress() {
  try {
    const raw = localStorage.getItem(STORAGE_KEY);
    if (!raw) return getDefaultProgress();
    const data = JSON.parse(raw);
    return { ...getDefaultProgress(), ...data };
  } catch {
    return getDefaultProgress();
  }
}

function saveProgressLocal(progress) {
  localStorage.setItem(STORAGE_KEY, JSON.stringify(progress));
}

function saveProgress(progress) {
  saveProgressLocal(progress);
  if (typeof pushToCloud === "function") {
    pushToCloud();
  }
}

function recordScore(progress, textId, theme, difficulty, score, totalQuestions, skillData) {
  progress.totalTextsRead += 1;
  progress.totalCorrect += score;
  progress.totalQuestions += totalQuestions;

  if (!progress.completedTexts.includes(textId)) {
    progress.completedTexts.push(textId);
  }

  progress.scores[textId] = {
    score,
    total: totalQuestions,
    date: new Date().toISOString()
  };

  if (!progress.themeAccuracy[theme]) {
    progress.themeAccuracy[theme] = { correct: 0, total: 0 };
  }
  progress.themeAccuracy[theme].correct += score;
  progress.themeAccuracy[theme].total += totalQuestions;

  if (!progress.difficultyAccuracy[difficulty]) {
    progress.difficultyAccuracy[difficulty] = { correct: 0, total: 0 };
  }
  progress.difficultyAccuracy[difficulty].correct += score;
  progress.difficultyAccuracy[difficulty].total += totalQuestions;

  if (skillData) {
    Object.keys(skillData).forEach((skill) => {
      if (!progress.skillAccuracy[skill]) {
        progress.skillAccuracy[skill] = { correct: 0, total: 0 };
      }
      progress.skillAccuracy[skill].correct += skillData[skill].correct;
      progress.skillAccuracy[skill].total += skillData[skill].total;
    });
  }

  const today = new Date().toDateString();
  const lastRead = progress.lastReadDate;

  if (lastRead) {
    const lastDate = new Date(lastRead);
    const yesterday = new Date();
    yesterday.setDate(yesterday.getDate() - 1);

    if (lastDate.toDateString() === yesterday.toDateString()) {
      progress.currentStreak += 1;
    } else if (lastDate.toDateString() !== new Date().toDateString()) {
      progress.currentStreak = 1;
    }
  } else {
    progress.currentStreak = 1;
  }

  progress.lastReadDate = today;
  if (progress.currentStreak > progress.bestStreak) {
    progress.bestStreak = progress.currentStreak;
  }

  saveProgress(progress);
  return progress;
}

function resetProgress() {
  const def = getDefaultProgress();
  const lang = localStorage.getItem("rfm_lang") || "pt";
  const fontSize = localStorage.getItem("rfm_fontSize") || "normal";
  const darkMode = localStorage.getItem("rfm_darkMode") === "true";
  def.settings = { language: lang, fontSize, darkMode };
  saveProgress(def);
  return def;
}

function getCompletedTextIds(progress) {
  return progress.completedTexts || [];
}

function isTextCompleted(progress, textId) {
  return progress.completedTexts.includes(textId);
}
