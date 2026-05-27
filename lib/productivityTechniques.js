import {
  Timer,
  CalendarClock,
  Brain,
  Layers,
  Grid2x2,
  Zap,
} from "lucide-react";

/** @type {import('@/types/interfaces').TechniqueCardConfig[]} */
export const TECHNIQUES = [
  {
    id: "pomodoro",
    title: "Pomodoro Technique",
    description:
      "Work in focused 25-minute sprints followed by short breaks. Ideal for maintaining energy and avoiding burnout on repetitive tasks.",
    icon: Timer,
    actionLabel: "Open workstation",
    actionType: "timer",
    href: "/productivity/pomodoro",
    targetMs: 25 * 60 * 1000,
  },
  {
    id: "time-blocking",
    title: "Time Blocking",
    description:
      "Assign fixed time slots to tasks on your calendar. Reduces context switching by making commitments visible and concrete.",
    icon: CalendarClock,
    actionLabel: "Open workstation",
    actionType: "modal",
    href: "/productivity/time-blocking",
  },
  {
    id: "deep-work",
    title: "Deep Work",
    description:
      "Eliminate distractions for extended 90-minute sessions dedicated to cognitively demanding work that creates real value.",
    icon: Brain,
    actionLabel: "Open workstation",
    actionType: "timer",
    href: "/productivity/deep-work",
    targetMs: 90 * 60 * 1000,
  },
  {
    id: "batching",
    title: "Task Batching",
    description:
      "Group similar tasks (emails, reviews, admin) and complete them in one session to minimize switching costs.",
    icon: Layers,
    actionLabel: "Open workstation",
    actionType: "modal",
    href: "/productivity/task-batching",
  },
  {
    id: "eisenhower",
    title: "Eisenhower Matrix",
    description:
      "Prioritize by urgency and importance. Start the highest-impact task that is both urgent and important.",
    icon: Grid2x2,
    actionLabel: "Open workstation",
    actionType: "modal",
    href: "/productivity/eisenhower",
  },
  {
    id: "flow",
    title: "Flow State",
    description:
      "Enter uninterrupted flow with a 45-minute session matched to your skill level and challenge — the sweet spot for productivity.",
    icon: Zap,
    actionLabel: "Open workstation",
    actionType: "timer",
    href: "/productivity/flow",
    targetMs: 45 * 60 * 1000,
  },
];
