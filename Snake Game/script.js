document.addEventListener("DOMContentLoaded", () => {
  const canvas = document.getElementById("gameCanvas");
  const ctx = canvas.getContext("2d");

  // UI Interface Hooks
  const currentScoreDisplay = document.getElementById("currentScore");
  const highScoreDisplay = document.getElementById("highScore");
  const deathOverlay = document.getElementById("deathOverlay");
  const restartBtn = document.getElementById("restartBtn");

  // Matrix Engine Geometry Constants
  const gridSize = 20; // 20px blocks
  const tileCount = canvas.width / gridSize; // 20 tiles horizontal & vertical

  // Local Storage System Keys
  const storageKey = "justPlay_snakeCore_highScore";

  // Engine Core Variables
  let snake = [];
  let food = { x: 0, y: 0 };
  let velocity = { x: 0, y: 0 };
  let nextVelocity = { x: 0, y: 0 }; // Buffers inputs to prevent self-collision locks
  let score = 0;
  let gameLoopInterval = null;
  let isGameOver = false;

  // Load High Score Profile on Startup
  let savedHighScore = localStorage.getItem(storageKey) || 0;
  highScoreDisplay.textContent = formatScore(savedHighScore);

  // Initial Core Setup Launch
  initGame();

  function initGame() {
    // Build initial snake container centered on the grid matrices
    snake = [
      { x: 10, y: 10 },
      { x: 9, y: 10 },
      { x: 8, y: 10 },
    ];

    score = 0;
    currentScoreDisplay.textContent = formatScore(score);

    // Stationary until player makes the first vector change move
    velocity = { x: 0, y: 0 };
    nextVelocity = { x: 0, y: 0 };

    isGameOver = false;
    deathOverlay.style.display = "none";

    spawnFood();

    // Clear existing threads before booting execution cycles
    if (gameLoopInterval) clearInterval(gameLoopInterval);
    // Engine ticks every 100ms for crisp processing response balance
    gameLoopInterval = setInterval(update, 100);
  }

  function update() {
    if (isGameOver) return;

    // Applybuffered input direction change safely
    velocity = nextVelocity;

    // Don't move if velocity is completely zeroed out at spawn
    if (velocity.x === 0 && velocity.y === 0) {
      render();
      return;
    }

    // Calculate Next Head Coordinate Placement Vector Matrix
    const head = {
      x: snake[0].x + velocity.x,
      y: snake[0].y + velocity.y,
    };

    // Perimeter Boundaries Crash Detection Check
    if (
      head.x < 0 ||
      head.x >= tileCount ||
      head.y < 0 ||
      head.y >= tileCount
    ) {
      triggerCrashState();
      return;
    }

    // Self Body Cross Over Intersection Collision Check
    for (let i = 0; i < snake.length; i++) {
      if (snake[i].x === head.x && snake[i].y === head.y) {
        triggerCrashState();
        return;
      }
    }

    // Place new head into system registry tracking
    snake.unshift(head);

    // Target Food Collision Objective Matrix Check
    if (head.x === food.x && head.y === food.y) {
      score += 10;
      currentScoreDisplay.textContent = formatScore(score);

      // Check High Score Breaking Points Instantly
      if (score > savedHighScore) {
        savedHighScore = score;
        localStorage.setItem(storageKey, savedHighScore);
        highScoreDisplay.textContent = formatScore(savedHighScore);
      }

      spawnFood();
    } else {
      // Drop old tail entry index array pointer if no growth processed
      snake.pop();
    }

    render();
  }

  function render() {
    // Clear main workspace box canvas
    ctx.fillStyle = "#111317";
    ctx.fillRect(0, 0, canvas.width, canvas.height);

    // Render Food Target (High-Contrast Amber Core)
    ctx.fillStyle = "#f51010";
    ctx.fillRect(
      food.x * gridSize + 2,
      food.y * gridSize + 2,
      gridSize - 4,
      gridSize - 4,
    );

    // Render Snake Tail/Body Components Array
    snake.forEach((part, index) => {
      const isHead = index === 0;
      // Head gets clean solid color, body parts get a slight frame padding gap
      ctx.fillStyle = isHead ? "#58e990" : "#328150";
      ctx.fillRect(
        part.x * gridSize + (isHead ? 1 : 2),
        part.y * gridSize + (isHead ? 1 : 2),
        gridSize - (isHead ? 2 : 4),
        gridSize - (isHead ? 2 : 4),
      );
    });
  }

  function spawnFood() {
    let foodPlaced = false;
    while (!foodPlaced) {
      const rx = Math.floor(Math.random() * tileCount);
      const ry = Math.floor(Math.random() * tileCount);

      // Confirm food does not spawn directly inside snake body array coordinates
      const insideSnake = snake.some((part) => part.x === rx && part.y === ry);
      if (!insideSnake) {
        food.x = rx;
        food.y = ry;
        foodPlaced = true;
      }
    }
  }

  function triggerCrashState() {
    isGameOver = true;
    clearInterval(gameLoopInterval);
    deathOverlay.style.display = "flex";
  }

  function formatScore(num) {
    return num.toString().padStart(3, "0");
  }

  // --- KEYBOARD HARDWARE VECTOR LISTENER MATRIX ---
  window.addEventListener("keydown", (e) => {
    switch (e.key.toLowerCase()) {
      case "w":
      case "arrowup":
        if (velocity.y !== 1) nextVelocity = { x: 0, y: -1 };
        break;
      case "s":
      case "arrowdown":
        if (velocity.y !== -1) nextVelocity = { x: 0, y: 1 };
        break;
      case "a":
      case "arrowleft":
        if (velocity.x !== 1) nextVelocity = { x: -1, y: 0 };
        break;
      case "d":
      case "arrowright":
        if (velocity.x !== -1) nextVelocity = { x: 1, y: 0 };
        break;
    }
  });

  // Reset Interactive Hook
  restartBtn.addEventListener("click", initGame);
});
