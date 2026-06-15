"use client";

import { usePathname } from "next/navigation";
import { AnimatePresence, motion } from "framer-motion";
import { useTaskStore } from "@/store/useTaskStore";
import { GlobalTimerTick } from "@/components/timer/GlobalTimerTick";
import { TimerPersistenceBridge } from "@/components/timer/TimerPersistenceBridge";
import { Sidebar } from "./Sidebar";
import { TopNav } from "./TopNav";
import { RunwayConductorBridge } from "@/components/runway/RunwayConductorBridge";
import { DeepWorkPersistenceBridge } from "@/components/deep-work/DeepWorkPersistenceBridge";

const PERIPHERAL_EXIT = {
  opacity: 0,
  transition: { duration: 0.4, ease: "easeInOut" },
};

export function AppShell({ children }) {
  const pathname = usePathname();
  const deepWorkFocusMode = useTaskStore((s) => s.deepWorkFocusMode);
  const batchingFocusMode = useTaskStore((s) => s.batchingFocusMode);
  const flowFocusMode = useTaskStore((s) => s.flowFocusMode);
  const isDeepWorkRoute = pathname?.startsWith("/productivity/deep-work");
  const isBatchingRoute =
    pathname?.startsWith("/productivity/batching") ||
    pathname?.startsWith("/productivity/task-batching");
  const isFlowRoute = pathname?.startsWith("/productivity/flow");
  const isPomodoroRoute = pathname?.startsWith("/productivity/pomodoro");
  const isAuthRoute = pathname?.startsWith("/auth");
  const peripheralHidden =
    (deepWorkFocusMode && isDeepWorkRoute) ||
    (batchingFocusMode && isBatchingRoute) ||
    (flowFocusMode && isFlowRoute);

  const showPeripherals = !peripheralHidden && !isAuthRoute;
  const immersiveMain = (peripheralHidden && isFlowRoute) || isAuthRoute;

  return (
    <div className="flex min-h-screen">
      <GlobalTimerTick />
      <TimerPersistenceBridge />
      <DeepWorkPersistenceBridge />
      <RunwayConductorBridge />
      <AnimatePresence initial={false}>
        {showPeripherals && (
          <motion.div
            key="app-sidebar"
            className="shrink-0"
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={PERIPHERAL_EXIT}
          >
            <Sidebar />
          </motion.div>
        )}
      </AnimatePresence>
      <main
        className={`relative flex-1 overflow-x-hidden ${
          immersiveMain ? "p-0" : "px-4 pb-10 pt-16 lg:px-8 lg:pt-8"
        }`}
      >
        <AnimatePresence initial={false}>
          {showPeripherals && (
            <motion.div
              key="app-topnav"
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              exit={PERIPHERAL_EXIT}
            >
              <TopNav />
            </motion.div>
          )}
        </AnimatePresence>
        {children}
      </main>
    </div>
  );
}
