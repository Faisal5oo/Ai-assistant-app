"use client";

import { useRouter } from "next/navigation";
import { useState } from "react";
import { Bell, Loader2, LogOut, Settings } from "lucide-react";
import { useQueryClient } from "@tanstack/react-query";
import { ActiveTaskStatusBar } from "@/components/timer/ActiveTaskStatusBar";
import { UserAvatar } from "@/components/ui/UserAvatar";
import { useTaskStore } from "@/store/useTaskStore";

export function TopNav() {
  const router = useRouter();
  const userName = useTaskStore((s) => s.userName);
  const userAvatar = useTaskStore((s) => s.userAvatar);
  const clearUserProfile = useTaskStore((s) => s.clearUserProfile);
  const queryClient = useQueryClient();
  const [loggingOut, setLoggingOut] = useState(false);

  const handleLogout = async () => {
    if (loggingOut) return;

    setLoggingOut(true);
    try {
      await fetch("/api/auth/logout", {
        method: "POST",
        credentials: "include",
      });
      queryClient.removeQueries();
      clearUserProfile();
      router.push("/auth");
    } catch {
      setLoggingOut(false);
    }
  };

  return (
    <header className="mb-6 grid grid-cols-[auto_1fr_auto] items-center gap-3 md:gap-4">
      <div className="hidden shrink-0 rounded-full bg-white px-5 py-2.5 shadow-glass md:block">
        <span className="font-display font-semibold">TaskFlow</span>
      </div>

      <div className="flex min-w-0 items-center justify-center px-1">
        <ActiveTaskStatusBar />
      </div>

      <div className="flex shrink-0 items-center justify-end gap-2">
        <button type="button" className="pill-btn-ghost hidden sm:inline-flex">
          <Settings size={16} />
          Setting
        </button>
        <button
          type="button"
          className="flex h-11 w-11 items-center justify-center rounded-full bg-white shadow-glass"
          aria-label="Notifications"
        >
          <Bell size={18} />
        </button>
        <button
          type="button"
          onClick={handleLogout}
          disabled={loggingOut}
          className="flex h-11 w-11 items-center justify-center rounded-full bg-white shadow-glass transition hover:bg-charcoal/[0.03] sm:h-auto sm:w-auto sm:gap-2 sm:rounded-full sm:px-4 sm:py-2.5 sm:shadow-none pill-btn-ghost"
          aria-label="Log out"
        >
          {loggingOut ? (
            <Loader2 size={16} className="animate-spin" />
          ) : (
            <LogOut size={16} />
          )}
          <span className="hidden sm:inline">Log out</span>
        </button>
        <UserAvatar name={userName} avatar={userAvatar} />
      </div>
    </header>
  );
}
