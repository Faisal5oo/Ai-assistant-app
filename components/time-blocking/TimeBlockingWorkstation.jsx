"use client";

import { useCallback, useMemo } from "react";
import Link from "next/link";
import { LayoutGroup, motion } from "framer-motion";
import { ArrowLeft, CalendarClock } from "lucide-react";
import { useTaskStore } from "@/store/useTaskStore";
import { useTasks } from "@/hooks/queries/useTasksQuery";
import { useCurrentClock } from "@/hooks/useCurrentClock";
import {
  buildSlotAssignmentMap,
  getCurrentHour,
  getUnassignedTasks,
} from "@/lib/timeBlocking";
import { format } from "@/lib/utils";
import { ActiveRunwayBar } from "./ActiveRunwayBar";
import { BrainDumpPanel } from "./BrainDumpPanel";
import { Timeline24Hour } from "./Timeline24Hour";

export function TimeBlockingWorkstation() {
  const { tasks } = useTasks();
  const assignTimeBlock = useTaskStore((s) => s.assignTimeBlock);
  const unassignTimeBlock = useTaskStore((s) => s.unassignTimeBlock);

  const now = useCurrentClock(60000);
  const currentHour = useMemo(() => getCurrentHour(now), [now]);

  const slotMap = useMemo(() => buildSlotAssignmentMap(tasks), [tasks]);

  const openTasks = useMemo(
    () => tasks.filter((t) => t.status !== "Completed"),
    [tasks]
  );

  const unassignedTasks = useMemo(
    () => getUnassignedTasks(tasks, slotMap),
    [tasks, slotMap]
  );

  const activeRunwayTask = useMemo(
    () => slotMap[currentHour] ?? null,
    [slotMap, currentHour]
  );

  const handleAssign = useCallback(
    (hour, taskId) => {
      assignTimeBlock(taskId, hour);
    },
    [assignTimeBlock]
  );

  const handleClear = useCallback(
    (taskId) => {
      unassignTimeBlock(taskId);
    },
    [unassignTimeBlock]
  );

  const todayLabel = format(new Date(), "EEEE, MMM d");

  return (
    <motion.div
      initial={{ opacity: 0, y: 20 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ duration: 0.5, ease: [0.22, 1, 0.36, 1] }}
      className="pb-10"
    >
      <Link
        href="/productivity"
        className="mb-6 inline-flex items-center gap-2 text-sm font-medium text-charcoal/50 transition hover:text-charcoal"
      >
        <ArrowLeft size={16} />
        Productivity hub
      </Link>

      <div className="mb-8 flex flex-wrap items-start justify-between gap-4">
        <div>
          <div className="mb-3 flex h-12 w-12 items-center justify-center rounded-2xl bg-gold/30 text-charcoal shadow-glass">
            <CalendarClock size={24} />
          </div>
          <h1 className="font-display text-3xl font-semibold tracking-tight text-charcoal">
            Time Blocking
          </h1>
          <p className="mt-2 max-w-2xl text-sm leading-relaxed text-charcoal/50">
            A minimalist 24-hour runway — collapse quiet hours, allocate with a
            tap, and execute the block you are in right now.
          </p>
        </div>
        <p className="rounded-full border border-white/70 bg-white/60 px-4 py-2 text-sm font-medium tracking-wide text-charcoal/60 shadow-glass">
          {todayLabel}
        </p>
      </div>

      <ActiveRunwayBar
        activeTask={activeRunwayTask}
        currentHour={currentHour}
      />

      <LayoutGroup id="time-blocking-day">
        <div className="grid gap-6 lg:grid-cols-[1fr_300px] xl:grid-cols-[1fr_320px]">
          <Timeline24Hour
            slotMap={slotMap}
            openTasks={openTasks}
            currentHour={currentHour}
            onAssign={handleAssign}
            onClear={handleClear}
          />
          <BrainDumpPanel tasks={unassignedTasks} />
        </div>
      </LayoutGroup>
    </motion.div>
  );
}
