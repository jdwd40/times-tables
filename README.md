# Times Tables

A mobile-first 1x1 through 12x12 multiplication practice game.
Vanilla browser JS, no runtime dependencies.

## Play

Open `index.html` in a browser (or serve the directory with any static
file server). Use the on-screen keypad or your keyboard; the timer starts
on your first digit.

## Run tests

    npm test

## Structure

- `src/game.js` — pure game engine (no DOM). State is a plain object;
  `inputDigit(game, digit)` is the only scoring mutation entry point and
  returns `'correct' | 'prefix' | 'incorrect' | 'finished'`.
  `deleteDigit(game)` removes one pending digit (`'deleted' | 'empty' |
  'finished'`); `selectCell(game, index)` jumps the active cell to an
  incomplete one (`'selected' | 'locked' | 'invalid' | 'finished'`).
- `src/app.js` — DOM shell: rendering, keypad/keyboard input, timer tick.
- `styles.css` — mobile-first layout; fixed bottom keypad, grid is the
  only scrolling region, `prefers-reduced-motion` respected.
- `tests/game.test.js` — node:test suite for the engine.
- `index.html` — app shell.

## Engine rules

- 144 cells (12x12), row-major. Active cell starts at 1x1.
- Exact match completes the cell (+10) and advances to the next incomplete
  cell, skipping completed ones; completed cells are locked.
- A valid decimal prefix of the answer waits; leading zero, non-prefix, or
  full-length non-match is incorrect (-5, mistakes++, input cleared, stay).
- Timer starts on the first digit (`startedAt`), stops when all 144 cells
  are complete (`finishedAt`). Inject `now` for deterministic tests.
- A new game is a fresh `createGame()`.
