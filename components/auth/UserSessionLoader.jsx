"use client";

import { useEffect } from "react";
import { usePathname } from "next/navigation";
import { useTaskStore } from "@/store/useTaskStore";

export function UserSessionLoader() {
  const pathname = usePathname();
  const setUserProfile = useTaskStore((s) => s.setUserProfile);

  useEffect(() => {
    if (pathname?.startsWith("/auth")) {
      return undefined;
    }

    let cancelled = false;

    async function loadSession() {
      try {
        const res = await fetch("/api/auth/me", { credentials: "include" });
        if (!res.ok || cancelled) return;

        const data = await res.json().catch(() => ({}));
        if (!data.success || !data.user || cancelled) return;

        setUserProfile({
          name: data.user.name,
          avatar: data.user.avatar || "",
        });
      } catch {
        // Middleware handles redirects; ignore transient network errors.
      }
    }

    loadSession();

    return () => {
      cancelled = true;
    };
  }, [pathname, setUserProfile]);

  return null;
}
