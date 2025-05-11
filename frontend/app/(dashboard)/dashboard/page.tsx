"use client";

import React from "react";
import { WelcomeSection } from "@/components/dashboard/welcome-section";
import { StatsSection } from "@/components/dashboard/stats-section";
import { RecentChats } from "@/components/dashboard/recent-chats";
import { QuickActions } from "@/components/dashboard/quick-actions";

export default function DashboardPage() {
  return (
    <div className="container mx-auto p-6 space-y-6 pt-4 md:pt-6">
      <WelcomeSection />
      
      {/* Quick actions and stats */}
      <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
        <QuickActions />
        <StatsSection />
      </div>
      
      <RecentChats />
    </div>
  );
} 