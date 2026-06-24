/**
 * Timer completion chime — synthesized via AudioContext so it fires
 * even when the browser tab is in the background / another tab is focused.
 *
 * Three-note ascending arpeggio (G4 → B4 → D5) with a warm sine timbre
 * and a gentle organ-style attack, loud enough to be heard across tabs.
 */

let sharedCtx = null;

function getAudioContext() {
  if (typeof window === "undefined") return null;
  try {
    const Ctx = window.AudioContext || window.webkitAudioContext;
    if (!Ctx) return null;
    if (!sharedCtx) sharedCtx = new Ctx();
    if (sharedCtx.state === "suspended") {
      sharedCtx.resume().catch(() => {});
    }
    return sharedCtx;
  } catch {
    return null;
  }
}

/**
 * Play a three-note ascending chime.
 * @param {{ volume?: number }} [opts]
 */
export function playTimerCompletionChime(opts = {}) {
  const ctx = getAudioContext();
  if (!ctx) return;

  const volume = opts.volume ?? 0.55;
  const now = ctx.currentTime;

  // G4 → B4 → D5 → D5 (sustained)
  const notes = [
    { freq: 392.0,  start: 0,    len: 0.38, gain: volume },
    { freq: 493.88, start: 0.18, len: 0.42, gain: volume * 0.92 },
    { freq: 587.33, start: 0.38, len: 0.55, gain: volume * 0.85 },
    { freq: 587.33, start: 0.68, len: 0.70, gain: volume * 0.55 },
  ];

  notes.forEach(({ freq, start, len, gain }) => {
    const osc = ctx.createOscillator();
    const gainNode = ctx.createGain();

    osc.type = "sine";
    osc.frequency.value = freq;
    osc.connect(gainNode);
    gainNode.connect(ctx.destination);

    const t = now + start;
    gainNode.gain.setValueAtTime(0.0001, t);
    gainNode.gain.exponentialRampToValueAtTime(gain, t + 0.03);
    gainNode.gain.setValueAtTime(gain, t + len * 0.55);
    gainNode.gain.exponentialRampToValueAtTime(0.0001, t + len);

    osc.start(t);
    osc.stop(t + len + 0.05);
  });
}

/**
 * "Warm up" the AudioContext on the first user interaction so that it is
 * already running when the timer fires.  Call this once, e.g. from a play
 * button click handler.
 */
export function primeAudioContext() {
  getAudioContext();
}
