const THEMES = ["ciencia", "tecnologia", "filosofia", "historia", "literatura", "artes", "economia", "livros"];
const DIFFICULTIES = ["easy", "medium", "hard"];

function pickAdaptive(texts, progress) {
  if (texts.length === 0) return null;

  const scores = progress.scores || {};
  const completedIds = progress.completedTexts || [];

  let targetDifficulty = "medium";
  let recentScores = [];

  const completed = completedIds.map((id) => scores[id]).filter(Boolean);
  completed.sort((a, b) => new Date(b.date) - new Date(a.date));
  recentScores = completed.slice(0, 5);

  if (recentScores.length > 0) {
    const avgRatio = recentScores.reduce((sum, s) => sum + s.score / s.total, 0) / recentScores.length;
    if (avgRatio >= 0.85) {
      targetDifficulty = "hard";
    } else if (avgRatio >= 0.6) {
      targetDifficulty = "medium";
    } else {
      targetDifficulty = "easy";
    }
  }

  const themeCounts = {};
  THEMES.forEach((th) => (themeCounts[th] = 0));
  completedIds.forEach((id) => {
    const text = texts.find((tx) => tx.id === id);
    if (text) themeCounts[text.theme] = (themeCounts[text.theme] || 0) + 1;
  });

  const minCount = Math.min(...Object.values(themeCounts));
  const leastDoneThemes = THEMES.filter((th) => themeCounts[th] === minCount);

  const candidates = texts.filter((tx) => {
    const diffOk = tx.difficulty === targetDifficulty;
    const themeOk = leastDoneThemes.includes(tx.theme);
    return diffOk && themeOk;
  });

  if (candidates.length === 0) {
    const diffCandidates = texts.filter((tx) => tx.difficulty === targetDifficulty);
    if (diffCandidates.length > 0) {
      return diffCandidates[Math.floor(Math.random() * diffCandidates.length)];
    }
  }

  if (candidates.length === 0) {
    return texts[Math.floor(Math.random() * texts.length)];
  }

  return candidates[Math.floor(Math.random() * candidates.length)];
}

function pickRandom(texts, progress) {
  if (texts.length === 0) return null;
  return texts[Math.floor(Math.random() * texts.length)];
}

function filterTexts(texts, theme, difficulty) {
  let filtered = texts;
  if (theme && theme !== "all") {
    filtered = filtered.filter((tx) => tx.theme === theme);
  }
  if (difficulty && difficulty !== "all") {
    filtered = filtered.filter((tx) => tx.difficulty === difficulty);
  }
  return filtered;
}

function countTextsByTheme(texts) {
  const counts = {};
  THEMES.forEach((th) => (counts[th] = 0));
  texts.forEach((tx) => {
    counts[tx.theme] = (counts[tx.theme] || 0) + 1;
  });
  return counts;
}

function countTextsByDifficulty(texts) {
  const counts = {};
  DIFFICULTIES.forEach((d) => (counts[d] = 0));
  texts.forEach((tx) => {
    counts[tx.difficulty] = (counts[tx.difficulty] || 0) + 1;
  });
  return counts;
}
