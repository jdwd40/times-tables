// Web Audio only; created lazily on a user gesture. All failures are swallowed.
let ctx = null;
let muted = false;

export function setMuted(value) {
  muted = value === true;
}

export function isMuted() {
  return muted;
}

export function primeAudio() {
  if (ctx === null) {
    try {
      const AC = window.AudioContext || window.webkitAudioContext;
      if (AC) ctx = new AC();
    } catch {
      ctx = null;
    }
  }
  if (ctx && ctx.state === 'suspended') {
    ctx.resume().catch(() => {});
  }
}

function tone(freq, delay, dur, type, vol) {
  if (muted || !ctx) return;
  try {
    const osc = ctx.createOscillator();
    const gain = ctx.createGain();
    const t0 = ctx.currentTime + delay;
    osc.type = type;
    osc.frequency.value = freq;
    gain.gain.setValueAtTime(vol, t0);
    gain.gain.exponentialRampToValueAtTime(0.001, t0 + dur);
    osc.connect(gain).connect(ctx.destination);
    osc.start(t0);
    osc.stop(t0 + dur);
  } catch {
    // audio unavailable — never break gameplay
  }
}

export function correct() {
  tone(660, 0, 0.12, 'sine', 0.12);
}

export function incorrect() {
  tone(180, 0, 0.22, 'square', 0.06);
}

export function complete() {
  tone(523, 0, 0.16, 'sine', 0.12);
  tone(659, 0.14, 0.16, 'sine', 0.12);
  tone(784, 0.28, 0.35, 'sine', 0.12);
}
