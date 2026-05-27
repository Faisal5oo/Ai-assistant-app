"use client";

import { ChevronDown, ListTodo } from "lucide-react";

/**
 * @param {Object} props
 * @param {import('@/types/interfaces').Task[]} props.tasks
 * @param {string | null} props.selectedId
 * @param {(id: string) => void} props.onSelect
 */
export function TaskSelector({ tasks, selectedId, onSelect }) {
  const active = tasks.filter((t) => t.status !== "Completed");
  const selected = tasks.find((t) => t.id === selectedId);

  return (
    <div className="relative w-full max-w-sm">
      <label className="mb-2 flex items-center gap-2 text-xs font-semibold uppercase tracking-widest text-charcoal/40">
        <ListTodo size={14} />
        Linked task
      </label>
      <div className="relative">
        <select
          value={selectedId ?? ""}
          onChange={(e) => onSelect(e.target.value)}
          className="input-field appearance-none pr-10"
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
          size={18}
          className="pointer-events-none absolute right-4 top-1/2 -translate-y-1/2 text-charcoal/40"
        />
      </div>
      {selected && (
        <p className="mt-2 text-xs text-charcoal/50">
          {selected.category} · {selected.priority} priority
        </p>
      )}
      {active.length === 0 && (
        <p className="mt-2 text-xs text-charcoal/50">
          Add a task in Tasks to link sessions.
        </p>
      )}
    </div>
  );
}
