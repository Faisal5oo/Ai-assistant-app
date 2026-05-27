/** @typedef {'setup' | 'active' | 'complete'} DeepWorkPhase */

/** @typedef {'binaural' | 'white-noise' | 'rain'} SoundscapeId */

export const DEEP_WORK_DURATIONS = [
  { minutes: 60, label: "60 min" },
  { minutes: 90, label: "90 min" },
  { minutes: 120, label: "120 min" },
];

/** @type {{ id: SoundscapeId; label: string; description: string }[]} */
export const SOUNDSCAPES = [
  {
    id: "binaural",
    label: "Binaural Focus Beats",
    description: "Gentle alpha-range entrainment",
  },
  {
    id: "white-noise",
    label: "White Noise",
    description: "Masks environmental chatter",
  },
  {
    id: "rain",
    label: "Deep Workspace Rain",
    description: "Soft rainfall ambience",
  },
];

export const ABANDON_PROMPT =
  "Deep work takes 20 minutes to truly enter. Are you sure you want to break your flow state?";
