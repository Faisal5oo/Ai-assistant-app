"use client";

import Link from "next/link";
import Image from "next/image";
import { usePathname, useRouter } from "next/navigation";
import { useState } from "react";
import { Bell, Loader2, LogOut, Settings } from "lucide-react";
import { useQueryClient } from "@tanstack/react-query";
import { useTaskStore } from "@/store/useTaskStore";

const TOP_LINKS = [
  { href: "/dashboard", label: "Dashboard" },
  { href: "/tasks", label: "Tasks" },
  { href: "/analytics", label: "Analytics" },
  { href: "/productivity", label: "Techniques" },
];

function UserAvatar({ name, avatar }) {
  const initial = (name || "?").charAt(0).toUpperCase();

  if (avatar) {
    return (
      <Image
        src={avatar}
        alt={name ? `${name}'s profile` : "Profile"}
        width={44}
        height={44}
        className="h-11 w-11 rounded-full object-cover"
        unoptimized
      />
    );
  }

  return (
    <div className="flex h-11 w-11 items-center justify-center rounded-full bg-gradient-to-br from-gold-light to-gold text-sm font-semibold text-charcoal">
      {initial}
    </div>
  );
}

export function TopNav() {
  const router = useRouter();
  const pathname = usePathname();
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
    <header className="mb-6 flex flex-wrap items-center justify-between gap-4">
      <div className="hidden rounded-full bg-white px-5 py-2.5 shadow-glass md:block">
        <span className="font-display font-semibold">TaskFlow</span>
      </div>

      <nav className="glass-card hidden flex-1 items-center justify-center gap-1 px-2 py-2 md:flex lg:max-w-xl">
        {TOP_LINKS.map(({ href, label }) => {
          const active = pathname === href;
          return (
            <Link
              key={href}
              href={href}
              className={active ? "nav-pill-active" : "nav-pill"}
            >
              {label}
            </Link>
          );
        })}
      </nav>

      <div className="ml-auto flex items-center gap-2 md:ml-0">
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
