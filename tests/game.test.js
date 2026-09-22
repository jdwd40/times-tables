import { test } from 'node:test';
import assert from 'node:assert/strict';
import { createGame, inputDigit, deleteDigit, selectCell, GRID, CELLS } from '../src/game.js';

function typeAnswer(game, answer) {
  for (const d of String(answer)) inputDigit(game, d);
}

function advanceTo(game, a, b) {
  const target = (a - 1) * GRID + (b - 1);
  for (let i = 0; i < target; i++) typeAnswer(game, game.cells[i].answer);
}

test('createGame builds 144 cells in row-major order, 3x4 and 4x3 distinct', () => {
  const game = createGame();
  assert.equal(game.cells.length, CELLS);
  assert.equal(CELLS, 144);
  // row-major: index = (a-1)*12 + (b-1)
  const c34 = game.cells[(3 - 1) * GRID + (4 - 1)];
  const c43 = game.cells[(4 - 1) * GRID + (3 - 1)];
  assert.deepEqual({ a: c34.a, b: c34.b }, { a: 3, b: 4 });
  assert.deepEqual({ a: c43.a, b: c43.b }, { a: 4, b: 3 });
  assert.notEqual(c34, c43);
});

test('createGame starts at 1x1 with zeroed state', () => {
  const game = createGame();
  assert.equal(game.active, 0);
  assert.equal(game.cells[0].a, 1);
  assert.equal(game.cells[0].b, 1);
  assert.equal(game.cells.every((c) => !c.complete), true);
  assert.equal(game.score, 0);
  assert.equal(game.mistakes, 0);
  assert.equal(game.input, '');
  assert.equal(game.startedAt, null);
  assert.equal(game.finishedAt, null);
});

test('1x1 completes on "1": +10, cell complete, advances row-major to 1x2, input cleared', () => {
  const game = createGame();
  const result = inputDigit(game, '1');
  assert.equal(result, 'correct');
  assert.equal(game.cells[0].complete, true);
  assert.equal(game.score, 10);
  assert.equal(game.input, '');
  assert.equal(game.active, 1);
  assert.deepEqual({ a: game.cells[1].a, b: game.cells[1].b }, { a: 1, b: 2 });
});

test('row-major advance: completing cells walks 1x1, 1x2, 1x3 ...', () => {
  const game = createGame();
  typeAnswer(game, 1); // 1x1
  assert.equal(game.active, 1);
  typeAnswer(game, 2); // 1x2
  assert.equal(game.active, 2);
  assert.deepEqual({ a: game.cells[2].a, b: game.cells[2].b }, { a: 1, b: 3 });
  assert.equal(game.score, 20);
});

test('2x5 accepts "1" as waiting prefix, then "10" as correct', () => {
  const game = createGame();
  advanceTo(game, 2, 5);
  assert.deepEqual({ a: game.cells[game.active].a, b: game.cells[game.active].b }, { a: 2, b: 5 });
  assert.equal(inputDigit(game, '1'), 'prefix');
  assert.equal(game.input, '1');
  assert.equal(game.cells[game.active].complete, false);
  assert.equal(inputDigit(game, '0'), 'correct');
  assert.equal(game.cells[game.active - 1].complete, true);
  assert.equal(game.input, '');
});

test('12x12 accepts "1", "14", then "144"', () => {
  const game = createGame();
  advanceTo(game, 12, 12);
  const last = CELLS - 1;
  assert.equal(game.active, last);
  assert.deepEqual({ a: game.cells[last].a, b: game.cells[last].b }, { a: 12, b: 12 });
  assert.equal(inputDigit(game, '1'), 'prefix');
  assert.equal(inputDigit(game, '4'), 'prefix');
  assert.equal(inputDigit(game, '4'), 'correct');
  assert.equal(game.cells[last].complete, true);
});

test('incorrect: non-prefix digit is -5, mistakes++, input cleared, stays on cell', () => {
  const game = createGame(); // 1x1, answer "1"
  assert.equal(inputDigit(game, '9'), 'incorrect');
  assert.equal(game.score, -5);
  assert.equal(game.mistakes, 1);
  assert.equal(game.input, '');
  assert.equal(game.active, 0);
  assert.equal(game.cells[0].complete, false);
});

test('incorrect: leading zero rejected even when answer starts with same digit', () => {
  const game = createGame();
  advanceTo(game, 2, 5); // answer "10", score 160 from prior cells
  const before = game.score;
  assert.equal(inputDigit(game, '0'), 'incorrect');
  assert.equal(game.score, before - 5);
  assert.equal(game.mistakes, 1);
  assert.equal(game.input, '');
});

test('incorrect: wrong digit at full answer length rejected, score -5, input cleared', () => {
  const game = createGame();
  advanceTo(game, 2, 5); // answer "10", prefix "1" held
  inputDigit(game, '1');
  assert.equal(inputDigit(game, '2'), 'incorrect'); // "12" == length, non-prefix
  assert.equal(game.mistakes, 1);
  assert.equal(game.input, '');
  assert.equal(game.cells[game.active].complete, false);
});

test('score may go negative with repeated mistakes', () => {
  const game = createGame(); // 1x1 answer "1"
  inputDigit(game, '9');
  inputDigit(game, '9');
  inputDigit(game, '9');
  assert.equal(game.score, -15);
  assert.equal(game.mistakes, 3);
});

test('completed cells are locked: cannot revisit 1x1 after advancing', () => {
  const game = createGame();
  typeAnswer(game, 1); // complete 1x1
  assert.equal(game.active, 1); // now on 1x2 (answer 2)
  inputDigit(game, '1'); // "1" is a prefix of "2"? no -> incorrect on current cell
  assert.equal(game.cells[1].complete, false);
  assert.equal(game.cells[0].complete, true);
  assert.equal(game.active, 1);
});

test('advance skips already-completed cells (incomplete cell jump)', () => {
  const game = createGame();
  // white-box: pre-complete cell 1 and cell 2, active on 0
  game.cells[1].complete = true;
  game.cells[2].complete = true;
  typeAnswer(game, 1); // complete 1x1
  assert.equal(game.active, 3); // jumped over completed 1x2, 1x3
});

test('timer starts on first digit and stops when all 144 complete', () => {
  let t = 1000;
  const game = createGame(() => t);
  assert.equal(game.startedAt, null);
  inputDigit(game, '1'); // completes 1x1, t=1000
  assert.equal(game.startedAt, 1000);
  t = 5000;
  // complete the remaining 143 cells
  while (game.finishedAt === null) {
    const cell = game.cells[game.active];
    typeAnswer(game, cell.answer);
    t += 1;
  }
  assert.equal(game.cells.every((c) => c.complete), true);
  assert.equal(game.finishedAt, t - 1);
  assert.equal(game.score, 1440);
});

test('input after finish is ignored', () => {
  let t = 0;
  const game = createGame(() => t);
  while (game.finishedAt === null) typeAnswer(game, game.cells[game.active].answer);
  const score = game.score;
  assert.equal(inputDigit(game, '9'), 'finished');
  assert.equal(game.score, score);
});

test('new game resets board, score, mistakes, input and timer', () => {
  const game = createGame();
  inputDigit(game, '9');
  inputDigit(game, '9');
  typeAnswer(game, 1);
  const fresh = createGame();
  assert.equal(fresh.cells.length, 144);
  assert.equal(fresh.cells.every((c) => !c.complete), true);
  assert.equal(fresh.active, 0);
  assert.equal(fresh.score, 0);
  assert.equal(fresh.mistakes, 0);
  assert.equal(fresh.input, '');
  assert.equal(fresh.startedAt, null);
  assert.equal(fresh.finishedAt, null);
});

test('deleteDigit removes the last pending digit', () => {
  const game = createGame();
  advanceTo(game, 12, 12); // answer "144"
  inputDigit(game, '1');
  inputDigit(game, '4');
  assert.equal(game.input, '14');
  assert.equal(deleteDigit(game), 'deleted');
  assert.equal(game.input, '1');
  assert.equal(deleteDigit(game), 'deleted');
  assert.equal(game.input, '');
});

test('deleteDigit on empty input is a no-op', () => {
  const game = createGame();
  assert.equal(deleteDigit(game), 'empty');
  assert.equal(game.input, '');
});

test('deleteDigit does not touch score or started state', () => {
  const game = createGame();
  advanceTo(game, 12, 12);
  inputDigit(game, '1');
  const score = game.score;
  const started = game.startedAt;
  deleteDigit(game);
  assert.equal(game.score, score);
  assert.equal(game.startedAt, started);
  assert.equal(game.cells[game.active].complete, false);
});

test('deleteDigit after finish is ignored', () => {
  let t = 0;
  const game = createGame(() => t);
  while (game.finishedAt === null) typeAnswer(game, game.cells[game.active].answer);
  assert.equal(deleteDigit(game), 'finished');
});

test('selectCell jumps to an incomplete cell and clears pending input', () => {
  const game = createGame();
  advanceTo(game, 12, 11); // completes 0..141, active 142 (12x11, answer "132")
  inputDigit(game, '1');
  assert.equal(game.input, '1');
  const started = game.startedAt;
  assert.equal(selectCell(game, 143), 'selected');
  assert.equal(game.active, 143);
  assert.equal(game.input, '');
  assert.deepEqual({ a: game.cells[143].a, b: game.cells[143].b }, { a: 12, b: 12 });
  assert.equal(game.startedAt, started); // selecting never starts (or restarts) the timer
});

test('selectCell refuses completed cells', () => {
  const game = createGame();
  typeAnswer(game, 1); // complete 1x1
  assert.equal(game.active, 1);
  assert.equal(selectCell(game, 0), 'locked');
  assert.equal(game.active, 1);
  assert.equal(game.cells[0].complete, true);
});

test('selectCell refuses out-of-range or non-integer indexes', () => {
  const game = createGame();
  assert.equal(selectCell(game, -1), 'invalid');
  assert.equal(selectCell(game, CELLS), 'invalid');
  assert.equal(selectCell(game, 1.5), 'invalid');
  assert.equal(selectCell(game, '3'), 'invalid');
  assert.equal(game.active, 0);
});

test('selectCell after finish is ignored', () => {
  let t = 0;
  const game = createGame(() => t);
  while (game.finishedAt === null) typeAnswer(game, game.cells[game.active].answer);
  assert.equal(selectCell(game, 0), 'finished');
});
