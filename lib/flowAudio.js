import { playDeepWorkSuccessChime } from "@/lib/deepWorkAudio";

// ─── Audio element pool ────────────────────────────────────────────────────────
// One HTMLAudioElement per track ID, created lazily and reused across the
// session. When a track is swapped out, the old element is paused and its src
// cleared so the browser can GC the decoded audio data.

/** @type {Map<string, HTMLAudioElement>} */
const audioPool = new Map();

/** @type {Map<string, string>} */
const blobUrlCache = new Map();

/**
 * Revoke all blob URLs and release all audio elements that are NOT the
 * currently active track. Call this when switching tracks to prevent leaks.
 *
 * @param {string} keepId — the track that should stay alive
 */
function releaseInactiveTracks(keepId) {
  for (const [id, el] of audioPool.entries()) {
    if (id === keepId) continue;
    el.pause();
    el.src = "";
    el.load();
    audioPool.delete(id);
  }
  for (const [id, url] of blobUrlCache.entries()) {
    if (id === keepId) continue;
    URL.revokeObjectURL(url);
    blobUrlCache.delete(id);
  }
}

// ─── OfflineAudioContext helpers ──────────────────────────────────────────────

/**
 * Render audio offline and return a loopable blob URL.
 * Uses OfflineAudioContext so all synthesis runs off the main thread
 * (in the rendering engine's audio thread), producing zero frame drops.
 *
 * @param {number} sampleRate
 * @param {number} durationSeconds
 * @param {(ctx: OfflineAudioContext) => void} buildGraph
 * @returns {Promise<string>} blob: URL pointing to a WAV file
 */
async function renderToBlob(sampleRate, durationSeconds, buildGraph) {
  const numFrames = Math.ceil(sampleRate * durationSeconds);
  const ctx = new OfflineAudioContext(2, numFrames, sampleRate);
  buildGraph(ctx);
  const buffer = await ctx.startRendering();
  return audioBufferToWavBlobUrl(buffer);
}

/** @param {AudioBuffer} buffer */
function audioBufferToWavBlobUrl(buffer) {
  const numCh = buffer.numberOfChannels;
  const numFrames = buffer.length;
  const sampleRate = buffer.sampleRate;
  const bytesPerSample = 2;
  const dataSize = numFrames * numCh * bytesPerSample;
  const ab = new ArrayBuffer(44 + dataSize);
  const view = new DataView(ab);

  const writeStr = (offset, str) => {
    for (let i = 0; i < str.length; i++) view.setUint8(offset + i, str.charCodeAt(i));
  };
  writeStr(0, "RIFF");
  view.setUint32(4, 36 + dataSize, true);
  writeStr(8, "WAVE");
  writeStr(12, "fmt ");
  view.setUint32(16, 16, true);
  view.setUint16(20, 1, true);
  view.setUint16(22, numCh, true);
  view.setUint32(24, sampleRate, true);
  view.setUint32(28, sampleRate * numCh * bytesPerSample, true);
  view.setUint16(32, numCh * bytesPerSample, true);
  view.setUint16(34, 16, true);
  writeStr(36, "data");
  view.setUint32(40, dataSize, true);

  // Interleave channels
  let offset = 44;
  for (let i = 0; i < numFrames; i++) {
    for (let ch = 0; ch < numCh; ch++) {
      const sample = Math.max(-1, Math.min(1, buffer.getChannelData(ch)[i]));
      view.setInt16(offset, sample < 0 ? sample * 0x8000 : sample * 0x7fff, true);
      offset += 2;
    }
  }

  return URL.createObjectURL(new Blob([ab], { type: "audio/wav" }));
}

// ─── Musical utility ──────────────────────────────────────────────────────────

/** Convert a MIDI note number to its frequency in Hz */
const midiToHz = (note) => 440 * Math.pow(2, (note - 69) / 12);

/**
 * Add a sine-based oscillator node with ADSR envelope to the offline context.
 *
 * @param {OfflineAudioContext} ctx
 * @param {number} freq — Hz
 * @param {number} startTime — seconds
 * @param {number} duration — seconds
 * @param {number} gain — peak amplitude
 * @param {{ attack?: number; decay?: number; sustain?: number; release?: number }} [adsr]
 * @param {'sine'|'triangle'|'sawtooth'|'square'} [type]
 */
function addOscNode(ctx, freq, startTime, duration, gain, adsr = {}, type = "sine") {
  const { attack = 0.08, decay = 0.1, sustain = 0.7, release = 0.4 } = adsr;
  const osc = ctx.createOscillator();
  const env = ctx.createGain();

  osc.type = type;
  osc.frequency.value = freq;

  env.gain.setValueAtTime(0, startTime);
  env.gain.linearRampToValueAtTime(gain, startTime + attack);
  env.gain.linearRampToValueAtTime(gain * sustain, startTime + attack + decay);
  env.gain.setValueAtTime(gain * sustain, startTime + duration - release);
  env.gain.linearRampToValueAtTime(0, startTime + duration);

  osc.connect(env);
  env.connect(ctx.destination);
  osc.start(startTime);
  osc.stop(startTime + duration);
}

/**
 * Add a softly detuned pad voice (triangle + slight freq shimmer).
 *
 * @param {OfflineAudioContext} ctx
 * @param {number} freq
 * @param {number} startTime
 * @param {number} duration
 * @param {number} gain
 * @param {number} [detuneHz] — additional detuning offset in Hz
 */
function addPadVoice(ctx, freq, startTime, duration, gain, detuneHz = 0) {
  addOscNode(
    ctx,
    freq + detuneHz,
    startTime,
    duration,
    gain,
    { attack: 0.6, decay: 0.2, sustain: 0.85, release: 0.8 },
    "triangle"
  );
}

// ─── Track 1: Celestial Lofi Piano ───────────────────────────────────────────
// Warm jazz chord progression: Cmaj7 → Am7 → Fmaj7 → G7
// 60 BPM, 4 bars per loop (16 seconds), soft piano envelope on each note.
// A subtle stochastic rain texture is layered underneath.

async function generateLofiPiano() {
  const SR = 44100;
  const BPM = 60;
  const BEAT = 60 / BPM;          // 1 second per beat at 60BPM
  const BAR = BEAT * 4;            // 4 seconds per bar
  const LOOP_DURATION = BAR * 4;   // 16 seconds total

  return renderToBlob(SR, LOOP_DURATION, (ctx) => {
    // Piano ADSR — percussive attack, quick decay, medium sustain, medium release
    const PIANO = { attack: 0.005, decay: 0.25, sustain: 0.45, release: 0.6 };

    // Chord voicings (MIDI note numbers → Hz)
    // Cmaj7:  C4 E4 G4 B4
    const Cmaj7 = [60, 64, 67, 71];
    // Am7:    A3 C4 E4 G4
    const Am7   = [57, 60, 64, 67];
    // Fmaj7:  F3 A3 C4 E4
    const Fmaj7 = [53, 57, 60, 64];
    // G7:     G3 B3 D4 F4
    const G7    = [55, 59, 62, 65];

    const progression = [Cmaj7, Am7, Fmaj7, G7];

    // Strum each chord: root on beat 1, inner voices slightly staggered
    progression.forEach((chord, barIdx) => {
      const barStart = barIdx * BAR;
      chord.forEach((note, noteIdx) => {
        const strum = noteIdx * 0.03; // 30ms stagger per voice
        addOscNode(ctx, midiToHz(note), barStart + strum, BAR * 0.85, 0.055, PIANO, "sine");
      });

      // Add a walking bass note on beat 3
      const bass = chord[0] - 12; // octave below root
      addOscNode(ctx, midiToHz(bass), barStart + BEAT * 2, BEAT * 1.8, 0.07, PIANO, "triangle");
    });

    // Melody line: simple pentatonic phrases over the progression
    // C D E G A — scale degrees land on every other beat
    const MELODY_NOTES = [72, 74, 76, 79, 81, 79, 76, 74]; // C5 D5 E5 G5 A5 descend
    const MELODY_GAIN = 0.04;
    const MEL_ADSR = { attack: 0.01, decay: 0.12, sustain: 0.55, release: 0.35 };
    MELODY_NOTES.forEach((note, i) => {
      const t = i * BEAT * 2;
      if (t < LOOP_DURATION) {
        addOscNode(ctx, midiToHz(note), t, BEAT * 1.6, MELODY_GAIN, MEL_ADSR, "sine");
      }
    });

    // Rain texture: filtered white noise burst with fast envelope
    // Represented as many very short triangle pulses at randomised pitches
    const RAIN_DENSITY = Math.floor(SR * LOOP_DURATION * 0.001); // sparse
    for (let i = 0; i < 120; i++) {
      const t = Math.random() * LOOP_DURATION;
      const freq = 600 + Math.random() * 2400;
      addOscNode(ctx, freq, t, 0.04 + Math.random() * 0.08, 0.003 + Math.random() * 0.004, {
        attack: 0.001, decay: 0.02, sustain: 0.1, release: 0.04,
      }, "sine");
    }
    void RAIN_DENSITY; // suppress lint

    // Soft pad underneath: sustained Cmaj chord
    [60, 64, 67].forEach((note, i) => {
      addPadVoice(ctx, midiToHz(note), 0, LOOP_DURATION, 0.012, i * 0.15);
    });
  });
}

// ─── Track 2: Monastic Zen Flute ─────────────────────────────────────────────
// Bamboo flute character: breathy sine + triangle blend with vibrato LFO.
// Pentatonic phrases in D minor pentatonic: D E F A C
// Mountain stream pad: slow-attack sustained open fifths beneath.

async function generateZenFlute() {
  const SR = 44100;
  const LOOP_DURATION = 20; // 20 seconds

  return renderToBlob(SR, LOOP_DURATION, (ctx) => {
    // D minor pentatonic: D4 E4 F4 A4 C5 D5
    const SCALE = [62, 64, 65, 69, 72, 74];
    const FLUTE_ADSR = { attack: 0.18, decay: 0.05, sustain: 0.9, release: 0.55 };

    // Flute phrases — long held notes with slight vibrato effect via two
    // slightly detuned oscillators beating against each other (~5Hz vibrato)
    const phrases = [
      { note: SCALE[0], start: 0.5,   dur: 3.0 },  // D4
      { note: SCALE[3], start: 4.0,   dur: 2.5 },  // A4
      { note: SCALE[2], start: 7.0,   dur: 3.5 },  // F4
      { note: SCALE[1], start: 11.0,  dur: 2.0 },  // E4
      { note: SCALE[4], start: 13.5,  dur: 3.5 },  // C5
      { note: SCALE[5], start: 17.0,  dur: 2.5 },  // D5
    ];

    phrases.forEach(({ note, start, dur }) => {
      const hz = midiToHz(note);
      // Primary sine — flute body
      addOscNode(ctx, hz, start, dur, 0.08, FLUTE_ADSR, "sine");
      // Vibrato: slightly detuned triangle (+4Hz) for the breathy wobble
      addOscNode(ctx, hz + 4, start + 0.05, dur - 0.05, 0.025, FLUTE_ADSR, "triangle");
      // Breathiness: very quiet triangle at octave up
      addOscNode(ctx, hz * 2, start + 0.1, dur * 0.7, 0.008, {
        attack: 0.25, decay: 0.1, sustain: 0.5, release: 0.4,
      }, "triangle");
    });

    // Mountain stream pad: open fifth D2–A2, very slow attack, pp volume
    // Sustained for entire loop
    [[38, 45], [45, 52]].forEach(([root, fifth]) => {
      addPadVoice(ctx, midiToHz(root), 0, LOOP_DURATION, 0.018, 0);
      addPadVoice(ctx, midiToHz(fifth), 0.3, LOOP_DURATION - 0.3, 0.014, 0.2);
    });

    // Water droplet percussive accents (very soft)
    const dropTimes = [1.2, 3.8, 6.1, 9.4, 12.7, 15.3, 18.1];
    dropTimes.forEach((t) => {
      addOscNode(ctx, 880, t, 0.12, 0.02, { attack: 0.001, decay: 0.06, sustain: 0.1, release: 0.08 }, "sine");
      addOscNode(ctx, 1320, t + 0.01, 0.08, 0.012, { attack: 0.001, decay: 0.04, sustain: 0.05, release: 0.05 }, "sine");
    });

    // High harmonics shimmer — sparse triangle pulses arpeggiating D pentatonic
    const SHIMMER = [74, 76, 79, 81]; // D5 E5 G5 A5
    [2.5, 5.5, 9.0, 14.0, 17.5].forEach((t, i) => {
      addOscNode(ctx, midiToHz(SHIMMER[i % SHIMMER.length]), t, 0.6, 0.015, {
        attack: 0.05, decay: 0.1, sustain: 0.4, release: 0.35,
      }, "sine");
    });
  });
}

// ─── Track 3: Cinematic Focus Space ──────────────────────────────────────────
// Evolving atmospheric synth pads: Tron-style majestic quality.
// Slow-moving cluster: stacked open 5ths in A minor, detuned slightly for
// richness. Long attack swell, sparse melodic accent every 8 bars.

async function generateCinematicSpace() {
  const SR = 44100;
  const LOOP_DURATION = 24; // 24 seconds — long slow evolving texture

  return renderToBlob(SR, LOOP_DURATION, (ctx) => {
    // Foundation: A minor tonic — A2 E3 A3
    const FOUNDATION = [45, 52, 57]; // A2 E3 A3
    FOUNDATION.forEach((note, i) => {
      // Three slightly detuned voices per note for chorus/ensemble width
      [-0.8, 0, 0.8].forEach((detuneCents) => {
        const hz = midiToHz(note) * Math.pow(2, detuneCents / 1200);
        const env = {
          attack: 2.5 + i * 0.4,
          decay: 0.5,
          sustain: 0.88,
          release: 3.0,
        };
        addOscNode(ctx, hz, 0, LOOP_DURATION, 0.028, env, "triangle");
      });
    });

    // Mid layer: C major chord (relative major) phases in midway
    const MID = [48, 55, 60]; // C2 G2 C3
    MID.forEach((note, i) => {
      const hz = midiToHz(note);
      addPadVoice(ctx, hz, 4.0 + i * 0.6, LOOP_DURATION - 4.0 - i * 0.6, 0.018, i * 0.3);
    });

    // High register shimmer: E5 then A5, long sustain, very soft
    [76, 81].forEach((note, i) => {
      const hz = midiToHz(note);
      const start = 6 + i * 5;
      addOscNode(ctx, hz, start, LOOP_DURATION - start, 0.012, {
        attack: 3.0, decay: 0.3, sustain: 0.8, release: 4.0,
      }, "sine");
      // Slight detune for stereo width in L channel (via second osc at hz+1Hz)
      addOscNode(ctx, hz + 1.1, start + 0.5, LOOP_DURATION - start - 0.5, 0.008, {
        attack: 3.0, decay: 0.3, sustain: 0.8, release: 4.0,
      }, "sine");
    });

    // Majestic melodic accent: rising A minor arpeggio A3–C4–E4–A4
    const ARPEGIO = [57, 60, 64, 69];
    const ARP_START = 10;
    ARPEGIO.forEach((note, i) => {
      const t = ARP_START + i * 1.8;
      addOscNode(ctx, midiToHz(note), t, 5.5 - i * 0.3, 0.038, {
        attack: 0.4, decay: 0.2, sustain: 0.75, release: 1.5,
      }, "sine");
    });

    // Sub-bass pulse: A1 very gently throbbing once per 6 seconds
    [0, 6, 12, 18].forEach((t) => {
      addOscNode(ctx, midiToHz(33), t, 5.5, 0.04, {
        attack: 1.5, decay: 0.5, sustain: 0.6, release: 2.0,
      }, "triangle");
    });

    // Tron-style high-frequency carrier shimmer: gated triangle at 2093Hz (C7)
    [3, 9, 15, 21].forEach((t) => {
      addOscNode(ctx, 2093, t, 1.2, 0.006, {
        attack: 0.3, decay: 0.2, sustain: 0.5, release: 0.5,
      }, "triangle");
    });
  });
}

// ─── Public API ───────────────────────────────────────────────────────────────

/**
 * Return (or lazily initialise) the HTMLAudioElement for the given track.
 * Each track is rendered once and cached as a blob URL; the Audio element is
 * pooled so switching tracks doesn't create more than three live elements.
 *
 * @param {import('@/lib/flowConstants').FlowSoundscapeId} id
 * @returns {Promise<HTMLAudioElement>}
 */
export async function getFlowAudioElement(id) {
  if (audioPool.has(id)) {
    return /** @type {HTMLAudioElement} */ (audioPool.get(id));
  }

  // Generate the blob URL if not yet done
  if (!blobUrlCache.has(id)) {
    let url;
    switch (id) {
      case "lofi-piano":
        url = await generateLofiPiano();
        break;
      case "zen-flute":
        url = await generateZenFlute();
        break;
      case "cinematic-space":
        url = await generateCinematicSpace();
        break;
      default:
        url = await generateLofiPiano();
    }
    blobUrlCache.set(id, url);
  }

  const el = new Audio(/** @type {string} */ (blobUrlCache.get(id)));
  el.loop = true;
  el.preload = "auto";
  audioPool.set(id, el);
  return el;
}

/**
 * Release all cached audio elements except the one for `keepId`.
 * Call before switching tracks to prevent memory leaks.
 *
 * @param {string} keepId
 */
export function releaseFlowAudioExcept(keepId) {
  releaseInactiveTracks(keepId);
}

/**
 * Release all cached audio elements and blob URLs entirely.
 * Call on workstation unmount.
 */
export function releaseAllFlowAudio() {
  for (const [, el] of audioPool.entries()) {
    el.pause();
    el.src = "";
    el.load();
  }
  audioPool.clear();
  for (const [, url] of blobUrlCache.entries()) {
    URL.revokeObjectURL(url);
  }
  blobUrlCache.clear();
}

export function playFlowSessionChime() {
  playDeepWorkSuccessChime();
}
