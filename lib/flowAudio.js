import { playDeepWorkSuccessChime } from "@/lib/deepWorkAudio";
import {
  getSoundscapeLoopUrl as getDeepWorkLoopUrl,
} from "@/lib/deepWorkAudio";

/** @type {Record<string, string>} */
const flowLoopCache = {};

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

function generateMetronomeLoop() {
  const sampleRate = 22050;
  const bpm = 72;
  const beatInterval = 60 / bpm;
  const duration = beatInterval * 4;
  const numSamples = Math.floor(sampleRate * duration);
  const samples = new Float32Array(numSamples);
  const clickLen = Math.floor(sampleRate * 0.04);

  for (let beat = 0; beat < 4; beat++) {
    const start = Math.floor(beat * beatInterval * sampleRate);
    for (let i = 0; i < clickLen && start + i < numSamples; i++) {
      const t = i / sampleRate;
      const env = Math.exp(-t * 55);
      const freq = beat === 0 ? 880 : 660;
      samples[start + i] +=
        Math.sin(2 * Math.PI * freq * t) * 0.12 * env;
    }
  }

  return URL.createObjectURL(createWavBlob(samples, sampleRate));
}

/** @param {import('@/lib/flowConstants').FlowSoundscapeId} id */
export function getFlowSoundscapeUrl(id) {
  if (flowLoopCache[id]) return flowLoopCache[id];

  switch (id) {
    case "binaural-alpha":
      flowLoopCache[id] = getDeepWorkLoopUrl("binaural");
      break;
    case "forest-rain":
      flowLoopCache[id] = getDeepWorkLoopUrl("rain");
      break;
    case "focus-metronome":
      flowLoopCache[id] = generateMetronomeLoop();
      break;
    default:
      flowLoopCache[id] = getDeepWorkLoopUrl("binaural");
  }
  return flowLoopCache[id];
}

export function playFlowSessionChime() {
  playDeepWorkSuccessChime();
}
