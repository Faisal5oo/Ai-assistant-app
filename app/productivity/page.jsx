"use client";

import { useCallback, useState } from "react";
import { motion } from "framer-motion";
import { useTaskStore } from "@/store/useTaskStore";
import { useTasks } from "@/hooks/queries/useTasksQuery";
import { TechniqueCard } from "@/components/productivity/TechniqueCard";
import { ActiveSessionBar } from "@/components/productivity/ActiveSessionBar";
import { TimeBlockingModal } from "@/components/productivity/TimeBlockingModal";
import { BatchingModal } from "@/components/productivity/BatchingModal";
import { EisenhowerMatrixModal } from "@/components/productivity/EisenhowerMatrixModal";
import { getTasksFromCache } from "@/lib/query-cache";
import { TECHNIQUES } from "@/lib/productivityTechniques";

export default function ProductivityPage() {
  const applyTechnique = useTaskStore((s) => s.applyTechnique);
  const activeTechnique = useTaskStore((s) => s.activeTechnique);
  const productivityModal = useTaskStore((s) => s.productivityModal);
  const setProductivityModal = useTaskStore((s) => s.setProductivityModal);
  const { tasks } = useTasks();

  const [feedback, setFeedback] = useState("");

  const showFeedback = useCallback((message) => {
    setFeedback(message);
    setTimeout(() => setFeedback(""), 4000);
  }, []);

  const closeModal = useCallback(() => {
    setProductivityModal(null);
  }, [setProductivityModal]);

  const handleApply = useCallback(
    (techniqueId) => {
      const result = applyTechnique(techniqueId);
      if (result === "modal") return;

      if (result) {
        const task =
          tasks.find((t) => t.id === result) ??
          getTasksFromCache().find((t) => t.id === result);
        const label = TECHNIQUES.find((t) => t.id === techniqueId)?.title ?? techniqueId;
        showFeedback(`${label} started on “${task?.title ?? "task"}”`);
        return;
      }

      showFeedback("Create or select a task first in the Tasks view.");
    },
    [applyTechnique, tasks, showFeedback]
  );

  return (
    <div>
      <h1 className="mb-2 font-display text-3xl font-semibold">
        Productivity Techniques Hub
      </h1>
      <p className="mb-6 max-w-2xl text-sm text-charcoal/50">
        Learn proven frameworks and apply them instantly to your active work.
        Each technique launches real timer behavior or a focused workflow tied
        to your tasks.
      </p>

      <ActiveSessionBar />

      {feedback && (
        <p className="mb-4 rounded-2xl bg-gold/20 px-4 py-2 text-sm font-medium">
          {feedback}
        </p>
      )}

      <div className="grid gap-5 sm:grid-cols-2 xl:grid-cols-3">
        {TECHNIQUES.map((tech, i) => {
          const Icon = tech.icon;
          return (
            <motion.div
              key={tech.id}
              initial={{ opacity: 0, y: 12 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ delay: i * 0.06 }}
            >
              <TechniqueCard
                title={tech.title}
                description={tech.description}
                icon={<Icon size={24} />}
                actionLabel={tech.actionLabel}
                href={tech.href}
                onApply={
                  tech.href ? undefined : () => handleApply(tech.id)
                }
                active={activeTechnique === tech.id}
              />
            </motion.div>
          );
        })}
      </div>

      <TimeBlockingModal
        open={productivityModal === "time-blocking"}
        onClose={closeModal}
      />
      <BatchingModal
        open={productivityModal === "batching"}
        onClose={closeModal}
        onFeedback={showFeedback}
      />
      <EisenhowerMatrixModal
        open={productivityModal === "eisenhower"}
        onClose={closeModal}
        onFeedback={showFeedback}
      />
    </div>
  );
}
