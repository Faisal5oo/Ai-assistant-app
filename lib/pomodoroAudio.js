let chimeUrl = null;

/** Build a short, soft two-tone WAV and play via HTML5 Audio */
function getChimeUrl() {
  if (chimeUrl) return chimeUrl;

  const sampleRate = 22050;
  const duration = 0.55;
  const numSamples = Math.floor(sampleRate * duration);
  const dataSize = numSamples * 2;
  const buffer = new ArrayBuffer(44 + dataSize);
  const view = new DataView(buffer);

  const writeStr = (offset, str) => {
    for (let i = 0; i < str.length; i++) view.setUint8(offset + i, str.charCodeAt(i));
  };

  writeStr(0, "RIFF");
  view.setUint32(4, 36 + dataSize, true);
  writeStr(8, "WAVE");
  writeStr(12, "fmt ");
  view.setUint32(16, 16, true);
  view.setUint16(20, 1, true);
  view.setUint16(22, 1, true);
  view.setUint32(24, sampleRate, true);
  view.setUint32(28, sampleRate * 2, true);
  view.setUint16(32, 2, true);
  view.setUint16(34, 16, true);
  writeStr(36, "data");
  view.setUint32(40, dataSize, true);

  const tones = [
    { freq: 523.25, start: 0, len: 0.22, gain: 0.35 },
    { freq: 659.25, start: 0.18, len: 0.32, gain: 0.28 },
  ];

  for (let i = 0; i < numSamples; i++) {
    const t = i / sampleRate;
    let sample = 0;
    for (const tone of tones) {
      if (t >= tone.start && t < tone.start + tone.len) {
        const local = t - tone.start;
        const env = Math.sin((Math.PI * local) / tone.len);
        sample +=
          Math.sin(2 * Math.PI * tone.freq * local) * tone.gain * env;
      }
    }
    const clamped = Math.max(-1, Math.min(1, sample));
    view.setInt16(44 + i * 2, clamped * 0x7fff, true);
  }

  chimeUrl = URL.createObjectURL(new Blob([buffer], { type: "audio/wav" }));
  return chimeUrl;
}

let chimeRef = null;

export function playPomodoroChime() {
  if (typeof window === "undefined") return;
  try {
    if (!chimeRef) {
      chimeRef = new Audio(getChimeUrl());
      chimeRef.volume = 0.5;
    }
    chimeRef.currentTime = 0;
    void chimeRef.play();
  } catch {
    /* autoplay blocked */
  }
}
