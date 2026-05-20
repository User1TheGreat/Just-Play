/**
 * QUANTUM BREAKER SYSTEM ENGINE
 * Pure Vanilla Canvas Implementation
 */

const canvas = document.getElementById("gameCanvas");
const ctx = canvas.getContext("2d");

// DOM Element Referencing
const scoreDisplay = document.getElementById("score-display");
const livesDisplay = document.getElementById("lives-display");
const modDisplay = document.getElementById("mod-display");
const startOverlay = document.getElementById("start-overlay");
const gameoverOverlay = document.getElementById("gameover-overlay");
const winOverlay = document.getElementById("win-overlay");

const startBtn = document.getElementById("start-btn");
const restartBtn = document.getElementById("restart-btn");
const winBtn = document.getElementById("win-btn");

const finalScore = document.getElementById("final-score");
const winScore = document.getElementById("win-score");

// Engine Runtime State Variables
let score = 0;
let lives = 3;
let currentModifier = "NONE"; // Options: NONE, MULTIBALL, LASER
let isPlaying = false;
let bricks = [];
let balls = [];
let particles = [];
let projectiles = [];
let modifierTimer = 0;

// Hardcoded System Geometries
const paddle = {
  x: canvas.width / 2 - 60,
  y: canvas.height - 30,
  width: 120,
  height: 12,
  speed: 10,
  targetX: canvas.width / 2 - 60,
};

const brickConfig = {
  rows: 5,
  cols: 8,
  width: 86,
  height: 20,
  padding: 10,
  offsetTop: 50,
  offsetLeft: 22,
};

// Hex Design Palette Maps
const colors = {
  emerald: "#00ffcc",
  voidBlack: "#080a0f",
  slate: "#9ca3af",
  laserPurple: "#a855f7",
  gold: "#eab308",
};

/* ==========================================================================
   INITIALIZATION & INTERFACE HANDLERS
   ========================================================================== */
function initGame() {
  score = 0;
  lives = 3;
  currentModifier = "NONE";
  bricks = [];
  balls = [];
  particles = [];
  projectiles = [];

  updateHUD();
  generateGrid();
  spawnBall(canvas.width / 2, paddle.y - 10, 4, -4);

  // Reset and hide all overlay interfaces
  startOverlay.classList.add("hidden");
  gameoverOverlay.classList.add("hidden");
  winOverlay.classList.add("hidden");
  isPlaying = true;

  animate();
}

// Fired when all boards are cleared cleanly
function triggerWin() {
  isPlaying = false;
  winScore.textContent = score;
  winOverlay.classList.remove("hidden");
}

function endGame() {
  isPlaying = false;
  finalScore.textContent = score;
  gameoverOverlay.classList.remove("hidden");
}

function generateGrid() {
  for (let r = 0; r < brickConfig.rows; r++) {
    bricks[r] = [];
    for (let c = 0; c < brickConfig.cols; c++) {
      const hasPayload = Math.random() < 0.15;
      bricks[r][c] = {
        x: 0,
        y: 0,
        status: 1,
        hp: brickConfig.rows - r,
        payload: hasPayload
          ? Math.random() > 0.5
            ? "MULTIBALL"
            : "LASER"
          : "NONE",
      };
    }
  }
}

function spawnBall(x, y, dx, dy) {
  balls.push({ x, y, radius: 6, dx, dy, speedScale: 1 });
}

function spawnParticles(x, y, color) {
  for (let i = 0; i < 8; i++) {
    particles.push({
      x,
      y,
      dx: (Math.random() - 0.5) * 6,
      dy: (Math.random() - 0.5) * 6,
      radius: Math.random() * 3 + 1,
      alpha: 1,
      color: color,
    });
  }
}

// Checks if any blocks are left standing on the field map
function checkWinCondition() {
  for (let r = 0; r < brickConfig.rows; r++) {
    for (let c = 0; c < brickConfig.cols; c++) {
      if (bricks[r][c].status === 1) {
        return false; // Found a block still alive
      }
    }
  }
  return true; // No blocks found with status 1
}

/* ==========================================================================
   INPUT EVENT TRACKERS
   ========================================================================== */
window.addEventListener("mousemove", (e) => {
  const rect = canvas.getBoundingClientRect();
  const relativeX = e.clientX - rect.left;
  if (relativeX > 0 && relativeX < canvas.width) {
    paddle.targetX = relativeX - paddle.width / 2;
  }
});

// Primary Activation Event Anchors
startBtn.addEventListener("click", initGame);
restartBtn.addEventListener("click", initGame);
winBtn.addEventListener("click", initGame);

/* ==========================================================================
   MATHEMATICAL COLLISION ENGINE & STATE LOOPS
   ========================================================================== */
function updatePhysics() {
  paddle.x += (paddle.targetX - paddle.x) * 0.25;
  if (paddle.x < 0) paddle.x = 0;
  if (paddle.x + paddle.width > canvas.width)
    paddle.x = canvas.width - paddle.width;

  if (currentModifier !== "NONE") {
    modifierTimer--;
    if (modifierTimer <= 0) {
      currentModifier = "NONE";
      updateHUD();
    }
  }

  if (currentModifier === "LASER" && modifierTimer % 20 === 0) {
    projectiles.push({ x: paddle.x + 10, y: paddle.y, dy: -7 });
    projectiles.push({ x: paddle.x + paddle.width - 10, y: paddle.y, dy: -7 });
  }

  for (let i = projectiles.length - 1; i >= 0; i--) {
    let p = projectiles[i];
    p.y += p.dy;
    if (p.y < 0) {
      projectiles.splice(i, 1);
      continue;
    }

    let hitDetected = false;
    for (let r = 0; r < brickConfig.rows; r++) {
      for (let c = 0; c < brickConfig.cols; c++) {
        let b = bricks[r][c];
        if (b && b.status === 1) {
          if (
            p.x > b.x &&
            p.x < b.x + brickConfig.width &&
            p.y > b.y &&
            p.y < b.y + brickConfig.height
          ) {
            b.hp--;
            if (b.hp <= 0) {
              b.status = 0;
              score += 50;
              spawnParticles(
                b.x + brickConfig.width / 2,
                b.y + brickConfig.height / 2,
                colors.emerald,
              );
              triggerModifier(b.payload);

              if (checkWinCondition()) {
                triggerWin();
                return;
              }
            }
            hitDetected = true;
            break;
          }
        }
      }
      if (hitDetected) break;
    }
    if (hitDetected) projectiles.splice(i, 1);
  }

  for (let i = balls.length - 1; i >= 0; i--) {
    let ball = balls[i];
    ball.x += ball.dx;
    ball.y += ball.dy;

    if (ball.x + ball.radius > canvas.width || ball.x - ball.radius < 0)
      ball.dx = -ball.dx;
    if (ball.y - ball.radius < 0) ball.dy = -ball.dy;

    if (
      ball.y + ball.radius >= paddle.y &&
      ball.y - ball.radius <= paddle.y + paddle.height
    ) {
      if (ball.x >= paddle.x && ball.x <= paddle.x + paddle.width) {
        let strikePoint =
          (ball.x - (paddle.x + paddle.width / 2)) / (paddle.width / 2);
        let totalSpeed = Math.sqrt(ball.dx * ball.dx + ball.dy * ball.dy);
        ball.dx = strikePoint * 5;
        ball.dy = -Math.sqrt(
          Math.abs(totalSpeed * totalSpeed - ball.dx * ball.dx),
        );
        ball.y = paddle.y - ball.radius;
      }
    }

    for (let r = 0; r < brickConfig.rows; r++) {
      for (let c = 0; c < brickConfig.cols; c++) {
        let b = bricks[r][c];
        if (b && b.status === 1) {
          if (
            ball.x + ball.radius > b.x &&
            ball.x - ball.radius < b.x + brickConfig.width &&
            ball.y + ball.radius > b.y &&
            ball.y - ball.radius < b.y + brickConfig.height
          ) {
            ball.dy = -ball.dy;
            b.hp--;

            if (b.hp <= 0) {
              b.status = 0;
              score += 100;
              spawnParticles(
                b.x + brickConfig.width / 2,
                b.y + brickConfig.height / 2,
                colors.emerald,
              );
              triggerModifier(b.payload);

              if (checkWinCondition()) {
                triggerWin();
                return;
              }
            } else {
              score += 20;
              spawnParticles(ball.x, ball.y, colors.slate);
            }
            updateHUD();
          }
        }
      }
    }

    if (ball.y > canvas.height) {
      balls.splice(i, 1);
      if (balls.length === 0) {
        lives--;
        updateHUD();
        if (lives <= 0) {
          endGame();
        } else {
          currentModifier = "NONE";
          updateHUD();
          spawnBall(canvas.width / 2, paddle.y - 10, 4, -4);
        }
      }
    }
  }

  for (let i = particles.length - 1; i >= 0; i--) {
    let p = particles[i];
    p.x += p.dx;
    p.y += p.dy;
    p.alpha -= 0.02;
    if (p.alpha <= 0) particles.splice(i, 1);
  }
}

function triggerModifier(payload) {
  if (payload === "NONE") return;
  currentModifier = payload;
  modifierTimer = 400;

  if (payload === "MULTIBALL") {
    spawnBall(canvas.width / 2, paddle.y - 20, -3, -5);
    spawnBall(canvas.width / 2, paddle.y - 20, 3, -5);
  }
  updateHUD();
}

function updateHUD() {
  scoreDisplay.textContent = String(score).padStart(4, "0");
  livesDisplay.textContent = "|".repeat(Math.max(0, lives));
  modDisplay.textContent = currentModifier;
  modDisplay.className = `hud-value ${currentModifier === "NONE" ? "mod-none" : ""}`;
}

/* ==========================================================================
   SCREEN VECTOR RENDERING MATRIX ENGINE
   ========================================================================== */
function draw() {
  ctx.clearRect(0, 0, canvas.width, canvas.height);

  for (let r = 0; r < brickConfig.rows; r++) {
    for (let c = 0; c < brickConfig.cols; c++) {
      let b = bricks[r][c];
      if (b && b.status === 1) {
        b.x =
          c * (brickConfig.width + brickConfig.padding) +
          brickConfig.offsetLeft;
        b.y =
          r * (brickConfig.height + brickConfig.padding) +
          brickConfig.offsetTop;

        let alpha = 0.3 + (b.hp / brickConfig.rows) * 0.7;
        ctx.fillStyle =
          b.payload !== "NONE" ? colors.gold : `rgba(0, 255, 204, ${alpha})`;
        ctx.strokeStyle = b.payload !== "NONE" ? colors.gold : colors.emerald;
        ctx.lineWidth = b.payload !== "NONE" ? 2 : 1;

        ctx.fillRect(b.x, b.y, brickConfig.width, brickConfig.height);
        ctx.strokeRect(b.x, b.y, brickConfig.width, brickConfig.height);
      }
    }
  }

  ctx.fillStyle =
    currentModifier === "LASER" ? colors.laserPurple : colors.emerald;
  ctx.shadowBlur = 15;
  ctx.shadowColor =
    currentModifier === "LASER" ? colors.laserPurple : colors.emerald;
  ctx.fillRect(paddle.x, paddle.y, paddle.width, paddle.height);
  ctx.shadowBlur = 0;

  ctx.fillStyle = "#ffffff";
  balls.forEach((ball) => {
    ctx.beginPath();
    ctx.arc(ball.x, ball.y, ball.radius, 0, Math.PI * 2);
    ctx.fill();
    ctx.closePath();
  });

  ctx.fillStyle = colors.laserPurple;
  projectiles.forEach((p) => {
    ctx.fillRect(p.x, p.y, 3, 12);
  });

  particles.forEach((p) => {
    ctx.save();
    ctx.globalAlpha = p.alpha;
    ctx.fillStyle = p.color;
    ctx.beginPath();
    ctx.arc(p.x, p.y, p.radius, 0, Math.PI * 2);
    ctx.fill();
    ctx.restore();
  });
}

/* ==========================================================================
   PRIMARY EXECUTION AND TIMING SYNC LOOP
   ========================================================================== */
function animate() {
  if (!isPlaying) return;
  updatePhysics();
  draw();
  requestAnimationFrame(animate);
}
