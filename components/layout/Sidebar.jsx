"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";
import { motion } from "framer-motion";
import {
  LayoutDashboard,
  ListTodo,
  BarChart3,
  Lightbulb,
  Menu,
  X,
} from "lucide-react";
import { useState } from "react";
import { useTaskStore } from "@/store/useTaskStore";

const NAV_ITEMS = [
  { href: "/dashboard", label: "Dashboard", icon: LayoutDashboard },
  { href: "/tasks", label: "Tasks", icon: ListTodo },
  { href: "/analytics", label: "Analytics", icon: BarChart3 },
  { href: "/productivity", label: "Techniques", icon: Lightbulb },
];

export function Sidebar() {
  const pathname = usePathname();
  const pomodoroFocusMode = useTaskStore((s) => s.pomodoroFocusMode);
  const isPomodoroRoute = pathname?.startsWith("/productivity/pomodoro");
  const focusLocked = pomodoroFocusMode && isPomodoroRoute;

  const [mobileOpen, setMobileOpen] = useState(false);

  const navContent = (
    <>
      <div className="mb-8 flex items-center gap-2 px-2">
        <div className="rounded-full bg-white px-4 py-2 shadow-glass">
          <span className="font-display text-lg font-semibold tracking-tight text-charcoal">
            TaskFlow
          </span>
        </div>
      </div>

      <nav className="flex flex-1 flex-col gap-1">
        {NAV_ITEMS.map(({ href, label, icon: Icon }) => {
          const active = pathname === href || pathname.startsWith(`${href}/`);
          return (
            <Link
              key={href}
              href={href}
              onClick={() => setMobileOpen(false)}
              tabIndex={focusLocked && !active ? -1 : undefined}
              className={`flex items-center gap-3 rounded-2xl px-4 py-3 text-sm font-medium transition-all duration-500 ${
                focusLocked
                  ? active
                    ? "bg-charcoal/60 text-white/60 shadow-soft"
                    : "pointer-events-none text-charcoal/25 opacity-50"
                  : active
                  ? "bg-charcoal text-white shadow-soft"
                  : "text-charcoal/70 hover:bg-white/60 hover:text-charcoal"
              }`}
              aria-disabled={focusLocked && !active}
            >
              <Icon size={18} strokeWidth={active ? 2.5 : 2} />
              {label}
            </Link>
          );
        })}
      </nav>

      <p className="mt-auto px-2 text-xs text-charcoal/40">
        {focusLocked ? "Focus in progress…" : "Focus without distraction"}
      </p>
    </>
  );

  return (
    <>
      <button
        type="button"
        className="fixed left-4 top-4 z-50 flex h-11 w-11 items-center justify-center rounded-2xl bg-white shadow-soft lg:hidden"
        onClick={() => setMobileOpen(!mobileOpen)}
        aria-label="Toggle menu"
      >
        {mobileOpen ? <X size={20} /> : <Menu size={20} />}
      </button>

      <motion.aside
        animate={{ opacity: focusLocked ? 0.35 : 1 }}
        transition={{ duration: 0.9, ease: "easeInOut" }}
        className={`hidden w-56 shrink-0 flex-col p-6 lg:flex transition-[background] duration-700 ${
          focusLocked ? "bg-zinc-950/0" : ""
        }`}
      >
        {navContent}
      </motion.aside>

      {mobileOpen && (
        <motion.aside
          initial={{ x: -280 }}
          animate={{ x: 0 }}
          exit={{ x: -280 }}
          className="fixed inset-y-0 left-0 z-40 flex w-64 flex-col bg-cream-100/95 p-6 shadow-soft backdrop-blur-xl lg:hidden"
        >
          {navContent}
        </motion.aside>
      )}
      {mobileOpen && (
        <button
          type="button"
          className="fixed inset-0 z-30 bg-charcoal/20 lg:hidden"
          onClick={() => setMobileOpen(false)}
          aria-label="Close menu"
        />
      )}
    </>
  );
}
