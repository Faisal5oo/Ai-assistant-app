let successChimeUrl = null;
/** @type {Record<string, string>} */
const loopUrlCache = {};

function writeWavHeader(view, dataSize, sampleRate, numChannels = 1) {
  const writeStr = (offset, str) => {
    for (let i = 0; i < str.length; i++) {
      view.setUint8(offset + i, str.charCodeAt(i));
    }
  };
  writeStr(0, "RIFF");
  view.setUint32(4, 36 + dataSize, true);
  writeStr(8, "WAVE");
  writeStr(12, "fmt ");
  view.setUint32(16, 16, true);
  view.setUint16(20, 1, true);
  view.setUint16(22, numChannels, true);
  view.setUint32(24, sampleRate, true);
  view.setUint32(28, sampleRate * numChannels * 2, true);
  view.setUint16(32, numChannels * 2, true);
  view.setUint16(34, 16, true);
  writeStr(36, "data");
  view.setUint32(40, dataSize, true);
}

function createWavBlob(samples, sampleRate, numChannels = 1) {
  const dataSize = samples.length * 2;
  const buffer = new ArrayBuffer(44 + dataSize);
  const view = new DataView(buffer);
  writeWavHeader(view, dataSize, sampleRate, numChannels);
  for (let i = 0; i < samples.length; i++) {
    const clamped = Math.max(-1, Math.min(1, samples[i]));
    view.setInt16(44 + i * 2, clamped * 0x7fff, true);
  }
  return new Blob([buffer], { type: "audio/wav" });
}

function getSuccessChimeUrl() {
  if (successChimeUrl) return successChimeUrl;
  const sampleRate = 22050;
  const duration = 0.75;
  const numSamples = Math.floor(sampleRate * duration);
  const samples = new Float32Array(numSamples);
  const tones = [
    { freq: 392, start: 0, len: 0.28, gain: 0.22 },
    { freq: 523.25, start: 0.2, len: 0.35, gain: 0.2 },
    { freq: 659.25, start: 0.42, len: 0.33, gain: 0.16 },
  ];
  for (let i = 0; i < numSamples; i++) {
    const t = i / sampleRate;
    let sample = 0;
    for (const tone of tones) {
      if (t >= tone.start && t < tone.start + tone.len) {
        const local = t - tone.start;
        const env = Math.sin((Math.PI * local) / tone.len);
        sample += Math.sin(2 * Math.PI * tone.freq * local) * tone.gain * env;
      }
    }
    samples[i] = sample;
  }
  successChimeUrl = URL.createObjectURL(
    createWavBlob(samples, sampleRate)
  );
  return successChimeUrl;
}

let successChimeRef = null;

export function playDeepWorkSuccessChime() {
  if (typeof window === "undefined") return;
  try {
    if (!successChimeRef) {
      successChimeRef = new Audio(getSuccessChimeUrl());
      successChimeRef.volume = 0.45;
    }
    successChimeRef.currentTime = 0;
    void successChimeRef.play();
  } catch {
    /* autoplay blocked */
  }
}

function generateWhiteNoiseLoop() {
  const sampleRate = 22050;
  const duration = 3;
  const numSamples = Math.floor(sampleRate * duration);
  const samples = new Float32Array(numSamples);
  for (let i = 0; i < numSamples; i++) {
    samples[i] = (Math.random() * 2 - 1) * 0.12;
  }
  return URL.createObjectURL(createWavBlob(samples, sampleRate));
}

function generateBinauralLoop() {
  const sampleRate = 22050;
  const duration = 4;
  const numSamples = Math.floor(sampleRate * duration);
  const left = new Float32Array(numSamples);
  const right = new Float32Array(numSamples);
  const baseL = 200;
  const baseR = 210;
  for (let i = 0; i < numSamples; i++) {
    const t = i / sampleRate;
    const env = 0.08 + 0.02 * Math.sin(2 * Math.PI * 0.05 * t);
    left[i] = Math.sin(2 * Math.PI * baseL * t) * env;
    right[i] = Math.sin(2 * Math.PI * baseR * t) * env;
  }
  const interleaved = new Float32Array(numSamples * 2);
  for (let i = 0; i < numSamples; i++) {
    interleaved[i * 2] = left[i];
    interleaved[i * 2 + 1] = right[i];
  }
  return URL.createObjectURL(createWavBlob(interleaved, sampleRate, 2));
}

function generateRainLoop() {
  const sampleRate = 22050;
  const duration = 5;
  const numSamples = Math.floor(sampleRate * duration);
  const samples = new Float32Array(numSamples);
  let pink = 0;
  for (let i = 0; i < numSamples; i++) {
    const white = Math.random() * 2 - 1;
    pink = 0.98 * pink + 0.02 * white;
    const t = i / sampleRate;
    const drip =
      Math.sin(t * 47.3) * 0.015 + Math.sin(t * 83.1) * 0.01;
    samples[i] = pink * 0.14 + drip;
  }
  return URL.createObjectURL(createWavBlob(samples, sampleRate));
}

/** @param {import('@/lib/deepWorkConstants').SoundscapeId} id */
export function getSoundscapeLoopUrl(id) {
  if (loopUrlCache[id]) return loopUrlCache[id];
  switch (id) {
    case "binaural":
      loopUrlCache[id] = generateBinauralLoop();
      break;
    case "white-noise":
      loopUrlCache[id] = generateWhiteNoiseLoop();
      break;
    case "rain":
      loopUrlCache[id] = generateRainLoop();
      break;
    default:
      loopUrlCache[id] = generateWhiteNoiseLoop();
  }
  return loopUrlCache[id];
}
