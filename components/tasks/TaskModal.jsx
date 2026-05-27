"use client";

import { useState, useEffect } from "react";
import { motion, AnimatePresence } from "framer-motion";
import { X } from "lucide-react";
import { CATEGORIES, PRIORITIES } from "@/types/interfaces";

const EMPTY_FORM = {
  title: "",
  category: "Work",
  priority: "Medium",
  estimatedTime: 30,
  tags: "",
  scheduledAt: "",
  description: "",
};

/**
 * @param {Object} props
 * @param {boolean} props.open
 * @param {() => void} props.onClose
 * @param {(data: Object) => void} props.onSave
 * @param {import('@/types/interfaces').Task | null} [props.task]
 */
export function TaskModal({ open, onClose, onSave, task }) {
  const [form, setForm] = useState(EMPTY_FORM);

  useEffect(() => {
    if (task) {
      setForm({
        title: task.title,
        category: task.category,
        priority: task.priority,
        estimatedTime: task.estimatedTime,
        tags: task.tags.join(", "),
        scheduledAt: task.scheduledAt
          ? new Date(task.scheduledAt).toISOString().slice(0, 16)
          : "",
        description: task.description ?? "",
      });
    } else {
      setForm(EMPTY_FORM);
    }
  }, [task, open]);

  const handleSubmit = (e) => {
    e.preventDefault();
    if (!form.title.trim()) return;
    onSave({
      title: form.title.trim(),
      category: form.category,
      priority: form.priority,
      estimatedTime: Number(form.estimatedTime) || 30,
      tags: form.tags
        .split(",")
        .map((t) => t.trim())
        .filter(Boolean),
      scheduledAt: form.scheduledAt
        ? new Date(form.scheduledAt).toISOString()
        : undefined,
      description: form.description || undefined,
    });
    onClose();
  };

  return (
    <AnimatePresence>
      {open && (
        <>
          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            className="fixed inset-0 z-50 bg-charcoal/30 backdrop-blur-sm"
            onClick={onClose}
          />
          <motion.div
            initial={{ opacity: 0, scale: 0.96, y: 20 }}
            animate={{ opacity: 1, scale: 1, y: 0 }}
            exit={{ opacity: 0, scale: 0.96, y: 20 }}
            className="fixed left-1/2 top-1/2 z-50 w-[calc(100%-2rem)] max-w-lg -translate-x-1/2 -translate-y-1/2 rounded-4xl bg-cream-50 p-6 shadow-soft md:p-8"
          >
            <div className="mb-6 flex items-center justify-between">
              <h2 className="font-display text-xl font-semibold">
                {task ? "Edit Task" : "Create Task"}
              </h2>
              <button
                type="button"
                onClick={onClose}
                className="flex h-10 w-10 items-center justify-center rounded-full bg-white shadow-glass"
              >
                <X size={18} />
              </button>
            </div>

            <form onSubmit={handleSubmit} className="space-y-4">
              <div>
                <label className="mb-1 block text-xs font-medium text-charcoal/60">
                  Title
                </label>
                <input
                  className="input-field"
                  value={form.title}
                  onChange={(e) =>
                    setForm((f) => ({ ...f, title: e.target.value }))
                  }
                  placeholder="What needs to be done?"
                  required
                />
              </div>

              <div className="grid grid-cols-2 gap-4">
                <div>
                  <label className="mb-1 block text-xs font-medium text-charcoal/60">
                    Category
                  </label>
                  <select
                    className="input-field"
                    value={form.category}
                    onChange={(e) =>
                      setForm((f) => ({ ...f, category: e.target.value }))
                    }
                  >
                    {CATEGORIES.map((c) => (
                      <option key={c} value={c}>
                        {c}
                      </option>
                    ))}
                  </select>
                </div>
                <div>
                  <label className="mb-1 block text-xs font-medium text-charcoal/60">
                    Priority
                  </label>
                  <select
                    className="input-field"
                    value={form.priority}
                    onChange={(e) =>
                      setForm((f) => ({ ...f, priority: e.target.value }))
                    }
                  >
                    {PRIORITIES.map((p) => (
                      <option key={p} value={p}>
                        {p}
                      </option>
                    ))}
                  </select>
                </div>
              </div>

              <div className="grid grid-cols-2 gap-4">
                <div>
                  <label className="mb-1 block text-xs font-medium text-charcoal/60">
                    Estimated (minutes)
                  </label>
                  <input
                    type="number"
                    min={5}
                    step={5}
                    className="input-field"
                    value={form.estimatedTime}
                    onChange={(e) =>
                      setForm((f) => ({
                        ...f,
                        estimatedTime: e.target.value,
                      }))
                    }
                  />
                </div>
                <div>
                  <label className="mb-1 block text-xs font-medium text-charcoal/60">
                    Scheduled
                  </label>
                  <input
                    type="datetime-local"
                    className="input-field"
                    value={form.scheduledAt}
                    onChange={(e) =>
                      setForm((f) => ({ ...f, scheduledAt: e.target.value }))
                    }
                  />
                </div>
              </div>

              <div>
                <label className="mb-1 block text-xs font-medium text-charcoal/60">
                  Tags (comma separated)
                </label>
                <input
                  className="input-field"
                  value={form.tags}
                  onChange={(e) =>
                    setForm((f) => ({ ...f, tags: e.target.value }))
                  }
                  placeholder="design, urgent"
                />
              </div>

              <div>
                <label className="mb-1 block text-xs font-medium text-charcoal/60">
                  Description
                </label>
                <textarea
                  className="input-field min-h-[80px] resize-none"
                  value={form.description}
                  onChange={(e) =>
                    setForm((f) => ({ ...f, description: e.target.value }))
                  }
                  placeholder="Optional details..."
                />
              </div>

              <button type="submit" className="pill-btn-dark w-full py-3">
                {task ? "Save Changes" : "Create Task"}
              </button>
            </form>
          </motion.div>
        </>
      )}
    </AnimatePresence>
  );
}
