const THEMES = ["ciencia", "tecnologia", "filosofia", "historia", "literatura", "artes", "economia", "livros"];
const DIFFICULTIES = ["easy", "medium", "hard"];
const SKILLS = ["explicit", "implicit", "main_idea", "vocabulary", "inference", "cause_effect", "author_purpose", "compare_contrast", "fact_opinion", "evaluate"];

function pickAdaptive(texts, progress) {
  if (texts.length === 0) return null;

  const scores = progress.scores || {};
  const completedIds = progress.completedTexts || [];
  const skillAccuracy = progress.skillAccuracy || {};

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

  // Find weakest skills
  const weakSkills = findWeakSkills(skillAccuracy);

  const candidates = texts.filter((tx) => {
    const diffOk = tx.difficulty === targetDifficulty;
    const themeOk = leastDoneThemes.includes(tx.theme);
    return diffOk && themeOk;
  });

  if (candidates.length === 0) {
    const diffCandidates = texts.filter((tx) => tx.difficulty === targetDifficulty);
    if (diffCandidates.length > 0) {
      return pickBySkillAffinity(diffCandidates, weakSkills);
    }
  }

  if (candidates.length === 0) {
    return texts[Math.floor(Math.random() * texts.length)];
  }

  return pickBySkillAffinity(candidates, weakSkills);
}

function findWeakSkills(skillAccuracy) {
  const skillRatios = {};
  SKILLS.forEach((skill) => {
    const data = skillAccuracy[skill];
    if (data && data.total > 0) {
      skillRatios[skill] = data.correct / data.total;
    } else {
      skillRatios[skill] = 0.5;
    }
  });

  const sorted = Object.entries(skillRatios).sort((a, b) => a[1] - b[1]);
  return sorted.slice(0, 3).map((e) => e[0]);
}

function pickBySkillAffinity(candidates, weakSkills) {
  if (candidates.length === 0) return null;
  if (weakSkills.length === 0) {
    return candidates[Math.floor(Math.random() * candidates.length)];
  }

  const scored = candidates.map((tx) => {
    const textSkills = (tx.questions || []).map((q) => q.skill || 'unknown');
    let affinity = 0;
    weakSkills.forEach((ws) => {
      if (textSkills.includes(ws)) affinity++;
    });
    return { text: tx, affinity };
  });

  const maxAffinity = Math.max(...scored.map((s) => s.affinity));
  const best = scored.filter((s) => s.affinity === maxAffinity);
  return best[Math.floor(Math.random() * best.length)].text;
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
