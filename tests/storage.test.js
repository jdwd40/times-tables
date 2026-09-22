import { test } from 'node:test';
import assert from 'node:assert/strict';
import {
  defaults,
  normalizeName,
  loadStore,
  saveStore,
  addLeaderboardEntry,
  updateBestTime,
} from '../src/storage.js';

function fakeStorage(initial = {}) {
  const map = new Map(Object.entries(initial));
  return {
    getItem: (k) => (map.has(k) ? map.get(k) : null),
    setItem: (k, v) => map.set(k, String(v)),
    removeItem: (k) => map.delete(k),
    _map: map,
  };
}

const entry = (over = {}) => ({
  name: 'Ada',
  timeMs: 60000,
  score: 1440,
  mistakes: 0,
  date: 1720000000000,
  ...over,
});

test('normalizeName trims whitespace and falls back to Player', () => {
  assert.equal(normalizeName('  Ada  '), 'Ada');
  assert.equal(normalizeName('Ada'), 'Ada');
  assert.equal(normalizeName(''), 'Player');
  assert.equal(normalizeName('   '), 'Player');
  assert.equal(normalizeName(undefined), 'Player');
  assert.equal(normalizeName(null), 'Player');
  assert.equal(normalizeName(42), 'Player');
});

test('loadStore on empty storage returns defaults', () => {
  assert.deepEqual(loadStore(fakeStorage()), defaults());
});

test('loadStore on corrupt JSON returns defaults', () => {
  assert.deepEqual(loadStore(fakeStorage({ 'times-tables:v1': '{nope' })), defaults());
});

test('loadStore on non-object JSON returns defaults', () => {
  assert.deepEqual(loadStore(fakeStorage({ 'times-tables:v1': '"hi"' })), defaults());
});

test('loadStore tolerates storage that throws', () => {
  const throwing = { getItem() { throw new Error('denied'); }, setItem() { throw new Error('denied'); } };
  assert.deepEqual(loadStore(throwing), defaults());
  saveStore(throwing, defaults()); // must not throw
});

test('saveStore/loadStore round-trip preserves leaderboard, best time, name, mute', () => {
  const storage = fakeStorage();
  const store = {
    leaderboard: [entry()],
    bestTimeMs: 60000,
    playerName: 'Ada',
    muted: true,
  };
  saveStore(storage, store);
  assert.deepEqual(loadStore(storage), store);
});

test('loadStore drops malformed leaderboard entries and bad scalar types', () => {
  const storage = fakeStorage({
    'times-tables:v1': JSON.stringify({
      leaderboard: [
        entry(),
        { name: 5, timeMs: 'x' },
        { name: 'Bob', timeMs: 5000, score: 1, mistakes: 2, date: 3 },
        null,
        'junk',
      ],
      bestTimeMs: -5,
      playerName: '   ',
      muted: 'yes',
    }),
  });
  const store = loadStore(storage);
  assert.equal(store.leaderboard.length, 2);
  assert.equal(store.leaderboard[1].name, 'Bob');
  assert.equal(store.bestTimeMs, null);
  assert.equal(store.playerName, 'Player');
  assert.equal(store.muted, false);
});

test('addLeaderboardEntry sorts by time ascending', () => {
  const list = addLeaderboardEntry([], entry({ timeMs: 90000, name: 'Slow' }));
  const list2 = addLeaderboardEntry(list, entry({ timeMs: 60000, name: 'Fast' }));
  assert.deepEqual(list2.map((e) => e.name), ['Fast', 'Slow']);
});

test('addLeaderboardEntry tie on time: higher score first', () => {
  const a = entry({ name: 'A', timeMs: 60000, score: 1000, date: 1 });
  const b = entry({ name: 'B', timeMs: 60000, score: 1440, date: 2 });
  const list = addLeaderboardEntry(addLeaderboardEntry([], a), b);
  assert.deepEqual(list.map((e) => e.name), ['B', 'A']);
});

test('addLeaderboardEntry tie on time+score: earlier date first', () => {
  const a = entry({ name: 'A', timeMs: 60000, score: 1000, date: 5 });
  const b = entry({ name: 'B', timeMs: 60000, score: 1000, date: 2 });
  const list = addLeaderboardEntry(addLeaderboardEntry([], a), b);
  assert.deepEqual(list.map((e) => e.name), ['B', 'A']);
});

test('addLeaderboardEntry keeps top 10 after 12 entries; same name may repeat', () => {
  let list = [];
  for (let i = 0; i < 12; i++) {
    list = addLeaderboardEntry(list, entry({ name: 'Ada', timeMs: 100000 - i * 1000, date: i }));
  }
  assert.equal(list.length, 10);
  assert.equal(list.every((e) => e.name === 'Ada'), true);
  // fastest (11000ms at i=11 ... wait: timeMs desc 100000..89000; fastest kept = 89000? slowest dropped
  assert.equal(list[0].timeMs, 89000);
  assert.equal(list.at(-1).timeMs, 98000);
});

test('updateBestTime: null adopts entry time; only a strictly faster time replaces', () => {
  const e = entry({ timeMs: 60000 });
  assert.equal(updateBestTime(null, e), 60000);
  assert.equal(updateBestTime(90000, e), 60000);
  assert.equal(updateBestTime(60000, e), 60000); // tie: no change
  assert.equal(updateBestTime(30000, e), 30000);
});

test('stored data never contains engine state (no cells, no now)', () => {
  const storage = fakeStorage();
  saveStore(storage, { leaderboard: [entry()], bestTimeMs: 1, playerName: 'P', muted: false });
  const raw = storage._map.get('times-tables:v1');
  assert.equal(raw.includes('"cells"'), false);
  assert.equal(raw.includes('"now"'), false);
});
