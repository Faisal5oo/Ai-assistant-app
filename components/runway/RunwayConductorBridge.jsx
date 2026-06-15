"use client";

import { useRunwayHourConductor } from "@/hooks/useRunwayHourConductor";
import { useRunwayBlockAlerts } from "@/hooks/useRunwayBlockAlerts";

/**
 * Global runway orchestration — hour takeover + upcoming block alerts.
 */
export function RunwayConductorBridge() {
  useRunwayHourConductor();
  useRunwayBlockAlerts();
  return null;
}
