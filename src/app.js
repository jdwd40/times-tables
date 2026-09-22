import { CELLS, GRID, createGame, deleteDigit, inputDigit, selectCell } from './game.js';
import {
  loadStore,
  saveStore,
  normalizeName,
  addLeaderboardEntry,
  updateBestTime,
} from './storage.js';
import * as sfx from './sound.js';

const els = {
  grid: document.getElementById('grid'),
  equation: document.getElementById('equation'),
  status: document.getElementById('status'),
  timer: document.getElementById('timer'),
  score: document.getElementById('score'),
  mistakes: document.getElementById('mistakes'),
  progress: document.getElementById('progress'),
  best: document.getElementById('best'),
  newGame: document.getElementById('new-game'),
  keypad: document.getElementById('keypad'),
  name: document.getElementById('player-name'),
  mute: document.getElementById('mute'),
  lbBody: document.getElementById('lb-body'),
  lbEmpty: document.getElementById('lb-empty'),
};

const storage = window.localStorage;
const store = loadStore(storage);

let game = createGame();
let tick = null;
let flashTimer = null;
let lastScore = null;
const cellEls = [];

sfx.setMuted(store.muted);

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
  if (lastScore !== null && lastScore !== game.score) {
    els.score.classList.remove('bump');
    void els.score.offsetWidth;
    els.score.classList.add('bump');
  }
  lastScore = game.score;
  renderEquation();
  renderTimer();
  renderBest();
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

function renderBest() {
  els.best.textContent = store.bestTimeMs === null ? '—' : formatTime(store.bestTimeMs);
}

function renderMute() {
  els.mute.textContent = store.muted ? 'Sound off' : 'Sound on';
  els.mute.setAttribute('aria-pressed', String(store.muted));
}

function renderLeaderboard() {
  els.lbBody.textContent = '';
  els.lbEmpty.hidden = store.leaderboard.length > 0;
  store.leaderboard.forEach((e, i) => {
    const tr = document.createElement('tr');
    for (const v of [i + 1, e.name, formatTime(e.timeMs), e.score, e.mistakes]) {
      const td = document.createElement('td');
      td.textContent = v;
      tr.append(td);
    }
    els.lbBody.append(tr);
  });
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

function clearFlash() {
  clearTimeout(flashTimer);
  els.equation.classList.remove('good', 'bad');
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

function onComplete(ms) {
  const entry = {
    name: normalizeName(els.name.value),
    timeMs: ms,
    score: game.score,
    mistakes: game.mistakes,
    date: Date.now(),
  };
  store.leaderboard = addLeaderboardEntry(store.leaderboard, entry);
  store.bestTimeMs = updateBestTime(store.bestTimeMs, entry);
  saveStore(storage, store);
  renderLeaderboard();
  sfx.complete();
  celebrate();
}

function celebrate() {
  if (window.matchMedia('(prefers-reduced-motion: reduce)').matches) return;
  const holder = document.createElement('div');
  holder.className = 'confetti';
  holder.setAttribute('aria-hidden', 'true');
  const colors = ['#38bdf8', '#22c55e', '#f59e0b', '#e2e8f0'];
  for (let i = 0; i < 28; i++) {
    const p = document.createElement('span');
    p.style.left = `${Math.random() * 100}%`;
    p.style.background = colors[i % colors.length];
    p.style.animationDelay = `${Math.random() * 0.4}s`;
    p.style.animationDuration = `${1.6 + Math.random()}s`;
    holder.append(p);
  }
  document.body.append(holder);
  setTimeout(() => holder.remove(), 3200);
}

function afterMove(result) {
  if (result === 'correct' && game.finishedAt !== null) result = 'finished';
  if (result === 'correct') {
    setStatus('Correct', 'good');
    flash('good');
    sfx.correct();
  } else if (result === 'incorrect') {
    setStatus('Try again', 'bad');
    flash('bad');
    sfx.incorrect();
  } else if (result === 'prefix') {
    setStatus('');
  } else if (result === 'finished') {
    stopTicking();
    const ms = elapsedMs();
    setStatus(`All ${CELLS} complete in ${formatTime(ms)}. Score ${game.score}, mistakes ${game.mistakes}.`, 'good');
    onComplete(ms);
  }
  startTicking();
  render();
  if (result === 'correct' || result === 'finished') {
    scrollActiveIntoView();
    focusActiveCell();
  }
}

function typeDigit(d) {
  sfx.primeAudio();
  afterMove(inputDigit(game, d));
}

function backspace() {
  sfx.primeAudio();
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
    btn.scrollIntoView({ block: 'nearest', inline: 'nearest' });
  }
});

els.newGame.addEventListener('click', () => {
  sfx.primeAudio();
  stopTicking();
  clearFlash();
  game = createGame();
  setStatus('');
  render();
  focusActiveCell();
  scrollActiveIntoView();
});

els.mute.addEventListener('click', () => {
  store.muted = !store.muted;
  sfx.setMuted(store.muted);
  saveStore(storage, store);
  renderMute();
});

els.name.addEventListener('change', () => {
  els.name.value = normalizeName(els.name.value);
  store.playerName = els.name.value;
  saveStore(storage, store);
});

document.addEventListener('keydown', (e) => {
  if (e.target instanceof HTMLInputElement) return;
  if (/^[0-9]$/.test(e.key)) {
    e.preventDefault();
    typeDigit(e.key);
  } else if (e.key === 'Backspace') {
    e.preventDefault();
    backspace();
  } else if (e.key === 'Enter' || e.key === ' ') {
    e.preventDefault(); // spec: ignored — block native button activation
  }
  // all other keys are ignored
});

els.name.value = store.playerName;
renderMute();
buildGrid();
render();
renderLeaderboard();
