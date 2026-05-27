/** @type {Record<'work' | 'shortBreak' | 'longBreak', number>} */
export const POMODORO_SECONDS = {
  work: 25 * 60,
  shortBreak: 5 * 60,
  longBreak: 15 * 60,
};

export const POMODORO_DAILY_GOAL = 4;

/** @type {Record<'work' | 'shortBreak' | 'longBreak', string>} */
export const PHASE_LABELS = {
  work: "Focus",
  shortBreak: "Short Break",
  longBreak: "Long Break",
};

export const BREAK_PROMPTS = [
  "Inhale for 4 counts, exhale for 6 — soften your shoulders.",
  "Roll your wrists and neck slowly; release screen tension.",
  "Stand, reach overhead, and take three full belly breaths.",
  "Look 20 feet away for 20 seconds; blink slowly and reset.",
  "Walk to a window, notice one detail outside, then return.",
  "Stretch hip flexors: gentle lunge each side for 15 seconds.",
];
