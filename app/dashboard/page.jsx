"use client";

import { WelcomeHeader } from "@/components/dashboard/WelcomeHeader";
import { ProfileCard } from "@/components/dashboard/ProfileCard";
import { WeeklyProgressChart } from "@/components/dashboard/WeeklyProgressChart";
import { TimeTracker } from "@/components/dashboard/TimeTracker";
import { TimelineCalendar } from "@/components/dashboard/TimelineCalendar";
import { OnboardingProgress, TodayChecklist } from "@/components/dashboard/TodayChecklist";

export default function DashboardPage() {
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
