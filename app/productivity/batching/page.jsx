"use client";

import { useEffect } from "react";
import { useRouter } from "next/navigation";

/** Legacy route — forwards to the task-batching workstation. */
export default function BatchingLegacyRedirect() {
  const router = useRouter();

  useEffect(() => {
    router.replace("/productivity/task-batching");
  }, [router]);

  return null;
}
