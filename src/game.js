export const GRID = 12;
export const CELLS = GRID * GRID;

export function createGame(now = () => Date.now()) {
  return {
    cells: Array.from({ length: CELLS }, (_, i) => {
      const a = Math.floor(i / GRID) + 1;
      const b = (i % GRID) + 1;
      return { a, b, answer: a * b, complete: false };
    }),
    active: 0,
    input: '',
    score: 0,
    mistakes: 0,
    startedAt: null,
    finishedAt: null,
    now,
  };
}

export function inputDigit(game, digit) {
  if (game.finishedAt !== null) return 'finished';
  if (game.startedAt === null) game.startedAt = game.now();
  game.input += digit;
  const answer = String(game.cells[game.active].answer);
  if (game.input === answer) {
    game.cells[game.active].complete = true;
    game.score += 10;
    game.input = '';
    advance(game);
    if (game.cells.every((c) => c.complete)) game.finishedAt = game.now();
    return 'correct';
  }
  if (game.input.length < answer.length && answer.startsWith(game.input)) {
    return 'prefix';
  }
  game.score -= 5;
  game.mistakes += 1;
  game.input = '';
  return 'incorrect';
}

function advance(game) {
  for (let n = 1; n <= CELLS; n++) {
    const idx = (game.active + n) % CELLS;
    if (!game.cells[idx].complete) {
      game.active = idx;
      return;
    }
  }
}
