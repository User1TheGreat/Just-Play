const canvas = document.getElementById("gameCanvas");
const ctx = canvas.getContext("2d");

// SYSTEM STATE HOOKS
let health = 100,
  bits = 150,
  wave = 1,
  isWaveActive = false;
let enemies = [],
  towers = [],
  projectiles = [];
let selectedTowerType = null,
  isHoldingGhost = false,
  mouseX = 0,
  mouseY = 0;
let currentActiveSlot = null,
  autoSaveTickerId = null;

const enemyPath = [
  { x: 0, y: 300 },
  { x: 250, y: 300 },
  { x: 250, y: 100 },
  { x: 550, y: 100 },
  { x: 550, y: 500 },
  { x: 800, y: 500 },
];

const TOWER_TYPES = {
  basic: { range: 120, fireRate: 30, color: "#a855f7", damage: 10, cost: 50 },
  fast: { range: 85, fireRate: 12, color: "#06b6d4", damage: 6, cost: 90 },
  sniper: { range: 250, fireRate: 60, color: "#eab308", damage: 35, cost: 140 },
  plasma: { range: 130, fireRate: 35, color: "#ec4899", damage: 20, cost: 200 },
  tesla: { range: 110, fireRate: 20, color: "#f97316", damage: 15, cost: 350 },
  frost: { range: 110, fireRate: 30, color: "#3b82f6", damage: 12, cost: 180 },
  void: { range: 140, fireRate: 45, color: "#10b981", damage: 50, cost: 500 },
};

const ENEMY_CONFIGS = [
  { color: "#ef4444", speed: 1.1, hpBase: 20, radius: 10, reward: 12 },
  { color: "#f43f5e", speed: 1.5, hpBase: 15, radius: 8, reward: 15 },
  { color: "#b91c1c", speed: 0.7, hpBase: 55, radius: 15, reward: 25 },
  { color: "#d946ef", speed: 1.2, hpBase: 30, radius: 11, reward: 20 },
  { color: "#6366f1", speed: 1.3, hpBase: 35, radius: 9, reward: 22 },
  { color: "#ff0055", speed: 0.5, hpBase: 180, radius: 20, reward: 100 },
];

// DATA STACK FRAMEWORK (LOCAL STORAGE)
const SaveSystem = {
  getKey(slot) {
    return `core_def_slot_${slot}`;
  },

  updateMenu() {
    for (let i = 1; i <= 3; i++) {
      const data = localStorage.getItem(this.getKey(i));
      const infoText = data
        ? `SLOT ${i} - WAVE ${JSON.parse(data).wave}`
        : `SLOT ${i}: EMPTY`;
      document.getElementById(`slot-${i}-info`).innerText = infoText;
    }
  },

  save() {
    if (!currentActiveSlot) return;
    const packedTowers = towers.map((t) => ({
      x: t.x,
      y: t.y,
      type: Object.keys(TOWER_TYPES).find(
        (k) => TOWER_TYPES[k].color === t.color,
      ),
    }));
    localStorage.setItem(
      this.getKey(currentActiveSlot),
      JSON.stringify({ health, bits, wave, towers: packedTowers }),
    );
  },

  load(slot) {
    const data = localStorage.getItem(this.getKey(slot));
    if (!data) {
      health = 100;
      bits = 150;
      wave = 1;
      towers = [];
    } else {
      const parsed = JSON.parse(data);
      health = parsed.health;
      bits = parsed.bits;
      wave = parsed.wave;
      towers = parsed.towers.map(
        (t) => new Tower(t.x, t.y, TOWER_TYPES[t.type]),
      );
    }
    this.refreshHUD();
    enemies = [];
    projectiles = [];
    isWaveActive = false;
    document.getElementById("start-wave-btn").disabled = false;
  },

  purgeDataSlot(slot) {
    localStorage.removeItem(this.getKey(slot));
    this.updateMenu();
  },

  refreshHUD() {
    document.getElementById("health-value").innerText = health;
    document.getElementById("bits-value").innerText = bits;
    document.getElementById("wave-value").innerText = wave;
  },
};

// SIMPLIFIED ACTOR CLASSES
class Enemy {
  constructor(waveNum, isBoss = false) {
    const type = isBoss ? ENEMY_CONFIGS[5] : ENEMY_CONFIGS[(waveNum - 1) % 5];
    this.x = enemyPath[0].x;
    this.y = enemyPath[0].y;
    this.color = type.color;
    this.radius = type.radius;
    this.reward = type.reward;
    this.speed = type.speed + waveNum * 0.02;
    this.hp = type.hpBase + waveNum * 10;
    this.maxHp = this.hp;
    this.waypoint = 0;
  }

  update() {
    if (this.waypoint >= enemyPath.length - 1) return;
    const targetNode = enemyPath[this.waypoint + 1];
    const dx = targetNode.x - this.x,
      dy = targetNode.y - this.y;
    const dist = Math.sqrt(dx * dx + dy * dy);

    if (dist < this.speed) {
      this.waypoint++;
      if (this.waypoint >= enemyPath.length - 1) {
        health = Math.max(0, health - (this.color === "#ff0055" ? 30 : 10));
        document.getElementById("health-value").innerText = health;
        this.hp = 0;
      }
    } else {
      this.x += (dx / dist) * this.speed;
      this.y += (dy / dist) * this.speed;
    }
  }

  draw() {
    ctx.shadowBlur = 10;
    ctx.shadowColor = this.color;
    ctx.fillStyle = this.color;
    ctx.beginPath();
    ctx.arc(this.x, this.y, this.radius, 0, Math.PI * 2);
    ctx.fill();
    ctx.shadowBlur = 0;

    ctx.fillStyle = "rgba(20, 20, 35, 0.8)";
    ctx.fillRect(this.x - 15, this.y - (this.radius + 8), 30, 4);
    ctx.fillStyle = "#f43f5e";
    ctx.fillRect(
      this.x - 15,
      this.y - (this.radius + 8),
      (this.hp / this.maxHp) * 30,
      4,
    );
  }
}

class Tower {
  constructor(x, y, cfg) {
    Object.assign(this, cfg);
    this.x = x;
    this.y = y;
    this.timer = 0;
    this.radius = 15;
  }

  update() {
    if (this.timer > 0) this.timer--;
    const target = enemies.find(
      (e) =>
        Math.getDistance(this.x, this.y, e.x, e.y) <= this.range && e.hp > 0,
    );
    if (target && this.timer === 0) {
      projectiles.push(
        new Projectile(this.x, this.y, target, this.color, this.damage),
      );
      this.timer = this.fireRate;
    }
  }

  draw() {
    ctx.shadowBlur = 12;
    ctx.shadowColor = this.color;
    ctx.fillStyle = this.color;
    ctx.beginPath();
    ctx.arc(this.x, this.y, this.radius, 0, Math.PI * 2);
    ctx.fill();
    ctx.shadowBlur = 0;
    ctx.fillStyle = "#020205";
    ctx.beginPath();
    ctx.arc(this.x, this.y, 5, 0, Math.PI * 2);
    ctx.fill();
  }
}

class Projectile {
  constructor(x, y, target, color, damage) {
    Object.assign(this, {
      x,
      y,
      target,
      color,
      damage,
      speed: 9,
      isDead: false,
    });
  }

  update() {
    if (this.target.hp <= 0) {
      this.isDead = true;
      return;
    }
    const dx = this.target.x - this.x,
      dy = this.target.y - this.y;
    const dist = Math.sqrt(dx * dx + dy * dy);

    if (dist < this.speed) {
      this.target.hp -= this.damage;
      if (this.target.hp <= 0) {
        bits += this.target.reward;
        document.getElementById("bits-value").innerText = bits;
      }
      this.isDead = true;
    } else {
      this.x += (dx / dist) * this.speed;
      this.y += (dy / dist) * this.speed;
    }
  }

  draw() {
    ctx.shadowBlur = 8;
    ctx.shadowColor = this.color;
    ctx.fillStyle = this.color;
    ctx.beginPath();
    ctx.arc(this.x, this.y, 4, 0, Math.PI * 2);
    ctx.fill();
    ctx.shadowBlur = 0;
  }
}

Math.getDistance = (x1, y1, x2, y2) =>
  Math.sqrt((x2 - x1) ** 2 + (y2 - y1) ** 2);

function gameLoop() {
  ctx.fillStyle = "#030308";
  ctx.fillRect(0, 0, canvas.width, canvas.height);

  ctx.strokeStyle = "#121224";
  ctx.lineWidth = 32;
  ctx.lineCap = ctx.lineJoin = "round";
  ctx.beginPath();
  ctx.moveTo(enemyPath[0].x, enemyPath[0].y);
  enemyPath.forEach((p) => ctx.lineTo(p.x, p.y));
  ctx.stroke();
  ctx.lineWidth = 1;

  towers.forEach((t) => {
    t.update();
    t.draw();
  });

  if (isHoldingGhost && selectedTowerType) {
    ctx.fillStyle = "rgba(168, 85, 247, 0.06)";
    ctx.strokeStyle = "rgba(168, 85, 247, 0.3)";
    ctx.beginPath();
    ctx.arc(
      mouseX,
      mouseY,
      TOWER_TYPES[selectedTowerType].range,
      0,
      Math.PI * 2,
    );
    ctx.fill();
    ctx.stroke();
    ctx.fillStyle = TOWER_TYPES[selectedTowerType].color;
    ctx.beginPath();
    ctx.arc(mouseX, mouseY, 15, 0, Math.PI * 2);
    ctx.fill();
  }

  projectiles = projectiles.filter((p) => {
    p.update();
    if (!p.isDead) p.draw();
    return !p.isDead;
  });
  enemies = enemies.filter((e) => {
    e.update();
    if (e.hp > 0) e.draw();
    return e.hp > 0;
  });

  if (isWaveActive && enemies.length === 0) {
    isWaveActive = false;
    wave++;
    document.getElementById("wave-value").innerText = wave;
    document.getElementById("start-wave-btn").disabled = false;
    SaveSystem.save();
  }
  requestAnimationFrame(gameLoop);
}

// INTERFACE CONTROL HOOKS
document.addEventListener("DOMContentLoaded", () => {
  SaveSystem.updateMenu();

  document.querySelectorAll(".load-slot-btn").forEach((b) =>
    b.addEventListener("click", (e) => {
      currentActiveSlot = parseInt(e.target.dataset.slot);
      SaveSystem.load(currentActiveSlot);
      document.getElementById("save-menu-overlay").classList.add("hidden");
      document.getElementById("game-container").classList.remove("hidden");
      autoSaveTickerId = setInterval(() => SaveSystem.save(), 20000);
    }),
  );

  document.querySelectorAll(".clear-slot-btn").forEach((b) =>
    b.addEventListener("click", (e) => {
      if (
        confirm(
          `Are you sure you want to clear Save Slot ${e.target.dataset.slot}?`,
        )
      ) {
        SaveSystem.purgeDataSlot(parseInt(e.target.dataset.slot));
      }
    }),
  );

  // Retracts runtime session components back to save panel selection smoothly
  document.getElementById("home-btn").addEventListener("click", () => {
    SaveSystem.save();
    clearInterval(autoSaveTickerId);
    currentActiveSlot = null;
    isHoldingGhost = false;
    selectedTowerType = null;
    SaveSystem.updateMenu();
    document.getElementById("game-container").classList.add("hidden");
    document.getElementById("save-menu-overlay").classList.remove("hidden");
  });

  document.querySelectorAll(".shop-btn").forEach((b) =>
    b.addEventListener("click", (e) => {
      if (isHoldingGhost) return;
      const type = b.getAttribute("data-tower");
      if (bits >= TOWER_TYPES[type].cost) {
        bits -= TOWER_TYPES[type].cost;
        document.getElementById("bits-value").innerText = bits;
        selectedTowerType = type;
        isHoldingGhost = true;
      } else alert("INSUFFICIENT DATA BITS!");
    }),
  );

  canvas.addEventListener("mousemove", (e) => {
    if (isHoldingGhost) {
      const bound = canvas.getBoundingClientRect();
      mouseX = e.clientX - bound.left;
      mouseY = e.clientY - bound.top;
    }
  });

  canvas.addEventListener("click", () => {
    if (isHoldingGhost) {
      towers.push(new Tower(mouseX, mouseY, TOWER_TYPES[selectedTowerType]));
      isHoldingGhost = false;
    }
  });

  canvas.addEventListener("contextmenu", (e) => {
    e.preventDefault();
    if (isHoldingGhost) {
      bits += TOWER_TYPES[selectedTowerType].cost;
      document.getElementById("bits-value").innerText = bits;
      isHoldingGhost = false;
    }
  });

  document.getElementById("start-wave-btn").addEventListener("click", (e) => {
    if (isWaveActive) return;
    isWaveActive = true;
    e.target.disabled = true;

    // --- FAIR BOSS WAVE CHECK (Every 5th Wave) ---
    if (wave % 5 === 0) {
      // Spawns exactly 1 boss, but its stats scale smoothly now
      enemies.push(new Enemy(wave, true));
    }
    // --- FAIR NORMAL WAVE CHECK ---
    else {
      let spawned = 0;

      // OLD CODE: targetCount = 4 + wave; (Grows way too fast!)
      // NEW BALANCED CODE: Starts at 4 enemies, adds 1 extra enemy every 3 waves.
      let targetCount = 4 + Math.floor(wave / 3);

      let spawnInterval = setInterval(() => {
        if (spawned < targetCount) {
          enemies.push(new Enemy(wave));
          spawned++;
        } else {
          clearInterval(spawnInterval);
        }
      }, 500); // Spawns an enemy every half-second
    }
  });
});

window.addEventListener("beforeunload", () => SaveSystem.save());
gameLoop();
