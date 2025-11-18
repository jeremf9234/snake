const canvas = document.getElementById('gameCanvas');
const ctx = canvas.getContext('2d');
const scoreEl = document.getElementById('score');
const bestScoreEl = document.getElementById('bestScore');
const restartBtn = document.getElementById('restartBtn');
const modeSelect = document.getElementById('modeSelect');

const GRID_SIZE = 20;
const SPEED = 10; // moves per second
const STORAGE_KEY = 'snake-best-score';
const boardTiles = canvas.width / GRID_SIZE;

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

bestScoreEl.textContent = bestScore;

function startGame() {
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

function gameLoop(timestamp) {
  if (!isRunning) return;

  frameId = requestAnimationFrame(gameLoop);

  if (timestamp - lastStepTime < 1000 / SPEED) {
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
    ctx.beginPath();
    ctx.moveTo(i * GRID_SIZE, 0);
    ctx.lineTo(i * GRID_SIZE, canvas.height);
    ctx.stroke();

    ctx.beginPath();
    ctx.moveTo(0, i * GRID_SIZE);
    ctx.lineTo(canvas.width, i * GRID_SIZE);
    ctx.stroke();
  }
}

function drawSnake() {
  snake.forEach((segment, index) => {
    const intensity = index / snake.length;
    ctx.fillStyle = `hsl(${120 - intensity * 60}, 90%, 55%)`;
    ctx.shadowBlur = index === 0 ? 20 : 0;
    ctx.shadowColor = '#3eff8a';
    roundedRect(
      segment.x * GRID_SIZE,
      segment.y * GRID_SIZE,
      GRID_SIZE - 2,
      GRID_SIZE - 2,
      5
    );
    ctx.fill();
    ctx.shadowBlur = 0;
  });
}

function drawFood() {
  ctx.fillStyle = '#ff5f76';
  ctx.shadowBlur = 20;
  ctx.shadowColor = '#ff5f76';
  roundedRect(
    food.x * GRID_SIZE + 4,
    food.y * GRID_SIZE + 4,
    GRID_SIZE - 8,
    GRID_SIZE - 8,
    6
  );
  ctx.fill();
  ctx.shadowBlur = 0;
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
