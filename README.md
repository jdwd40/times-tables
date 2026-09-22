# Times Tables

A mobile-first 1x1 through 12x12 multiplication practice game.
Vanilla browser JS, no runtime dependencies.

## Run tests

    npm test

## Structure

- `src/game.js` — pure game engine (no DOM). State is a plain object;
  `inputDigit(game, digit)` is the only mutation entry point and returns
  `'correct' | 'prefix' | 'incorrect' | 'finished'`.
- `tests/game.test.js` — node:test suite for the engine.
- `index.html` — app shell; UI rendering is implemented in a later chunk.

## Engine rules

- 144 cells (12x12), row-major. Active cell starts at 1x1.
- Exact match completes the cell (+10) and advances to the next incomplete
  cell, skipping completed ones; completed cells are locked.
- A valid decimal prefix of the answer waits; leading zero, non-prefix, or
  full-length non-match is incorrect (-5, mistakes++, input cleared, stay).
- Timer starts on the first digit (`startedAt`), stops when all 144 cells
  are complete (`finishedAt`). Inject `now` for deterministic tests.
- A new game is a fresh `createGame()`.
