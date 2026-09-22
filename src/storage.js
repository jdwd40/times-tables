const KEY = 'times-tables:v1';

export function defaults() {
  return { leaderboard: [], bestTimeMs: null, playerName: 'Player', muted: false };
}

export function normalizeName(value) {
  const s = typeof value === 'string' ? value.trim() : '';
  return s === '' ? 'Player' : s;
}

function saneEntry(e) {
  return (
    e !== null && typeof e === 'object' &&
    typeof e.name === 'string' &&
    Number.isFinite(e.timeMs) && e.timeMs >= 0 &&
    Number.isFinite(e.score) &&
    Number.isFinite(e.mistakes) &&
    Number.isFinite(e.date)
  );
}

export function loadStore(storage) {
  let raw = null;
  try {
    raw = storage.getItem(KEY);
  } catch {
    return defaults();
  }
  if (raw === null || raw === undefined) return defaults();
  try {
    const data = JSON.parse(raw);
    if (data === null || typeof data !== 'object') return defaults();
    return {
      leaderboard: Array.isArray(data.leaderboard) ? data.leaderboard.filter(saneEntry).slice(0, 10) : [],
      bestTimeMs: Number.isFinite(data.bestTimeMs) && data.bestTimeMs >= 0 ? data.bestTimeMs : null,
      playerName: normalizeName(data.playerName),
      muted: data.muted === true,
    };
  } catch {
    return defaults();
  }
}

export function saveStore(storage, store) {
  try {
    storage.setItem(KEY, JSON.stringify(store));
  } catch {
    // storage unavailable (private mode, quota) — gameplay continues without persistence
  }
}

// Sort: time ascending, then higher score, then earlier date. Top 10 only.
export function addLeaderboardEntry(leaderboard, entry) {
  return [...leaderboard, entry]
    .sort((a, b) => a.timeMs - b.timeMs || b.score - a.score || a.date - b.date)
    .slice(0, 10);
}

// Best time only moves down; it is only called for finished 144-cell runs.
export function updateBestTime(prev, entry) {
  return prev === null || entry.timeMs < prev ? entry.timeMs : prev;
}
