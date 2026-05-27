"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";
import { Bell, Settings } from "lucide-react";

const TOP_LINKS = [
  { href: "/dashboard", label: "Dashboard" },
  { href: "/tasks", label: "Tasks" },
  { href: "/analytics", label: "Analytics" },
  { href: "/productivity", label: "Techniques" },
];

export function TopNav() {
  const pathname = usePathname();

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
        <div className="flex h-11 w-11 items-center justify-center rounded-full bg-gradient-to-br from-gold-light to-gold text-sm font-semibold text-charcoal">
          N
        </div>
      </div>
    </header>
  );
}
