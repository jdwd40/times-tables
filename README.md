# Times Tables

A mobile-first 1x1 through 12x12 multiplication practice game.
Vanilla browser JS, no runtime dependencies. LocalStorage-only persistence
(leaderboard, best time, player name, mute preference) behind a small
storage adapter; no backend, no active-game-state persistence.

## Play

Open `index.html` in a browser (or serve the directory with any static
file server). Use the on-screen keypad or your keyboard; the timer starts
on your first digit. Finish all 144 cells to land on the leaderboard
(top 10, ranked by time, then score, then date).

## Run tests

    npm test

## Structure

- `src/game.js` — pure game engine (no DOM). State is a plain object;
  `inputDigit(game, digit)` is the only scoring mutation entry point and
  returns `'correct' | 'prefix' | 'incorrect' | 'finished'` (the completing
  keystroke returns `'correct'` with `finishedAt` already set).
  `deleteDigit(game)` removes one pending digit (`'deleted' | 'empty' |
  'finished'`); `selectCell(game, index)` jumps the active cell to an
  incomplete one (`'selected' | 'locked' | 'invalid' | 'finished'`).
- `src/app.js` — DOM shell: rendering, keypad/keyboard input, timer tick,
  leaderboard, sounds, celebration.
- `src/storage.js` — localStorage adapter: load/save, name normalization,
  leaderboard ranking (top 10), best-time update. No engine state stored.
- `src/sound.js` — Web Audio correct/incorrect/completion sounds; context
  created on first user gesture; mute persists.
- `styles.css` — mobile-first layout; fixed bottom keypad on phones,
  in-flow keypad on ≥720px so the grid is never overlapped; grid is the
  only scrolling region; `prefers-reduced-motion` respected.
- `tests/` — node:test suites for the engine and the storage adapter.
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

