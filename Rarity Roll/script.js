// Game Core Data State
let state = {
  rolls: 0,
  coins: 0,
  luckLevel: 1,
  luckCost: 15,
  autoSpeedLevel: 0,
  autoCost: 50,
  bountyLevel: 1,
  bountyCost: 100,
  critLevel: 0,
  critCost: 350,
  interestLevel: 0,
  interestCost: 750,
  isAutoRolling: false,
};

// 15 Balanced Rarity Progression Configuration Tiers
const rarities = [
  {
    id: "transcendent",
    name: "Transcendent",
    weight: 10000000000,
    coinsAwarded: 500000,
    class: "r-transcendent",
  },
  {
    id: "supernova",
    name: "☄️ Supernova",
    weight: 100000000,
    coinsAwarded: 25000,
    class: "r-supernova",
  },
  {
    id: "singularity",
    name: "🕳️ Singularity",
    weight: 10000000,
    coinsAwarded: 7500,
    class: "r-singularity",
  },
  {
    id: "infinity",
    name: "♾️ Infinity",
    weight: 1000000,
    coinsAwarded: 2000,
    class: "r-infinity",
  },
  {
    id: "chronos",
    name: "⏳ Chronos",
    weight: 250000,
    coinsAwarded: 750,
    class: "r-chronos",
  },
  {
    id: "glitched",
    name: "ERR_GLITCHED",
    weight: 50000,
    coinsAwarded: 300,
    class: "r-glitched",
  },
  {
    id: "void",
    name: "👁️ The Void",
    weight: 15000,
    coinsAwarded: 150,
    class: "r-void",
  },
  {
    id: "divine",
    name: "🔱 Divine",
    weight: 5000,
    coinsAwarded: 60,
    class: "r-divine",
  },
  {
    id: "celestial",
    name: "✨ Celestial",
    weight: 1500,
    coinsAwarded: 30,
    class: "r-celestial",
  },
  {
    id: "mythic",
    name: "Mythic",
    weight: 500,
    coinsAwarded: 15,
    class: "r-mythic",
  },
  {
    id: "legendary",
    name: "Legendary",
    weight: 150,
    coinsAwarded: 8,
    class: "r-legendary",
  },
  { id: "epic", name: "Epic", weight: 50, coinsAwarded: 4, class: "r-epic" },
  { id: "rare", name: "Rare", weight: 20, coinsAwarded: 2, class: "r-rare" },
  {
    id: "uncommon",
    name: "Uncommon",
    weight: 5,
    coinsAwarded: 1,
    class: "r-uncommon",
  },
  {
    id: "common",
    name: "Common",
    weight: 2,
    coinsAwarded: 1,
    class: "r-common",
  },
];

// Document Objects Hook
const rollCounter = document.getElementById("rollCounter");
const coinCounter = document.getElementById("coinCounter");
const rarityDisplay = document.getElementById("rarityDisplay");
const chanceDisplay = document.getElementById("chanceDisplay");
const indexGrid = document.getElementById("indexGrid");

// Initialize the 15-node Index Grid Layout dynamically (with visible percentages)
function buildIndexUI() {
  indexGrid.innerHTML = "";
  [...rarities].reverse().forEach((item) => {
    indexGrid.innerHTML += `
            <div class="index-node locked" id="idx-${item.id}">
                <span class="node-name ${item.class}">${item.name}</span>
                <span class="node-chance" style="opacity: 0.6; margin-top: 6px;">1 in ${item.weight.toLocaleString()}</span>
            </div>
        `;
  });
}

// Layout Toggles Setup
const shopModal = document.getElementById("shopModal");
const indexModal = document.getElementById("indexModal");

document
  .getElementById("openShopBtn")
  .addEventListener("click", () => (shopModal.style.display = "flex"));
document
  .getElementById("closeShopBtn")
  .addEventListener("click", () => (shopModal.style.display = "none"));
document
  .getElementById("openIndexBtn")
  .addEventListener("click", () => (indexModal.style.display = "flex"));
document
  .getElementById("closeIndexBtn")
  .addEventListener("click", () => (indexModal.style.display = "none"));

window.addEventListener("click", (e) => {
  if (e.target === shopModal) shopModal.style.display = "none";
  if (e.target === indexModal) indexModal.style.display = "none";
});

// --- Core Rolling Architecture Engine ---
let autoInterval = null;

function executeRoll() {

  state.rolls++;
  rollCounter.textContent = state.rolls;

  let rollTarget = Math.random();
  let selectedRarity = rarities[rarities.length - 1]; // Common fallback

  // Evaluate Critical Roll Multiplier Check
  let currentLuckModifier = state.luckLevel;
  let isCritical = false;
  if (state.critLevel > 0 && Math.random() <= state.critLevel * 0.05) {
    currentLuckModifier *= 10;
    isCritical = true;
  }

  for (let item of rarities) {
    let actualChance = 1 / (item.weight / currentLuckModifier);
    if (rollTarget <= actualChance) {
      selectedRarity = item;
      break;
    }
  }

  // Process Coin Multiplier Formula logic
  let coinReward = Math.ceil(
    selectedRarity.coinsAwarded * (1 + (state.bountyLevel - 1) * 0.5),
  );
  state.coins += coinReward;
  coinCounter.textContent = state.coins;

  // Display Text Refresh updates
  rarityDisplay.textContent = isCritical
    ? `💥 CRIT! ${selectedRarity.name}`
    : selectedRarity.name;
  rarityDisplay.className = `rarity-text ${selectedRarity.class}`;
  chanceDisplay.textContent = `1 in ${(selectedRarity.weight / currentLuckModifier).toLocaleString(undefined, { maximumFractionDigits: 1 })}`;

  const indexNode = document.getElementById(`idx-${selectedRarity.id}`);
  if (indexNode && indexNode.classList.contains("locked")) {
    indexNode.classList.remove("locked");
    indexNode.classList.add("unlocked");
  }
}

// --- Dynamic Auto Control Routine ---
function toggleAutoRoll() {
  if (state.autoSpeedLevel === 0) {
    alert("Unlock the Speed Roller in the upgrade menu first!");
    return;
  }
  state.isAutoRolling = !state.isAutoRolling;
  const btn = document.getElementById("autoToggleBtn");

  if (state.isAutoRolling) {
    btn.textContent = "AUTO: ON";
    btn.style.borderColor = "#4ade80";
    btn.style.color = "#4ade80";
    let speedInterval = Math.max(1000 - state.autoSpeedLevel * 200, 100);
    autoInterval = setInterval(executeRoll, speedInterval);
  } else {
    clearInterval(autoInterval);
    btn.textContent = "AUTO: OFF";
    btn.style.borderColor = "var(--border-color)";
    btn.style.color = "var(--text-main)";
  }
}

// --- Upgrades Implementation Logic Engine ---
function registerUpgrade(
  btnId,
  stateCostKey,
  stateLvlKey,
  costMultiplier,
  domLvlId,
  domCostId,
  callback,
) {
  document.getElementById(btnId).addEventListener("click", () => {
    if (state.coins >= state[stateCostKey]) {
      state.coins -= state[stateCostKey];
      state[stateLvlKey]++;
      state[stateCostKey] = Math.floor(state[stateCostKey] * costMultiplier);

      coinCounter.textContent = state.coins;
      document.getElementById(domLvlId).textContent = state[stateLvlKey];
      document.getElementById(domCostId).textContent = state[stateCostKey];
      if (callback) callback();
    } else {
      alert("Not enough coins!");
    }
  });
}

// Map the 5 specific upgrades systematically
registerUpgrade(
  "buyLuckBtn",
  "luckCost",
  "luckLevel",
  2.2,
  "luckLvl",
  "luckCost",
);
registerUpgrade(
  "buyAutoBtn",
  "autoCost",
  "autoSpeedLevel",
  2.8,
  "autoLvl",
  "autoCost",
  () => {
    if (state.isAutoRolling) {
      toggleAutoRoll();
      toggleAutoRoll();
    }
  },
);
registerUpgrade(
  "buyBountyBtn",
  "bountyCost",
  "bountyLevel",
  2.5,
  "bountyLvl",
  "bountyCost",
);
registerUpgrade(
  "buyCritBtn",
  "critCost",
  "critLevel",
  3.0,
  "critLvl",
  "critCost",
);
registerUpgrade(
  "buyInterestBtn",
  "interestCost",
  "interestLevel",
  3.2,
  "interestLvl",
  "interestCost",
);

// --- Passive Corporate Income Handler Interval ---
setInterval(() => {
  if (state.interestLevel > 0) {
    state.coins += state.interestLevel;
    coinCounter.textContent = state.coins;
  }
}, 2000);

document.getElementById("rollBtn").addEventListener("click", executeRoll);
document
  .getElementById("autoToggleBtn")
  .addEventListener("click", toggleAutoRoll);

// --- LOCAL STORAGE CORE ENGINE ---

// Function to save all current data to localStorage
function saveGame() {
  const unlockedNodes = [];
  rarities.forEach((item) => {
    const node = document.getElementById(`idx-${item.id}`);
    if (node && node.classList.contains("unlocked")) {
      unlockedNodes.push(item.id);
    }
  });

  const saveData = {
    state: state,
    unlockedNodes: unlockedNodes,
  };

  localStorage.setItem("justPlay_rarityRoll_save", JSON.stringify(saveData));
  console.log("Game progress auto-saved successfully!");
}

// Function to pull data from localStorage and restore the game session
function loadGame() {
  const rawData = localStorage.getItem("justPlay_rarityRoll_save");
  if (!rawData) {
    console.log("No previous save file found. Starting fresh!");
    return;
  }

  try {
    const savedData = JSON.parse(rawData);

    // 1. Restore the game state numbers
    state = savedData.state;
    state.isAutoRolling = false; // Keep auto-roll off on launch to reset clean intervals

    // 2. Push restored data values straight to your screen text fields
    rollCounter.textContent = state.rolls;
    coinCounter.textContent = state.coins;
    document.getElementById("luckLvl").textContent = state.luckLevel;
    document.getElementById("luckCost").textContent = state.luckCost;
    document.getElementById("autoLvl").textContent = state.autoSpeedLevel;
    document.getElementById("autoCost").textContent = state.autoCost;
    document.getElementById("bountyLvl").textContent = state.bountyLevel;
    document.getElementById("bountyCost").textContent = state.bountyCost;
    document.getElementById("critLvl").textContent = state.critLevel;
    document.getElementById("critCost").textContent = state.critCost;
    document.getElementById("interestLvl").textContent = state.interestLevel;
    document.getElementById("interestCost").textContent = state.interestCost;

    // 3. Restore unlocked Index Cards
    if (savedData.unlockedNodes && Array.isArray(savedData.unlockedNodes)) {
      savedData.unlockedNodes.forEach((nodeId) => {
        const node = document.getElementById(`idx-${nodeId}`);
        if (node) {
          node.classList.remove("locked");
          node.classList.add("unlocked");
        }
      });
    }

    console.log("Game progress successfully loaded!");
  } catch (error) {
    console.error("Error parsing save file data:", error);
  }
}

// --- INITIALIZE & START SYSTEM CORE RUNTIME ---
buildIndexUI();
loadGame();

// --- SAVING TRIGGERS & AUTOMATION CLOCKS ---

// Background Auto-Save Loop (Every 30 Seconds)
setInterval(() => {
  saveGame();
}, 30000);

// Instant Save: Clicking the Back to Home link
document.querySelector(".back-link").addEventListener("click", () => {
  saveGame();
});

// Instant Save: Page refresh, tab closure, or browser exiting
window.addEventListener("beforeunload", () => {
  saveGame();
});
