const canvas = document.getElementById('gameCanvas');
const ctx = canvas.getContext('2d');
const scoreEl = document.getElementById('score');
const bestScoreEl = document.getElementById('bestScore');
const restartBtn = document.getElementById('restartBtn');
const modeSelect = document.getElementById('modeSelect');
const speedSelect = document.getElementById('speedSelect');
const gridSelect = document.getElementById('gridSelect');
const themeSelect = document.getElementById('themeSelect');
const instructionsText = document.getElementById('instructionsText');
const touchHint = document.getElementById('touchHint');
const touchControls = document.getElementById('touchControls');

const STORAGE_KEY = 'snake-best-score';
const THEME_STORAGE_KEY = 'snake-theme';
const SWIPE_THRESHOLD = 28;
const supportsPointerEvents = window.PointerEvent !== undefined;
const isTouchDevice =
  window.matchMedia('(pointer: coarse)').matches ||
  'ontouchstart' in window ||
  navigator.maxTouchPoints > 0;

let snake = [];
let direction = { x: 1, y: 0 };
let nextDirection = { x: 1, y: 0 };
let food = { x: 0, y: 0 };
let score = 0;
let bestScore = Number(localStorage.getItem(STORAGE_KEY)) || 0;
let frameId = null;
let lastStepTime = 0;
let isRunning = false;
let gameOver = false;
let mode = modeSelect.value;
let swipeStart = null;
let boardTiles = Number(gridSelect?.value) || 26;
let tileSize = canvas.width / boardTiles;
let movesPerSecond = Number(speedSelect?.value) || 10;

bestScoreEl.textContent = bestScore;
const savedTheme = localStorage.getItem(THEME_STORAGE_KEY);
if (savedTheme && themeSelect) {
  themeSelect.value = savedTheme;
}
applyTheme(themeSelect?.value || savedTheme || 'neon');

window.addEventListener('resize', syncCanvasSize);

if (isTouchDevice) {
  activateTouchMode();
}

if (speedSelect) {
  speedSelect.addEventListener('change', () => {
    movesPerSecond = Number(speedSelect.value);
    startGame();
  });
}

if (gridSelect) {
  gridSelect.addEventListener('change', () => {
    boardTiles = Number(gridSelect.value);
    syncCanvasSize();
    startGame();
  });
}

if (themeSelect) {
  themeSelect.addEventListener('change', () => {
    applyTheme(themeSelect.value);
  });
}

function startGame() {
  syncCanvasSize();
  snake = [
    { x: Math.floor(boardTiles / 2) + 1, y: Math.floor(boardTiles / 2) },
    { x: Math.floor(boardTiles / 2), y: Math.floor(boardTiles / 2) }
  ];
  direction = { x: 1, y: 0 };
  nextDirection = { x: 1, y: 0 };
  score = 0;
  updateScore();
  placeFood();
  gameOver = false;
  isRunning = true;
  lastStepTime = 0;

  if (frameId) {
    cancelAnimationFrame(frameId);
  }
  frameId = requestAnimationFrame(gameLoop);
}

function placeFood() {
  do {
    food = {
      x: Math.floor(Math.random() * boardTiles),
      y: Math.floor(Math.random() * boardTiles)
    };
  } while (snake.some(segment => segment.x === food.x && segment.y === food.y));
}

function updateScore() {
  scoreEl.textContent = score;
  if (score > bestScore) {
    bestScore = score;
    localStorage.setItem(STORAGE_KEY, bestScore);
    bestScoreEl.textContent = bestScore;
  }
}

function setDirection(x, y) {
  if (!isRunning) return;
  if (x === -direction.x && y === -direction.y) {
    return; // prevent reversing instantly
  }
  nextDirection = { x, y };
}

function setDirectionFromName(name) {
  switch (name) {
    case 'up':
      setDirection(0, -1);
      break;
    case 'down':
      setDirection(0, 1);
      break;
    case 'left':
      setDirection(-1, 0);
      break;
    case 'right':
      setDirection(1, 0);
      break;
    default:
      break;
  }
}

document.addEventListener('keydown', event => {
  const key = event.key.toLowerCase();
  const movementKeys = [
    'arrowup',
    'arrowdown',
    'arrowleft',
    'arrowright',
    'w',
    'a',
    's',
    'd',
    'z',
    'q'
  ];
  const isMovementKey = movementKeys.includes(key);
  const isRestartKey = key === ' ';

  if (isMovementKey || isRestartKey) {
    event.preventDefault();
  }

  switch (key) {
    case 'arrowup':
    case 'w':
    case 'z':
      setDirection(0, -1);
      break;
    case 'arrowdown':
    case 's':
      setDirection(0, 1);
      break;
    case 'arrowleft':
    case 'a':
    case 'q':
      setDirection(-1, 0);
      break;
    case 'arrowright':
    case 'd':
      setDirection(1, 0);
      break;
    default:
      break;
  }

  if (isRestartKey && gameOver) {
    startGame();
  }
});

restartBtn.addEventListener('click', startGame);
modeSelect.addEventListener('change', () => {
  mode = modeSelect.value;
  startGame();
});

function syncCanvasSize() {
  const ratio = window.devicePixelRatio || 1;
  const displayWidth = canvas.clientWidth || canvas.width;
  const displayHeight = canvas.clientHeight || canvas.width;
  const baseSize = Math.min(displayWidth || canvas.width, displayHeight || canvas.height);
  const targetSize = Math.round(baseSize * ratio);
  if (!targetSize) return;
  if (canvas.width !== targetSize || canvas.height !== targetSize) {
    canvas.width = targetSize;
    canvas.height = targetSize;
  }
  tileSize = canvas.width / boardTiles;
}

function applyTheme(theme) {
  const value = theme || 'neon';
  document.body.setAttribute('data-theme', value);
  if (themeSelect && themeSelect.value !== value) {
    themeSelect.value = value;
  }
  localStorage.setItem(THEME_STORAGE_KEY, value);
}

function activateTouchMode() {
  document.body.classList.add('is-touch');
  if (touchHint) {
    touchHint.textContent = '';
  }
  if (touchControls) {
    touchControls.setAttribute('aria-hidden', 'false');
    const buttons = touchControls.querySelectorAll('[data-direction]');
    buttons.forEach(button => {
      const triggerDirection = event => {
        event.preventDefault();
        const dir = event.currentTarget?.dataset.direction;
        if (dir) {
          setDirectionFromName(dir);
        }
      };
      if (supportsPointerEvents) {
        button.addEventListener(
          'pointerdown',
          event => {
            if (event.pointerType === 'mouse') return;
            triggerDirection(event);
          },
          { passive: false }
        );
      } else {
        button.addEventListener('touchstart', triggerDirection, { passive: false });
      }
      button.addEventListener('click', triggerDirection);
    });
  }

  const beginSwipe = (pointX, pointY) => {
    swipeStart = { x: pointX, y: pointY };
  };

  const trackSwipe = (pointX, pointY, event) => {
    if (!swipeStart) return;
    const deltaX = pointX - swipeStart.x;
    const deltaY = pointY - swipeStart.y;
    const absX = Math.abs(deltaX);
    const absY = Math.abs(deltaY);

    if (absX < SWIPE_THRESHOLD && absY < SWIPE_THRESHOLD) {
      return;
    }

    event.preventDefault();

    if (absX > absY) {
      setDirection(deltaX > 0 ? 1 : -1, 0);
    } else {
      setDirection(0, deltaY > 0 ? 1 : -1);
    }

    swipeStart = null;
  };

  const endSwipe = () => {
    swipeStart = null;
  };

  if (supportsPointerEvents) {
    canvas.addEventListener(
      'pointerdown',
      event => {
        if (event.pointerType === 'mouse') return;
        beginSwipe(event.clientX, event.clientY);
      },
      { passive: true }
    );
    canvas.addEventListener(
      'pointermove',
      event => {
        if (event.pointerType === 'mouse') return;
        trackSwipe(event.clientX, event.clientY, event);
      },
      { passive: false }
    );
    canvas.addEventListener(
      'pointerup',
      event => {
        if (event.pointerType === 'mouse') return;
        endSwipe();
      },
      { passive: true }
    );
    canvas.addEventListener(
      'pointercancel',
      event => {
        if (event.pointerType === 'mouse') return;
        endSwipe();
      },
      { passive: true }
    );
  } else {
    canvas.addEventListener(
      'touchstart',
      event => {
        if (event.touches.length > 0) {
          beginSwipe(event.touches[0].clientX, event.touches[0].clientY);
        }
      },
      { passive: true }
    );
    canvas.addEventListener(
      'touchmove',
      event => {
        if (event.touches.length === 0) return;
        trackSwipe(event.touches[0].clientX, event.touches[0].clientY, event);
      },
      { passive: false }
    );
    canvas.addEventListener('touchend', endSwipe, { passive: true });
    canvas.addEventListener('touchcancel', endSwipe, { passive: true });
  }
}

function gameLoop(timestamp) {
  if (!isRunning) return;

  frameId = requestAnimationFrame(gameLoop);

  if (timestamp - lastStepTime < 1000 / movesPerSecond) {
    draw();
    return;
  }

  lastStepTime = timestamp;
  step();
  draw();
}

function step() {
  direction = nextDirection;
  let head = { x: snake[0].x + direction.x, y: snake[0].y + direction.y };

  if (mode === 'portal') {
    head = {
      x: wrapCoordinate(head.x),
      y: wrapCoordinate(head.y)
    };
  } else if (hitsWall(head)) {
    endGame();
    return;
  }

  if (hitsSelf(head)) {
    endGame();
    return;
  }

  snake.unshift(head);

  if (head.x === food.x && head.y === food.y) {
    score += 1;
    updateScore();
    placeFood();
  } else {
    snake.pop();
  }
}

function hitsWall(pos) {
  return pos.x < 0 || pos.y < 0 || pos.x >= boardTiles || pos.y >= boardTiles;
}

function hitsSelf(pos) {
  return snake.some(segment => segment.x === pos.x && segment.y === pos.y);
}

function wrapCoordinate(value) {
  if (value < 0) return boardTiles - 1;
  if (value >= boardTiles) return 0;
  return value;
}

function endGame() {
  isRunning = false;
  gameOver = true;
}

function draw() {
  drawBoard();
  drawFood();
  drawSnake();

  if (gameOver) {
    ctx.fillStyle = 'rgba(5, 6, 10, 0.65)';
    ctx.fillRect(0, 0, canvas.width, canvas.height);
    ctx.fillStyle = '#ffffff';
    ctx.font = 'bold 26px "Inter", sans-serif';
    ctx.textAlign = 'center';
    ctx.fillText('Game Over', canvas.width / 2, canvas.height / 2 - 10);
    ctx.font = '16px "Inter", sans-serif';
    ctx.fillText('Clique sur Rejouer ou espace pour repartir', canvas.width / 2, canvas.height / 2 + 20);
  }
}

function drawBoard() {
  const gradient = ctx.createLinearGradient(0, 0, canvas.width, canvas.height);
  gradient.addColorStop(0, '#050911');
  gradient.addColorStop(1, '#0d1b2a');
  ctx.fillStyle = gradient;
  ctx.fillRect(0, 0, canvas.width, canvas.height);

  ctx.strokeStyle = 'rgba(255, 255, 255, 0.03)';
  for (let i = 0; i <= boardTiles; i++) {
    const linePos = i * tileSize;
    ctx.beginPath();
    ctx.moveTo(linePos, 0);
    ctx.lineTo(linePos, canvas.height);
    ctx.stroke();

    ctx.beginPath();
    ctx.moveTo(0, linePos);
    ctx.lineTo(canvas.width, linePos);
    ctx.stroke();
  }
}

function drawSnake() {
  snake.forEach((segment, index) => {
    const intensity = index / snake.length;
    ctx.fillStyle = `hsl(${120 - intensity * 60}, 90%, 55%)`;
    ctx.shadowBlur = index === 0 ? 20 : 0;
    ctx.shadowColor = '#3eff8a';
    const padding = Math.max(tileSize * 0.1, 2);
    const radius = Math.min(8, (tileSize - padding) / 2);
    roundedRect(
      segment.x * tileSize + padding / 2,
      segment.y * tileSize + padding / 2,
      tileSize - padding,
      tileSize - padding,
      radius
    );
    ctx.fill();
    ctx.shadowBlur = 0;
  });
}

function drawFood() {
  const emoji = '🧸';
  const fontSize = tileSize * 0.75;
  ctx.save();
  ctx.font = `bold ${fontSize}px "Apple Color Emoji", "Noto Color Emoji", system-ui`;
  ctx.textAlign = 'center';
  ctx.textBaseline = 'middle';
  ctx.shadowColor = '#ff4f7a';
  ctx.shadowBlur = 15;
  ctx.fillText(
    emoji,
    food.x * tileSize + tileSize / 2,
    food.y * tileSize + tileSize / 2
  );
  ctx.restore();
}

function roundedRect(x, y, width, height, radius) {
  ctx.beginPath();
  ctx.moveTo(x + radius, y);
  ctx.lineTo(x + width - radius, y);
  ctx.quadraticCurveTo(x + width, y, x + width, y + radius);
  ctx.lineTo(x + width, y + height - radius);
  ctx.quadraticCurveTo(x + width, y + height, x + width - radius, y + height);
  ctx.lineTo(x + radius, y + height);
  ctx.quadraticCurveTo(x, y + height, x, y + height - radius);
  ctx.lineTo(x, y + radius);
  ctx.quadraticCurveTo(x, y, x + radius, y);
  ctx.closePath();
}

startGame();
