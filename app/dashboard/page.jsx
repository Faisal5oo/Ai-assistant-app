"use client";

import { WelcomeHeader } from "@/components/dashboard/WelcomeHeader";
import { ProfileCard } from "@/components/dashboard/ProfileCard";
import { WeeklyProgressChart } from "@/components/dashboard/WeeklyProgressChart";
import { TimeTracker } from "@/components/dashboard/TimeTracker";
import { TimelineCalendar } from "@/components/dashboard/TimelineCalendar";
import { OnboardingProgress, TodayChecklist } from "@/components/dashboard/TodayChecklist";
import { DashboardSkeleton } from "@/components/dashboard/DashboardSkeleton";
import { useTasksQuery } from "@/hooks/queries/useTasksQuery";
import { useDashboardQuery } from "@/hooks/queries/useDashboardQuery";
import { appToast } from "@/lib/toast";
import { useEffect } from "react";

export default function DashboardPage() {
  const tasksQuery = useTasksQuery();
  const dashboardQuery = useDashboardQuery();

  const isLoading = tasksQuery.isLoading || dashboardQuery.isLoading;
  const isError = tasksQuery.isError || dashboardQuery.isError;

  useEffect(() => {
    if (isError) {
      appToast.error(
        tasksQuery.error ?? dashboardQuery.error,
        "Could not load dashboard data."
      );
    }
  }, [isError, tasksQuery.error, dashboardQuery.error]);

  if (isLoading) {
    return <DashboardSkeleton />;
  }

  return (
    <div>
      <WelcomeHeader />

      {/*
        Responsive 12-col grid strategy:
        - mobile  : single column, natural stacking order
        - md      : 2-col — profile left, today-tasks right
        - lg      : 12-col — 3 | 5 | 4 split
            col 1 (3): ProfileCard
            col 2 (5): WeeklyProgressChart + TimeTracker stack vertically,
                       then TimelineCalendar spans full width beneath them
            col 3 (4): OnboardingProgress + TodayChecklist (wider, no truncation)
      */}
      <div className="grid grid-cols-1 gap-5 md:grid-cols-2 lg:grid-cols-12">
        {/* Profile column */}
        <div className="md:col-span-1 lg:col-span-3">
          <ProfileCard />
        </div>

        {/* Center column: charts + calendar */}
        <div className="grid grid-cols-1 gap-5 md:col-span-1 lg:col-span-5">
          {/* Charts row — always vertical stack so neither card is cramped */}
          <div className="grid grid-cols-1 gap-5 sm:grid-cols-2 lg:grid-cols-1 xl:grid-cols-2">
            <WeeklyProgressChart />
            <TimeTracker />
          </div>
          <TimelineCalendar />
        </div>

        {/* Today's Tasks column — lg:col-span-4 gives enough room to prevent
            title truncation on 1366 × 768 and 1920 × 1080 @ 125% viewports */}
        <div className="flex flex-col gap-5 md:col-span-2 lg:col-span-4">
          <OnboardingProgress />
          {/* min-w-0 forces the flex child to respect its grid cell width */}
          <div className="min-w-0 flex-1">
            <TodayChecklist />
          </div>
        </div>
      </div>
    </div>
  );
}
