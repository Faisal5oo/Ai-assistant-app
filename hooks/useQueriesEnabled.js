"use client";

import { usePathname } from "next/navigation";

export function useQueriesEnabled() {
  const pathname = usePathname();
  return Boolean(pathname && !pathname.startsWith("/auth"));
}
