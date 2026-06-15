/** @typedef {'setup' | 'active' | 'recap'} DeepWorkPhase */

/** @typedef {'cognitive_depletion' | 'external_friction' | 'dopamine_pull'} DeepWorkAbandonReason */

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

/** Grace window after declaring a research pivot (ms). */
export const RESEARCH_PIVOT_MS = 5 * 60 * 1000;

export const FRICTION_GATE_HEADLINE =
  "Let's calibrate your energy";

export const FRICTION_GATE_BODY =
  "Deep work requires massive cognitive fuel. Let's calibrate what interrupted your session so we can optimize your runway next time.";

/** @type {{ id: DeepWorkAbandonReason; label: string; description: string }[]} */
export const FRICTION_GATE_OPTIONS = [
  {
    id: "cognitive_depletion",
    label: "Cognitive Battery Depleted",
    description: "Your focus reserves are spent — recovery is the strategic move.",
  },
  {
    id: "external_friction",
    label: "Unexpected External Friction",
    description: "Something outside your control pulled you away from the chamber.",
  },
  {
    id: "dopamine_pull",
    label: "Dopamine Pull caught me off guard",
    description: "A distraction hijacked your attention before you could redirect it.",
  },
];
