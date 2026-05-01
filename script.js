// ============================================================
//  Tic Tac Toe – Solo or Duo!
//  Structured with SOLID principles in mind:
//    S – each function has one job
//    O – easy to extend (add difficulty, themes, etc.)
//    L – game logic replaceable without breaking UI
//    I – UI helpers kept separate from game logic
//    D – functions talk to each other, not raw DOM directly
// ============================================================


// ─── Constants ───────────────────────────────────────────────

/** All winning index combinations on the 3×3 board */
const WIN_LINES = [
  [0, 1, 2], [3, 4, 5], [6, 7, 8], // rows
  [0, 3, 6], [1, 4, 7], [2, 5, 8], // cols
  [0, 4, 8], [2, 4, 6],             // diagonals
];

/** Computer move priority: center → corners → sides */
const PRIORITY = [4, 0, 2, 6, 8, 1, 3, 5, 7];

/** Computer "thinking" delay in milliseconds */
const CPU_DELAY_MS = 480;


// ─── State ───────────────────────────────────────────────────

let board = Array(9).fill('');   // '' | 'X' | 'O'
let currentPlayer = 'X';        // whose turn it is
let gameOver = false;            // true once win or draw
let mode = 'single';             // 'single' | 'two'
let thinking = false;            // true while CPU is deciding
let scores = { X: 0, O: 0, D: 0 };


// ─── DOM references ──────────────────────────────────────────

const boardEl    = document.getElementById('board');
const overlay    = document.getElementById('overlay');
const dotX       = document.getElementById('dotX');
const dotO       = document.getElementById('dotO');
const turnText   = document.getElementById('turnText');
const name1El    = document.getElementById('name1');
const name2El    = document.getElementById('name2');

/** Build the 9 cell elements once and store references */
const cells = [];

function buildBoard() {
  for (let i = 0; i < 9; i++) {
    const cell = document.createElement('div');
    cell.className = 'cell';
    cell.addEventListener('click', () => handleCellClick(i));
    boardEl.appendChild(cell);
    cells.push(cell);
  }
}


// ─── Name helpers ────────────────────────────────────────────

/** Returns display names for X and O */
function getNames() {
  const x = name1El.value.trim() || 'Player';
  const o = name2El.value.trim() || (mode === 'single' ? 'CPU' : 'Player 2');
  return { X: x, O: o };
}


// ─── Pure game logic (no DOM) ────────────────────────────────

/**
 * S: Single Responsibility – checks win/draw on any board state.
 * @param {string[]} b – array of 9 cells
 * @returns {{ winner: 'X'|'O'|'D', line: number[]|null } | null}
 */
function checkWinner(b) {
  for (const [a, bb, c] of WIN_LINES) {
    if (b[a] && b[a] === b[bb] && b[a] === b[c]) {
      return { winner: b[a], line: [a, bb, c] };
    }
  }
  if (b.every(cell => cell !== '')) return { winner: 'D', line: null };
  return null;
}

/**
 * Finds a move for `sym` that would immediately win.
 * @param {string[]} b
 * @param {string} sym – 'X' or 'O'
 * @returns {number} index or -1
 */
function findWinningMove(b, sym) {
  for (let i = 0; i < 9; i++) {
    if (!b[i]) {
      const test = [...b];
      test[i] = sym;
      if (checkWinner(test)?.winner === sym) return i;
    }
  }
  return -1;
}

/**
 * Finds a blocking move to prevent `sym` from winning.
 * @param {string[]} b
 * @param {string} sym – opponent's symbol
 * @returns {number} index or -1
 */
function findBlockingMove(b, sym) {
  return findWinningMove(b, sym); // same logic, different symbol
}

/**
 * Smart computer move: win → block → priority fallback.
 * @param {string[]} b
 * @returns {number} chosen cell index
 */
function getBestMove(b) {
  // 1. Try to win
  const win = findWinningMove(b, 'O');
  if (win >= 0) return win;

  // 2. Block player
  const block = findBlockingMove(b, 'X');
  if (block >= 0) return block;

  // 3. Best available by priority
  for (const idx of PRIORITY) {
    if (!b[idx]) return idx;
  }
}


// ─── UI rendering ─────────────────────────────────────────────

/**
 * I: Interface Segregation – renders board state to DOM only.
 */
function render() {
  cells.forEach((cell, i) => {
    const mark = board[i];
    cell.className = 'cell' + (mark ? ' taken ' + mark.toLowerCase() : '');
    cell.textContent = mark === 'X' ? '✕' : mark === 'O' ? '○' : '';
  });
  updateTurnIndicator();
  updateScoreDisplay();
}

/** Updates the turn dots and text label */
function updateTurnIndicator() {
  if (gameOver) return;
  const names = getNames();
  dotX.className = 'turn-dot' + (currentPlayer === 'X' ? ' x-turn' : '');
  dotO.className = 'turn-dot' + (currentPlayer === 'O' ? ' o-turn' : '');
  turnText.textContent = (currentPlayer === 'X' ? names.X : names.O) + "'s turn";
}

/** Updates all three score cards */
function updateScoreDisplay() {
  const names = getNames();
  document.getElementById('s1').textContent = scores.X;
  document.getElementById('s2').textContent = scores.O;
  document.getElementById('sd').textContent = scores.D;
  document.getElementById('s1label').textContent = names.X + ' (X)';
  document.getElementById('s2label').textContent = names.O + ' (O)';
}

/** Shows the end-of-game overlay message */
function showOverlay(message, type) {
  overlay.textContent = message;
  overlay.className = 'overlay show ' + type;
}

/** Hides the overlay */
function hideOverlay() {
  overlay.className = 'overlay';
  overlay.textContent = '';
}


// ─── Game flow ───────────────────────────────────────────────

/**
 * D: Dependency Inversion – orchestrates logic and UI without
 * either knowing about the other directly.
 * Places a mark, animates it, then checks for outcome.
 */
function placeMove(index, symbol) {
  board[index] = symbol;

  // Trigger pop animation
  cells[index].classList.add('pop');
  cells[index].addEventListener('animationend', () => {
    cells[index].classList.remove('pop');
  }, { once: true });

  render();

  const result = checkWinner(board);
  if (result) {
    endGame(result);
    return;
  }

  // Switch turn
  currentPlayer = currentPlayer === 'X' ? 'O' : 'X';
  updateTurnIndicator();

  // Trigger CPU move in single player mode
  if (mode === 'single' && currentPlayer === 'O' && !gameOver) {
    triggerComputerMove();
  }
}

/** Handles a human player clicking a cell */
function handleCellClick(index) {
  if (board[index] || gameOver || thinking) return;
  if (mode === 'single' && currentPlayer === 'O') return; // block during CPU turn

  placeMove(index, currentPlayer);
}

/** Waits briefly then makes the computer's move */
function triggerComputerMove() {
  thinking = true;
  setTimeout(() => {
    thinking = false;
    const idx = getBestMove(board);
    placeMove(idx, 'O');
  }, CPU_DELAY_MS);
}

/** Called when the game ends – updates scores and shows feedback */
function endGame(result) {
  gameOver = true;
  const names = getNames();

  if (result.winner === 'D') {
    scores.D++;
    turnText.textContent = "It's a draw!";
    showOverlay("Draw!", 'draw-msg');
  } else {
    scores[result.winner]++;
    result.line.forEach(i => cells[i].classList.add('win'));
    const winnerName = result.winner === 'X' ? names.X : names.O;
    turnText.textContent = winnerName + ' wins!';
    showOverlay(winnerName + ' wins!', 'win-msg');
  }

  updateScoreDisplay();
}


// ─── Controls ────────────────────────────────────────────────

/** Restarts the round but keeps scores */
function restartRound() {
  board = Array(9).fill('');
  currentPlayer = 'X';
  gameOver = false;
  thinking = false;
  hideOverlay();
  cells.forEach(cell => {
    cell.className = 'cell';
    cell.textContent = '';
  });
  dotX.className = 'turn-dot x-turn';
  dotO.className = 'turn-dot';
  updateTurnIndicator();
  updateScoreDisplay();
}

/** Resets scores and restarts */
function resetAll() {
  scores = { X: 0, O: 0, D: 0 };
  restartRound();
}

/** Switches between single and two-player modes */
function switchMode(newMode) {
  mode = newMode;

  document.getElementById('btn1p').classList.toggle('active', mode === 'single');
  document.getElementById('btn2p').classList.toggle('active', mode === 'two');

  name2El.disabled = mode === 'single';
  name2El.placeholder = mode === 'single' ? 'Computer (O)' : 'Player 2 (O)';

  resetAll();
}


// ─── Event listeners ─────────────────────────────────────────

document.getElementById('btn1p').addEventListener('click', () => switchMode('single'));
document.getElementById('btn2p').addEventListener('click', () => switchMode('two'));
document.getElementById('restartBtn').addEventListener('click', restartRound);
document.getElementById('resetBtn').addEventListener('click', resetAll);

name1El.addEventListener('input', updateScoreDisplay);
name2El.addEventListener('input', updateScoreDisplay);


// ─── Init ────────────────────────────────────────────────────

buildBoard();
render();
