import { CELLS, GRID, createGame, deleteDigit, inputDigit, selectCell } from './game.js';

const els = {
  grid: document.getElementById('grid'),
  equation: document.getElementById('equation'),
  status: document.getElementById('status'),
  timer: document.getElementById('timer'),
  score: document.getElementById('score'),
  mistakes: document.getElementById('mistakes'),
  progress: document.getElementById('progress'),
  newGame: document.getElementById('new-game'),
  keypad: document.getElementById('keypad'),
};

let game = createGame();
let tick = null;
let flashTimer = null;
const cellEls = [];

function buildGrid() {
  const corner = document.createElement('span');
  corner.className = 'head';
  corner.setAttribute('aria-hidden', 'true');
  els.grid.append(corner);

  for (let b = 1; b <= GRID; b++) {
    const h = document.createElement('span');
    h.className = 'head';
    h.setAttribute('aria-hidden', 'true');
    h.textContent = b;
    els.grid.append(h);
  }

  for (let a = 1; a <= GRID; a++) {
    const rowHead = document.createElement('span');
    rowHead.className = 'head';
    rowHead.setAttribute('aria-hidden', 'true');
    rowHead.textContent = a;
    els.grid.append(rowHead);

    for (let b = 1; b <= GRID; b++) {
      const i = (a - 1) * GRID + (b - 1);
      const btn = document.createElement('button');
      btn.type = 'button';
      btn.className = 'cell';
      btn.dataset.index = i;
      cellEls.push(btn);
      els.grid.append(btn);
    }
  }
}

function render() {
  const done = game.cells.filter((c) => c.complete).length;
  els.score.textContent = game.score;
  els.mistakes.textContent = game.mistakes;
  els.progress.textContent = `${done}/${CELLS}`;
  els.newGame.textContent = game.startedAt === null ? 'Start' : 'New Game';
  renderEquation();
  renderTimer();
  for (let i = 0; i < CELLS; i++) renderCell(i);
}

function renderCell(i) {
  const cell = game.cells[i];
  const el = cellEls[i];
  el.textContent = cell.complete ? cell.answer : '';
  el.setAttribute('aria-label', `${cell.a} times ${cell.b}, ${cell.complete ? cell.answer : 'empty'}`);
  el.classList.toggle('complete', cell.complete);
  el.classList.toggle('active', i === game.active);
  if (i === game.active) el.setAttribute('aria-current', 'true');
  else el.removeAttribute('aria-current');
}

function renderEquation() {
  const c = game.cells[game.active];
  const rhs = game.finishedAt !== null ? c.answer : game.input || '?';
  els.equation.textContent = `${c.a} × ${c.b} = ${rhs}`;
}

function renderTimer() {
  els.timer.textContent = formatTime(elapsedMs());
}

function elapsedMs() {
  if (game.startedAt === null) return 0;
  return (game.finishedAt ?? Date.now()) - game.startedAt;
}

function formatTime(ms) {
  const s = Math.floor(ms / 1000);
  return `${Math.floor(s / 60)}:${String(s % 60).padStart(2, '0')}`;
}

function setStatus(text, kind = '') {
  els.status.textContent = text;
  els.status.className = `status ${kind}`.trim();
}

function flash(kind) {
  clearTimeout(flashTimer);
  els.equation.classList.remove('good', 'bad');
  if (kind) {
    // force reflow so repeated feedback re-triggers the animation
    void els.equation.offsetWidth;
    els.equation.classList.add(kind);
    flashTimer = setTimeout(() => els.equation.classList.remove('good', 'bad'), 700);
  }
}

function startTicking() {
  if (tick === null && game.startedAt !== null && game.finishedAt === null) {
    tick = setInterval(renderTimer, 500);
  }
}

function stopTicking() {
  clearInterval(tick);
  tick = null;
}

function scrollActiveIntoView() {
  cellEls[game.active]?.scrollIntoView({ block: 'nearest', inline: 'nearest' });
}

function focusActiveCell() {
  cellEls[game.active]?.focus();
}

function afterMove(result) {
  if (result === 'correct') {
    setStatus('Correct', 'good');
    flash('good');
  } else if (result === 'incorrect') {
    setStatus('Try again', 'bad');
    flash('bad');
  } else if (result === 'finished') {
    stopTicking();
    setStatus(`All ${CELLS} complete in ${formatTime(elapsedMs())}. Score ${game.score}, mistakes ${game.mistakes}.`, 'good');
  }
  startTicking();
  render();
  if (result === 'correct' || result === 'finished') scrollActiveIntoView();
}

function typeDigit(d) {
  afterMove(inputDigit(game, d));
}

function backspace() {
  if (deleteDigit(game) === 'deleted') {
    renderEquation();
    setStatus('');
  }
}

els.keypad.addEventListener('click', (e) => {
  const key = e.target.closest('button')?.dataset.key;
  if (key === 'back') backspace();
  else if (key !== undefined) typeDigit(key);
});

els.grid.addEventListener('click', (e) => {
  const btn = e.target.closest('button.cell');
  if (!btn) return;
  const result = selectCell(game, Number(btn.dataset.index));
  if (result === 'locked') {
    setStatus('That cell is already complete.');
  } else if (result === 'selected') {
    setStatus('');
    render();
    btn.focus();
  }
});

els.newGame.addEventListener('click', () => {
  stopTicking();
  game = createGame();
  setStatus('');
  render();
  focusActiveCell();
});

document.addEventListener('keydown', (e) => {
  if (/^[0-9]$/.test(e.key)) {
    e.preventDefault();
    typeDigit(e.key);
  } else if (e.key === 'Backspace') {
    e.preventDefault();
    backspace();
  }
  // all other keys (letters, Enter, NumpadEnter, ...) are ignored
});

buildGrid();
render();
