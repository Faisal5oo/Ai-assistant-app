/** @typedef {'setup' | 'active' | 'recovery' | 'complete'} FlowPhase */

/** @typedef {'lofi-piano' | 'zen-flute' | 'cinematic-space'} FlowSoundscapeId */

export const FLOW_MIN_MINUTES = 15;
export const FLOW_MAX_MINUTES = 180;
export const FLOW_DEFAULT_MINUTES = 45;
export const FLOW_RECOVERY_SECONDS = 180;

export const FLOW_LAYOUT_TRANSITION = {
  type: "tween",
  ease: "easeInOut",
  duration: 0.4,
};

/** @type {{ id: FlowSoundscapeId; label: string; emoji: string; description: string }[]} */
export const FLOW_SOUNDSCAPES = [
  {
    id: "lofi-piano",
    label: "Celestial Lofi Piano",
    emoji: "♩",
    description: "Warm jazz chords with soft rain dust ambiance — 60 BPM",
  },
  {
    id: "zen-flute",
    label: "Monastic Zen Flute",
    emoji: "𝄞",
    description: "Deep acoustic bamboo flute notes over ambient mountain pads",
  },
  {
    id: "cinematic-space",
    label: "Cinematic Focus Space",
    emoji: "✦",
    description: "Evolving smooth synth pads with deep atmospheric swells",
  },
];
