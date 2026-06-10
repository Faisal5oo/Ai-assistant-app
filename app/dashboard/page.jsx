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

      <div className="grid grid-cols-1 gap-5 lg:grid-cols-12">
        <div className="lg:col-span-3">
          <ProfileCard />
        </div>

        <div className="grid gap-5 sm:grid-cols-2 lg:col-span-6">
          <WeeklyProgressChart />
          <TimeTracker />
          <div className="sm:col-span-2">
            <TimelineCalendar />
          </div>
        </div>

        <div className="flex flex-col gap-5 lg:col-span-3">
          <OnboardingProgress />
          <TodayChecklist />
        </div>
      </div>
    </div>
  );
}
