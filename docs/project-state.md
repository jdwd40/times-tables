# Project state — Times Tables (deployed)

Updated 2026-09-22 19:15 UTC. Worktree: `times-tables-wt-20260922-171410-53e87e`.

## Progress

- Chunk 1: pure game engine (144 cells, scoring, timer, cell locking).
- Chunk 2: mobile-first DOM shell (keypad, keyboard input, HUD, flash/shake).
- Chunk 3: review fixes + locked MVP remainder — committed as `ba46952`.
- Final review fix: duplicate-completion guard — committed on top (see below).

## Completed

- All Grok review findings fixed:
  - Desktop/tablet keypad is in-flow at ≥720px (static, `flex: none`); grid scrolls in
    its own region, zero overlap, no magic padding. Mobile keeps the fixed thumb pad.
  - Final correct answer detected via `game.finishedAt !== null` — timer stops,
    completion announced, best time/leaderboard updated, completion sound + confetti.
  - New Game clears flash/status; `viewport-fit=cover`; backspace label "Del";
    Enter/Space `preventDefault` when ignored; valid prefix clears "Try again";
    focus + scroll follow advance/jump.
- Locked MVP: localStorage-only persistence behind `src/storage.js` adapter
  (leaderboard top 10, best time, player name, mute); name normalization
  ("Player" when empty); Web Audio sounds with persisted mute; leaderboard
  panel + Best time stat; completion celebration honoring reduced motion.
  No engine state (`cells`, `now`) is ever stored; no backend.
- Final Grok review MAJOR fixed: a digit entered after a finished run re-triggered
  `onComplete()` (duplicate leaderboard entry + replayed sound/confetti), because
  `afterMove` treated the engine's post-completion `'finished'` signal like the
  completing keystroke. Fix: pure helper `isCompletionMove(result, game)` in
  `src/game.js` — only a `'correct'` move with `finishedAt` newly set qualifies;
  engine `'finished'` input is ignored in `src/app.js`. Completion handling now
  runs exactly once per run; separate New Games still complete legitimately.

## Current

HEAD `7ef8a53` (reviewed app + deployment documentation); deployed to
`https://jdwd40.com/times-tables/` and verified in-browser. PR #1 remains open.
App is feature-complete per locked MVP scope; final review round and live
deployment verification are closed.

## Next

- Live deployment complete: static files are isolated at
  `/var/www/jdwd40.com/html/times-tables` with a dedicated nginx `/times-tables/`
  location. Existing portfolio root was preserved.
- Verified live redirect, HTML, CSS, ES module, 144 cells, keypad input,
  keyboard progression, mute persistence after reload, and unchanged root site.
- Optional polish only if a future review asks: roving tabindex on grid,
  layout niceties, Enter/Space preventDefault refinement (MINOR, noted by Grok).

## Tests

- `npm test`: 38/38 pass (24 engine + 14 storage), incl. new
  `isCompletionMove` regression test.
- Final raw-CDP probe `scratch/qa-final-cdp.js` (chunk 3): 28/28 pass, zero
  console errors, at 1280x800 and 390x844.
- Focused regression probe `scratch/qa-dedupe-cdp.js` (this fix): 7/7 pass —
  complete run → stray digit/Backspace/cell-click → leaderboard row count
  unchanged (1); New Game → second complete run → 2 legitimate rows;
  zero console errors. Probe verified to FAIL 5 checks on pre-fix code.

## Open issues

- None known. Probe note: desktop board scrolls ~1 row at 1280x800 (by design —
  keypad in-flow, grid is the scroll region).
- `game.now` remains a function on the live state object (fine at runtime);
  storage never serializes it.
- Grok MINOR (not addressed, by instruction): broad Enter/Space preventDefault.

## Last review

Grok final review of chunk 3 (`ba46952`): 1 MAJOR (duplicate completion on
post-finish input — fixed in this milestone) + 1 MINOR (Enter/Space
preventDefault breadth — deferred). First review: PASS WITH NOTES
(2 major, 8 minor), all previously fixed in chunk 3.
