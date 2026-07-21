let db = null;
let currentSyncCode = null;
let isSyncing = false;

function initSync() {
  if (!FIREBASE_ENABLED) return;

  try {
    firebase.initializeApp(firebaseConfig);
    db = firebase.firestore();
  } catch (e) {
    db = null;
  }

  currentSyncCode = localStorage.getItem("rfm_syncCode") || null;

  if (currentSyncCode) {
    pullFromCloud();
  }

  window.addEventListener("online", () => {
    if (currentSyncCode) pullFromCloud();
  });
}

function generateSyncCode() {
  const chars = "ABCDEFGHJKLMNPQRSTUVWXYZ23456789";
  let code = "RFM-";
  for (let i = 0; i < 6; i++) {
    code += chars[Math.floor(Math.random() * chars.length)];
  }
  return code;
}

async function createSyncProfile() {
  if (!FIREBASE_ENABLED || !db) {
    return { error: "firebase_not_configured" };
  }

  const code = generateSyncCode();
  const progress = loadProgress();

  try {
    await db.collection("progress").doc(code).set({
      progress: JSON.stringify(progress),
      updatedAt: firebase.firestore.FieldValue.serverTimestamp(),
      createdAt: firebase.firestore.FieldValue.serverTimestamp()
    });

    currentSyncCode = code;
    localStorage.setItem("rfm_syncCode", code);
    return { code };
  } catch (e) {
    return { error: e.message };
  }
}

async function linkSyncProfile(code) {
  if (!FIREBASE_ENABLED || !db) {
    return { error: "firebase_not_configured" };
  }

  try {
    const doc = await db.collection("progress").doc(code).get();

    if (!doc.exists) {
      return { error: "code_not_found" };
    }

    const cloudData = JSON.parse(doc.data().progress);
    const localProgress = loadProgress();
    const merged = mergeProgress(localProgress, cloudData);

    saveProgressLocal(merged);

    currentSyncCode = code;
    localStorage.setItem("rfm_syncCode", code);

    return { success: true, progress: merged };
  } catch (e) {
    return { error: e.message };
  }
}

async function pushToCloud() {
  if (!FIREBASE_ENABLED || !db || !currentSyncCode || isSyncing) return;

  isSyncing = true;
  const progress = loadProgress();

  try {
    await db.collection("progress").doc(currentSyncCode).set({
      progress: JSON.stringify(progress),
      updatedAt: firebase.firestore.FieldValue.serverTimestamp()
    });
  } catch (e) {
    // silent fail
  } finally {
    isSyncing = false;
  }
}

async function pullFromCloud() {
  if (!FIREBASE_ENABLED || !db || !currentSyncCode) return null;

  try {
    const doc = await db.collection("progress").doc(currentSyncCode).get();
    if (!doc.exists) return null;

    const cloudData = JSON.parse(doc.data().progress);
    const localProgress = loadProgress();
    const merged = mergeProgress(localProgress, cloudData);

    saveProgressLocal(merged);
    return merged;
  } catch (e) {
    return null;
  }
}

function mergeProgress(local, cloud) {
  if (!cloud) return local;
  if (!local || local.totalTextsRead === 0) return cloud;

  const merged = { ...getDefaultProgress() };

  const allTextIds = new Set([
    ...(local.completedTexts || []),
    ...(cloud.completedTexts || [])
  ]);
  merged.completedTexts = [...allTextIds];

  const allScores = { ...(cloud.scores || {}) };
  for (const [id, data] of Object.entries(local.scores || {})) {
    const cloudScore = allScores[id];
    if (!cloudScore || new Date(data.date) > new Date(cloudScore.date)) {
      allScores[id] = data;
    }
  }
  merged.scores = allScores;

  merged.totalTextsRead = merged.completedTexts.length;
  merged.totalCorrect = Object.values(allScores).reduce((sum, s) => sum + s.score, 0);
  merged.totalQuestions = Object.values(allScores).reduce((sum, s) => sum + s.total, 0);

  const themes = new Set([
    ...Object.keys(local.themeAccuracy || {}),
    ...Object.keys(cloud.themeAccuracy || {})
  ]);
  merged.themeAccuracy = {};
  for (const theme of themes) {
    const l = (local.themeAccuracy || {})[theme] || { correct: 0, total: 0 };
    const c = (cloud.themeAccuracy || {})[theme] || { correct: 0, total: 0 };
    merged.themeAccuracy[theme] = {
      correct: l.correct + c.correct,
      total: l.total + c.total
    };
  }

  const diffs = new Set([
    ...Object.keys(local.difficultyAccuracy || {}),
    ...Object.keys(cloud.difficultyAccuracy || {})
  ]);
  merged.difficultyAccuracy = {};
  for (const diff of diffs) {
    const l = (local.difficultyAccuracy || {})[diff] || { correct: 0, total: 0 };
    const c = (cloud.difficultyAccuracy || {})[diff] || { correct: 0, total: 0 };
    merged.difficultyAccuracy[diff] = {
      correct: l.correct + c.correct,
      total: l.total + c.total
    };
  }

  merged.bestStreak = Math.max(local.bestStreak || 0, cloud.bestStreak || 0);
  merged.currentStreak = Math.max(local.currentStreak || 0, cloud.currentStreak || 0);

  const localDate = local.lastReadDate ? new Date(local.lastReadDate) : new Date(0);
  const cloudDate = cloud.lastReadDate ? new Date(cloud.lastReadDate) : new Date(0);
  merged.lastReadDate = localDate > cloudDate ? local.lastReadDate : cloud.lastReadDate;

  return merged;
}

function getSyncCode() {
  return currentSyncCode;
}

function isFirebaseEnabled() {
  return FIREBASE_ENABLED;
}

function unlinkSyncProfile() {
  currentSyncCode = null;
  localStorage.removeItem("rfm_syncCode");
}
