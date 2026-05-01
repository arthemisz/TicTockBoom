
const WIN_LINES = [
  [0, 1, 2], [3, 4, 5], [6, 7, 8], // rows
  [0, 3, 6], [1, 4, 7], [2, 5, 8], // cols
  [0, 4, 8], [2, 4, 6],             // diagonals
];


const PRIORITY = [4, 0, 2, 6, 8, 1, 3, 5, 7];


const CPU_DELAY_MS = 480;




let board = Array(9).fill('');  
let currentPlayer = 'X';    
let gameOver = false;           
let mode = 'single';             
let thinking = false;           
let scores = { X: 0, O: 0, D: 0 };




const boardEl    = document.getElementById('board');
const overlay    = document.getElementById('overlay');
const dotX       = document.getElementById('dotX');
const dotO       = document.getElementById('dotO');
const turnText   = document.getElementById('turnText');
const name1El    = document.getElementById('name1');
const name2El    = document.getElementById('name2');

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



function getNames() {
  const x = name1El.value.trim() || 'Player';
  const o = name2El.value.trim() || (mode === 'single' ? 'CPU' : 'Player 2');
  return { X: x, O: o };
}


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
 @param {string[]} b
  @param {string} sym – 'X' or 'O'
  @returns {number} index or -1


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


function findBlockingMove(b, sym) {
  return findWinningMove(b, sym); 
}



  const win = findWinningMove(b, 'O');
  if (win >= 0) return win;


  const block = findBlockingMove(b, 'X');
  if (block >= 0) return block;


  for (const idx of PRIORITY) {
    if (!b[idx]) return idx;
  }
}



function render() {
  cells.forEach((cell, i) => {
    const mark = board[i];
    cell.className = 'cell' + (mark ? ' taken ' + mark.toLowerCase() : '');
    cell.textContent = mark === 'X' ? '✕' : mark === 'O' ? '○' : '';
  });
  updateTurnIndicator();
  updateScoreDisplay();
}


function updateTurnIndicator() {
  if (gameOver) return;
  const names = getNames();
  dotX.className = 'turn-dot' + (currentPlayer === 'X' ? ' x-turn' : '');
  dotO.className = 'turn-dot' + (currentPlayer === 'O' ? ' o-turn' : '');
  turnText.textContent = (currentPlayer === 'X' ? names.X : names.O) + "'s turn";
}

function updateScoreDisplay() {
  const names = getNames();
  document.getElementById('s1').textContent = scores.X;
  document.getElementById('s2').textContent = scores.O;
  document.getElementById('sd').textContent = scores.D;
  document.getElementById('s1label').textContent = names.X + ' (X)';
  document.getElementById('s2label').textContent = names.O + ' (O)';
}

function showOverlay(message, type) {
  overlay.textContent = message;
  overlay.className = 'overlay show ' + type;
}

function hideOverlay() {
  overlay.className = 'overlay';
  overlay.textContent = '';
}



function placeMove(index, symbol) {
  board[index] = symbol;


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

 
  currentPlayer = currentPlayer === 'X' ? 'O' : 'X';
  updateTurnIndicator();

  if (mode === 'single' && currentPlayer === 'O' && !gameOver) {
    triggerComputerMove();
  }
}

function handleCellClick(index) {
  if (board[index] || gameOver || thinking) return;
  if (mode === 'single' && currentPlayer === 'O') return; 

  placeMove(index, currentPlayer);
}


function triggerComputerMove() {
  thinking = true;
  setTimeout(() => {
    thinking = false;
    const idx = getBestMove(board);
    placeMove(idx, 'O');
  }, CPU_DELAY_MS);
}

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


function resetAll() {
  scores = { X: 0, O: 0, D: 0 };
  restartRound();
}


function switchMode(newMode) {
  mode = newMode;

  document.getElementById('btn1p').classList.toggle('active', mode === 'single');
  document.getElementById('btn2p').classList.toggle('active', mode === 'two');

  name2El.disabled = mode === 'single';
  name2El.placeholder = mode === 'single' ? 'Computer (O)' : 'Player 2 (O)';

  resetAll();
}

document.getElementById('btn1p').addEventListener('click', () => switchMode('single'));
document.getElementById('btn2p').addEventListener('click', () => switchMode('two'));
document.getElementById('restartBtn').addEventListener('click', restartRound);
document.getElementById('resetBtn').addEventListener('click', resetAll);

name1El.addEventListener('input', updateScoreDisplay);
name2El.addEventListener('input', updateScoreDisplay);

buildBoard();
render();
