// Game Core Data State (100% Pure Skill Tracking)
let state = {
  totalAttempts: 0,
  totalTimeAccumulated: 0,
  perfectRuns: 0,
  highScores: [], // Top 5 lowest millisecond scores
};

// System Timer Flags
let currentGameStage = "waiting";
let greenActivationTime = 0;
let earlyClickTimeoutId = null;

// DOM Hooks
const targetBox = document.getElementById("targetBox");
const boxText = document.getElementById("boxText");
const feedbackText = document.getElementById("feedbackText");
const attemptCounter = document.getElementById("attemptCounter");
const timeDisplay = document.getElementById("timeDisplay");
const scoreLeaderboard = document.getElementById("scoreLeaderboard");

// Diagnostic Overlay Hooks
const avgTimeDisplay = document.getElementById("avgTimeDisplay");
const perfectRunsDisplay = document.getElementById("perfectRunsDisplay");

// Modals Setup
const metricsModal = document.getElementById("metricsModal");
const scoresModal = document.getElementById("scoresModal");

document.getElementById("openMetricsBtn").addEventListener("click", () => {
  calculateAndRenderMetrics();
  metricsModal.style.display = "flex";
});
document
  .getElementById("closeMetricsBtn")
  .addEventListener("click", () => (metricsModal.style.display = "none"));

document.getElementById("openScoresBtn").addEventListener("click", () => {
  renderLeaderboard();
  scoresModal.style.display = "flex";
});
document
  .getElementById("closeScoresBtn")
  .addEventListener("click", () => (scoresModal.style.display = "none"));

window.addEventListener("click", (e) => {
  if (e.target === metricsModal) metricsModal.style.display = "none";
  if (e.target === scoresModal) scoresModal.style.display = "none";
});

// --- Core Game Engine States Mechanics ---
targetBox.addEventListener("click", handleBoxClick);

function handleBoxClick() {
  if (currentGameStage === "waiting" || currentGameStage === "result") {
    startTestSequence();
  } else if (currentGameStage === "red") {
    triggerEarlyClickPenalty();
  } else if (currentGameStage === "green") {
    processSuccessfulReaction();
  }
}

function startTestSequence() {
  currentGameStage = "red";
  targetBox.className = "reaction-box state-red";
  boxText.textContent = "WAIT FOR GREEN...";
  feedbackText.textContent = "Focus...";

  const randomDelay = Math.random() * 3000 + 2000;

  earlyClickTimeoutId = setTimeout(() => {
    currentGameStage = "green";
    targetBox.className = "reaction-box state-green";
    boxText.textContent = "CLICK!!!";
    greenActivationTime = window.performance.now();
  }, randomDelay);
}

function triggerEarlyClickPenalty() {
  clearTimeout(earlyClickTimeoutId);
  currentGameStage = "result";
  targetBox.className = "reaction-box state-waiting";
  boxText.textContent = "TOO EARLY!";
  feedbackText.textContent =
    "❌ Jumped the gun! Click box to restart countdown.";
}

function processSuccessfulReaction() {
  const clickTime = window.performance.now();
  currentGameStage = "result";

  // High-precision clean score calculation
  let finalScore = Math.floor(clickTime - greenActivationTime);
  if (finalScore < 1) finalScore = 1;

  timeDisplay.textContent = `${finalScore}ms`;
  targetBox.className = "reaction-box state-waiting";
  boxText.textContent = "CLICK TO RETRY";

  // Update Lifetime Tracking Calculations
  state.totalAttempts++;
  state.totalTimeAccumulated += finalScore;

  if (finalScore < 200) {
    state.perfectRuns++;
  }

  attemptCounter.textContent = state.totalAttempts;

  // Direct Feedback Messaging
  if (finalScore < 200) {
    feedbackText.textContent = `🚀 Incredible! Sub-200ms legendary speed: ${finalScore}ms!`;
  } else if (finalScore < 250) {
    feedbackText.textContent = `⚡ Solid reflex window: ${finalScore}ms!`;
  } else {
    feedbackText.textContent = `👍 Click completed in ${finalScore}ms. Keep practicing!`;
  }

  updateHighScores(finalScore);
  saveGame();
}

function updateHighScores(newScore) {
  state.highScores.push(newScore);
  state.highScores.sort((a, b) => a - b);
  if (state.highScores.length > 5) {
    state.highScores = state.highScores.slice(0, 5);
  }
}

function renderLeaderboard() {
  scoreLeaderboard.innerHTML = "";
  if (state.highScores.length === 0) {
    scoreLeaderboard.innerHTML = `<div style="text-align:center; color:var(--text-muted)">No records logged yet!</div>`;
    return;
  }
  state.highScores.forEach((score) => {
    scoreLeaderboard.innerHTML += `<li>${score}ms</li>`;
  });
}

function calculateAndRenderMetrics() {
  let average =
    state.totalAttempts > 0
      ? Math.round(state.totalTimeAccumulated / state.totalAttempts)
      : 0;
  avgTimeDisplay.textContent = average;
  perfectRunsDisplay.textContent = state.perfectRuns;
}

document.getElementById("clearScoresBtn").addEventListener("click", () => {
  if (
    confirm(
      "Are you sure you want to permanently clear all high scores and performance tracking metrics?",
    )
  ) {
    state.highScores = [];
    state.totalAttempts = 0;
    state.totalTimeAccumulated = 0;
    state.perfectRuns = 0;

    attemptCounter.textContent = 0;
    renderLeaderboard();
    calculateAndRenderMetrics();
    saveGame();
  }
});

// --- LOCAL STORAGE DATA PERSISTENCE ---
function saveGame() {
  localStorage.setItem("justPlay_pureReaction_save", JSON.stringify(state));
}

function loadGame() {
  const rawData = localStorage.getItem("justPlay_pureReaction_save");
  if (!rawData) return;

  try {
    state = JSON.parse(rawData);
    attemptCounter.textContent = state.totalAttempts;
  } catch (e) {
    console.error("Error unpacking save data profile:", e);
  }
}

loadGame();
window.addEventListener("beforeunload", saveGame);
