"use client";

import { CheckCircle2, ChevronDown, ListTodo } from "lucide-react";

/**
 * @param {Object} props
 * @param {import('@/types/interfaces').Task[]} props.tasks
 * @param {string | null} props.selectedId
 * @param {(id: string) => void} props.onSelect
 * @param {boolean} [props.isRunning]
 * @param {() => void} [props.onCompleteTask]
 */
export function TaskSelector({ tasks, selectedId, onSelect, isRunning, onCompleteTask }) {
  const active = tasks.filter((t) => t.status !== "Completed");
  const selected = tasks.find((t) => t.id === selectedId);
  const canComplete = Boolean(selected && selected.status !== "Completed" && !isRunning);

  return (
    <div className="relative w-full max-w-sm">
      <label className="mb-2 flex items-center gap-2 text-[10px] font-semibold uppercase tracking-[0.24em] text-charcoal/40">
        <ListTodo size={13} />
        Linked task
      </label>
      <div className="relative">
        <select
          value={selectedId ?? ""}
          onChange={(e) => onSelect(e.target.value)}
          disabled={isRunning}
          className="input-field appearance-none pr-10 disabled:cursor-not-allowed disabled:opacity-45"
        >
          <option value="" disabled>
            Select a task…
          </option>
          {active.map((t) => (
            <option key={t.id} value={t.id}>
              {t.title}
            </option>
          ))}
        </select>
        <ChevronDown
          size={16}
          className="pointer-events-none absolute right-4 top-1/2 -translate-y-1/2 text-charcoal/38"
        />
      </div>
      {selected && (
        <p className="mt-1.5 text-[11px] text-charcoal/45">
          {selected.category} · {selected.priority} priority
          {(selected.completedPomodoros ?? 0) > 0 && (
            <> · {selected.completedPomodoros} pomodoro{(selected.completedPomodoros ?? 0) === 1 ? "" : "s"} logged</>
          )}
        </p>
      )}
      {canComplete && onCompleteTask && (
        <button
          type="button"
          onClick={onCompleteTask}
          className="mt-3 inline-flex items-center gap-2 rounded-xl border border-charcoal/10 bg-white/60 px-3 py-2 text-xs font-medium text-charcoal transition hover:border-gold/40 hover:bg-gold/10"
        >
          <CheckCircle2 size={14} className="text-gold" />
          Mark task complete
        </button>
      )}
      {active.length === 0 && (
        <p className="mt-1.5 text-[11px] text-charcoal/45">
          Add a task in Tasks to link sessions.
        </p>
      )}
    </div>
  );
}
