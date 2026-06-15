"use client";



import { useMemo } from "react";

import { motion } from "framer-motion";

import { CalendarClock, Sparkles } from "lucide-react";

import Link from "next/link";

import { useCurrentClock } from "@/hooks/useCurrentClock";

import { useTaskStore } from "@/store/useTaskStore";

import {

  formatHourRangeLabel,

  getActiveRunwayAllocations,

  getCurrentHour,

  getHourProgress,

} from "@/lib/timeBlocking";

import { StartFocusSessionButton } from "@/components/runway/StartFocusSessionButton";



/**

 * Premium hero surfaced when the live hour block has runway tasks.

 * @param {Object} props

 * @param {import('@/types/interfaces').Task[]} props.tasks

 */

export function ActiveTimeBlockHero({ tasks }) {

  const now = useCurrentClock(30000);

  const currentHour = useMemo(() => getCurrentHour(now), [now]);

  const allocations = useMemo(

    () => getActiveRunwayAllocations(tasks, currentHour),

    [tasks, currentHour]

  );

  const progress = useMemo(() => getHourProgress(now) * 100, [now]);

  const isTimerRunning = useTaskStore((s) => s.activeTimer.isRunning);

  const activeTaskId = useTaskStore((s) => s.activeTimer.taskId);



  if (allocations.length === 0) return null;



  const primary = allocations[0];

  const sessionActive =

    isTimerRunning && activeTaskId === primary.task.id;



  return (

    <motion.div

      layout

      initial={{ opacity: 0, y: 12 }}

      animate={{ opacity: 1, y: 0 }}

      transition={{ duration: 0.45, ease: [0.22, 1, 0.36, 1] }}

      className="relative mb-4 overflow-hidden rounded-3xl border border-gold/30 bg-gradient-to-br from-charcoal via-charcoal/95 to-[#1a1814] p-4 shadow-[0_0_40px_rgba(250,204,21,0.15)]"

    >

      <div

        className="pointer-events-none absolute inset-0 opacity-70"

        aria-hidden

        style={{

          backgroundImage:

            "radial-gradient(circle at 85% 15%, rgba(250,204,21,0.22), transparent 45%)",

        }}

      />



      <div className="relative flex flex-wrap items-start justify-between gap-4">

        <div className="flex min-w-0 flex-1 items-start gap-3">

          <div className="flex h-11 w-11 shrink-0 items-center justify-center rounded-2xl bg-gold/30 text-charcoal shadow-glass">

            <CalendarClock size={20} />

          </div>

          <div className="min-w-0 flex-1">

            <div className="flex flex-wrap items-center gap-2">

              <p className="text-[10px] font-bold uppercase tracking-[0.2em] text-gold">

                Your block is live

              </p>

              <span className="inline-flex items-center gap-1 rounded-full bg-gold/25 px-2 py-0.5 text-[10px] font-semibold text-charcoal">

                <Sparkles size={10} />

                Now

              </span>

            </div>

            <p className="mt-1 font-display text-lg font-semibold tracking-tight text-white">

              {formatHourRangeLabel(currentHour)}

            </p>

            <p className="mt-0.5 text-xs text-white/55">

              {sessionActive

                ? `${Math.round(progress)}% through this hour — focus session active.`

                : `${Math.round(progress)}% through this hour — confirm you're at your desk to begin.`}

            </p>

          </div>

        </div>



        <div className="flex shrink-0 flex-col items-end gap-2">

          <StartFocusSessionButton

            taskId={primary.task.id}

            durationMinutes={primary.durationMinutes}

            variant="hero"

          />

          <Link

            href="/productivity/time-blocking"

            className="text-[11px] font-medium text-white/50 transition hover:text-white/80"

          >

            Open runway →

          </Link>

        </div>

      </div>



      <ul className="relative mt-3 space-y-2">

        {allocations.map(({ task, durationMinutes }) => (

          <li

            key={task.id}

            className="flex items-center justify-between gap-3 rounded-2xl border border-white/10 bg-white/[0.06] px-3 py-2.5"

          >

            <div className="min-w-0">

              <p className="truncate text-sm font-medium text-white">

                {task.title}

              </p>

              <p className="text-xs text-white/45">

                {task.category}

                {task.priority === "High" && (

                  <span className="ml-2 rounded-full bg-gold/30 px-1.5 py-0.5 font-semibold text-charcoal">

                    High

                  </span>

                )}

              </p>

            </div>

            <span className="shrink-0 rounded-full bg-gold/20 px-2.5 py-1 text-xs font-semibold tabular-nums text-gold">

              {durationMinutes}m

            </span>

          </li>

        ))}

      </ul>



      <div className="relative mt-3 h-1.5 overflow-hidden rounded-full bg-white/10">

        <motion.div

          className="h-full rounded-full bg-gradient-to-r from-gold to-amber-300"

          initial={false}

          animate={{ width: `${progress}%` }}

          transition={{ duration: 0.4, ease: "easeOut" }}

        />

      </div>

    </motion.div>

  );

}


