"use client";



import { useMemo } from "react";

import { motion } from "framer-motion";

import { useCurrentClock } from "@/hooks/useCurrentClock";

import { useTaskStore } from "@/store/useTaskStore";

import { useTimerTick } from "@/hooks/useTimerTick";

import { formatHourRangeLabel, getHourProgress } from "@/lib/timeBlocking";

import { formatMsToTimer } from "@/lib/utils";

import { StartFocusSessionButton } from "@/components/runway/StartFocusSessionButton";



/**

 * @param {Object} props

 * @param {import('@/lib/time-block-allocations').SlotAllocation[]} props.allocations

 * @param {number} props.currentHour

 */

export function ActiveRunwayBar({ allocations, currentHour }) {

  const now = useCurrentClock(1000);

  const isRunning = useTaskStore((s) => s.activeTimer.isRunning);

  const activeTaskId = useTaskStore((s) => s.activeTimer.taskId);

  const displayMs = useTimerTick();



  const progress = useMemo(() => getHourProgress(now) * 100, [now]);

  const rangeLabel = formatHourRangeLabel(currentHour);

  const primary = allocations[0] ?? null;

  const isFocusOnBlock =

    isRunning && primary && activeTaskId === primary.task.id;



  return (

    <motion.div

      layout

      initial={{ opacity: 0, y: -10 }}

      animate={{ opacity: 1, y: 0 }}

      className="glass-card-dark mb-6 overflow-hidden p-5 md:p-6"

    >

      <div className="mb-4 flex flex-wrap items-start justify-between gap-4">

        <div>

          <p className="text-xs font-medium uppercase tracking-wider text-white/50">

            Active runway · now

          </p>

          <p className="font-display text-xl font-semibold tracking-tight">

            {rangeLabel}

          </p>

          {allocations.length > 0 ? (

            <div className="mt-2 space-y-1">

              {allocations.map(({ task, durationMinutes }) => (

                <p key={task.id} className="text-sm text-white/75">

                  {task.title}

                  <span className="ml-2 text-xs text-white/45 tabular-nums">

                    {durationMinutes}m

                  </span>

                </p>

              ))}

            </div>

          ) : (

            <p className="mt-1 text-sm text-white/60">

              No task on this hour — tap an empty slot to allocate.

            </p>

          )}

        </div>

        {primary && (

          <StartFocusSessionButton

            taskId={primary.task.id}

            durationMinutes={primary.durationMinutes}

            variant="pill"

          />

        )}

      </div>



      <div className="stat-bar-track bg-white/15">

        <motion.div

          className="h-full rounded-full bg-gold pattern-stripes"

          initial={false}

          animate={{ width: `${progress}%` }}

          transition={{ duration: 0.4, ease: "easeOut" }}

        />

      </div>



      <div className="mt-2 flex justify-between text-xs text-white/55">

        <span>{Math.round(progress)}% through this hour</span>

        {isFocusOnBlock ? (

          <span className="tabular-nums">{formatMsToTimer(displayMs)} elapsed</span>

        ) : (

          <span className="text-white/40">Timer starts when you confirm focus</span>

        )}

      </div>

    </motion.div>

  );

}


