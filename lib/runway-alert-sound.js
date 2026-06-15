let audioContext = null;

/**
 * Pleasant gold-tone chime for upcoming runway block alerts.
 */
export function playRunwayAlertChime() {
  if (typeof window === "undefined") return;

  try {
    const Ctx = window.AudioContext || window.webkitAudioContext;
    if (!Ctx) return;

    if (!audioContext) audioContext = new Ctx();
    if (audioContext.state === "suspended") {
      audioContext.resume().catch(() => {});
    }

    const now = audioContext.currentTime;
    const notes = [523.25, 659.25, 783.99];

    notes.forEach((freq, i) => {
      const osc = audioContext.createOscillator();
      const gain = audioContext.createGain();
      osc.type = "sine";
      osc.frequency.value = freq;
      osc.connect(gain);
      gain.connect(audioContext.destination);

      const start = now + i * 0.12;
      gain.gain.setValueAtTime(0.0001, start);
      gain.gain.exponentialRampToValueAtTime(0.14, start + 0.04);
      gain.gain.exponentialRampToValueAtTime(0.0001, start + 0.45);
      osc.start(start);
      osc.stop(start + 0.5);
    });
  } catch {
    // Audio unavailable — notification still shows
  }
}
