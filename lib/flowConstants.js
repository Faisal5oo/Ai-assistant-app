/** @typedef {'setup' | 'active' | 'recovery' | 'complete'} FlowPhase */

/** @typedef {'binaural-alpha' | 'focus-metronome' | 'forest-rain'} FlowSoundscapeId */

export const FLOW_MIN_MINUTES = 15;
export const FLOW_MAX_MINUTES = 180;
export const FLOW_DEFAULT_MINUTES = 45;
export const FLOW_RECOVERY_SECONDS = 180;

export const FLOW_LAYOUT_TRANSITION = {
  type: "tween",
  ease: "easeInOut",
  duration: 0.4,
};

/** @type {{ id: FlowSoundscapeId; label: string; description: string }[]} */
export const FLOW_SOUNDSCAPES = [
  {
    id: "binaural-alpha",
    label: "Binaural Alpha Waves",
    description: "Gentle alpha-range entrainment for sustained focus",
  },
  {
    id: "focus-metronome",
    label: "Focus Metronome",
    description: "Soft rhythmic pulse to anchor attention",
  },
  {
    id: "forest-rain",
    label: "Deep Forest Rain",
    description: "Immersive rainfall ambience",
  },
];
