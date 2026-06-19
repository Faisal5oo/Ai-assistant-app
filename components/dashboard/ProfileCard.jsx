"use client";

import { motion, AnimatePresence } from "framer-motion";
import {
  ChevronDown,
  Laptop,
  Wallet,
  Heart,
  PiggyBank,
  Droplets,
  PersonStanding,
  Smartphone,
} from "lucide-react";
import { UserAvatar } from "@/components/ui/UserAvatar";
import { useTaskStore } from "@/store/useTaskStore";
import { useDashboard } from "@/hooks/queries/useDashboardQuery";
import { useTasks } from "@/hooks/queries/useTasksQuery";
import { formatMsToHoursMinutes } from "@/lib/utils";

const ACCORDION = [
  { id: "pension", label: "Focus sessions", icon: PiggyBank },
  { id: "devices", label: "Active projects", icon: Laptop },
  { id: "comp", label: "Time this week", icon: Wallet },
  { id: "benefits", label: "Wellness goals", icon: Heart },
];

const PANEL_SPRING = { duration: 0.22, ease: [0.4, 0, 0.2, 1] };

/** Renders a single wellness row: icon, label, and matched/total badge. */
function WellnessRow({ icon: Icon, label, matched, total }) {
  const pct = total > 0 ? Math.round((matched / total) * 100) : 0;
  return (
    <div className="flex items-center gap-3">
      <div className="flex h-8 w-8 shrink-0 items-center justify-center rounded-xl bg-charcoal/5">
        <Icon size={15} className="text-charcoal/55" />
      </div>
      <div className="min-w-0 flex-1">
        <p className="truncate text-xs font-medium text-charcoal/70">{label}</p>
        <div className="mt-1 flex h-1 overflow-hidden rounded-full bg-charcoal/10">
          <motion.div
            className="h-full rounded-full bg-gold"
            initial={false}
            animate={{ width: `${pct}%` }}
            transition={{ type: "spring", stiffness: 140, damping: 22 }}
          />
        </div>
      </div>
      <span className="shrink-0 text-xs tabular-nums text-charcoal/50">
        {matched}/{total}
      </span>
    </div>
  );
}

/** Renders the Focus Sessions panel */
function FocusSessionsPanel({ pomodoroDaily }) {
  const pct =
    pomodoroDaily.goal > 0
      ? Math.round((pomodoroDaily.completed / pomodoroDaily.goal) * 100)
      : 0;

  return (
    <div className="space-y-3 px-4 pb-4">
      <div className="flex items-end justify-between">
        <div>
          <p className="font-display text-2xl font-semibold tabular-nums">
            {pomodoroDaily.completed}
          </p>
          <p className="text-xs text-charcoal/50">
            of {pomodoroDaily.goal} pomodoros today
          </p>
        </div>
        <span className="rounded-full bg-charcoal/6 px-2 py-0.5 text-xs font-semibold text-charcoal/60">
          {pct}%
        </span>
      </div>
      <div className="flex h-2 overflow-hidden rounded-full bg-charcoal/10">
        <motion.div
          className="h-full rounded-full bg-gold"
          initial={false}
          animate={{ width: `${Math.min(pct, 100)}%` }}
          transition={{ type: "spring", stiffness: 120, damping: 20 }}
        />
      </div>
    </div>
  );
}

/** Renders the Active Projects panel */
function ActiveProjectsPanel({ tasks }) {
  const inProgress = tasks.filter((t) => t.status === "In-Progress");
  if (inProgress.length === 0) {
    return (
      <div className="px-4 pb-4">
        <p className="text-xs text-charcoal/40">No tasks in progress.</p>
      </div>
    );
  }
  return (
    <div className="space-y-2 px-4 pb-4">
      {inProgress.slice(0, 4).map((t) => (
        <div key={t.id} className="flex items-center gap-3">
          <div className="flex h-8 w-8 shrink-0 items-center justify-center rounded-2xl bg-charcoal/5">
            <Laptop size={15} className="text-charcoal/60" />
          </div>
          <div className="min-w-0">
            <p className="truncate text-xs font-medium">{t.title}</p>
            <p className="text-[10px] text-charcoal/40">{t.category}</p>
          </div>
        </div>
      ))}
      {inProgress.length > 4 && (
        <p className="text-xs text-charcoal/40">
          +{inProgress.length - 4} more
        </p>
      )}
    </div>
  );
}

/** Renders the Time This Week panel */
function TimeThisWeekPanel({ dailyLogs }) {
  const totalMs = dailyLogs.reduce((s, l) => s + (l.totalMs ?? 0), 0);
  const todayKey = new Date().toISOString().slice(0, 10);
  const todayMs = dailyLogs.find((l) => l.date === todayKey)?.totalMs ?? 0;

  return (
    <div className="space-y-3 px-4 pb-4">
      <div className="flex justify-between">
        <div>
          <p className="font-display text-2xl font-semibold tabular-nums">
            {totalMs > 0 ? formatMsToHoursMinutes(totalMs) : "0m"}
          </p>
          <p className="text-xs text-charcoal/50">total this week</p>
        </div>
        <div className="text-right">
          <p className="font-display text-lg font-semibold tabular-nums">
            {todayMs > 0 ? formatMsToHoursMinutes(todayMs) : "0m"}
          </p>
          <p className="text-xs text-charcoal/50">today</p>
        </div>
      </div>
    </div>
  );
}

/** Renders the Wellness Goals panel */
function WellnessPanel({ wellnessStats }) {
  const stats = wellnessStats ?? {
    hydration: { matched: 0, total: 0 },
    stretching: { matched: 0, total: 0 },
    phoneAvoidance: { matched: 0, total: 0 },
  };

  return (
    <div className="space-y-3 px-4 pb-4">
      <WellnessRow
        icon={Droplets}
        label="Hydration Sync"
        matched={stats.hydration.matched}
        total={stats.hydration.total}
      />
      <WellnessRow
        icon={PersonStanding}
        label="Stretch Intervals"
        matched={stats.stretching.matched}
        total={stats.stretching.total}
      />
      <WellnessRow
        icon={Smartphone}
        label="Phone-Free Focus"
        matched={stats.phoneAvoidance.matched}
        total={stats.phoneAvoidance.total}
      />
      {stats.hydration.total === 0 && (
        <p className="pt-1 text-xs text-charcoal/35">
          Wellness data populates after your first focus session.
        </p>
      )}
    </div>
  );
}

export function ProfileCard() {
  const userName = useTaskStore((s) => s.userName);
  const userAvatar = useTaskStore((s) => s.userAvatar);
  const openId = useTaskStore((s) => s.profileAccordionOpenId);
  const setOpenId = useTaskStore((s) => s.setProfileAccordionOpenId);

  const { pomodoroDaily, dailyLogs, wellnessStats } = useDashboard();
  const { tasks } = useTasks();

  return (
    <div className="flex flex-col gap-4">
      {/* Avatar card */}
      <motion.div layout className="glass-card relative overflow-hidden p-0">
        <div className="relative aspect-[4/5] bg-gradient-to-br from-cream-200 via-gold-light/40 to-charcoal/10">
          <UserAvatar
            name={userName}
            avatar={userAvatar}
            fill
            className="object-cover"
            sizes="(max-width: 1024px) 100vw, 25vw"
            fallbackClassName="absolute inset-0 flex items-center justify-center bg-gradient-to-br from-cream-200 via-gold-light/40 to-charcoal/10 font-display text-5xl font-semibold text-charcoal/70"
          />
        </div>
        <div className="absolute inset-x-0 bottom-0 bg-gradient-to-t from-charcoal/80 to-transparent p-5 pt-16">
          <div className="rounded-2xl border border-white/20 bg-white/20 p-4 backdrop-blur-md">
            <p className="font-display text-lg font-semibold text-white">
              {userName || "Your workspace"}
            </p>
            <p className="text-sm text-white/70">Productivity hub</p>
            <span className="mt-2 inline-block rounded-full bg-white/90 px-3 py-1 text-xs font-semibold text-charcoal">
              Pro Plan
            </span>
          </div>
        </div>
      </motion.div>

      {/* Accordion stack */}
      <div className="glass-card divide-y divide-charcoal/5 overflow-hidden p-2">
        {ACCORDION.map(({ id, label, icon: Icon }) => {
          const open = openId === id;
          return (
            <div key={id}>
              <button
                type="button"
                onClick={() => setOpenId(open ? null : id)}
                className="flex w-full items-center justify-between px-4 py-3 text-left text-sm font-medium"
              >
                <span className="flex items-center gap-2">
                  <Icon size={16} className="text-charcoal/50" />
                  {label}
                </span>
                <ChevronDown
                  size={16}
                  className={`transition-transform duration-200 ${open ? "rotate-180" : ""}`}
                />
              </button>

              <AnimatePresence initial={false}>
                {open && (
                  <motion.div
                    key={id}
                    initial={{ height: 0, opacity: 0 }}
                    animate={{ height: "auto", opacity: 1 }}
                    exit={{ height: 0, opacity: 0 }}
                    transition={PANEL_SPRING}
                    className="overflow-hidden"
                  >
                    {id === "pension" && (
                      <FocusSessionsPanel pomodoroDaily={pomodoroDaily} />
                    )}
                    {id === "devices" && (
                      <ActiveProjectsPanel tasks={tasks} />
                    )}
                    {id === "comp" && (
                      <TimeThisWeekPanel dailyLogs={dailyLogs} />
                    )}
                    {id === "benefits" && (
                      <WellnessPanel wellnessStats={wellnessStats} />
                    )}
                  </motion.div>
                )}
              </AnimatePresence>
            </div>
          );
        })}
      </div>
    </div>
  );
}
