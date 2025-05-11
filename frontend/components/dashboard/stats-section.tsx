"use client";

import React, { useState, useEffect } from "react";
import { motion } from "framer-motion";
import { Clock, FileUp, MessageSquare, TrendingUp } from "lucide-react";
import { useUser } from "@clerk/nextjs";
import { getUserAnalytics, AnalyticsData } from "@/api/client";

export function StatsSection() {
  const { user } = useUser();
  const userId = user?.id || "";
  const [analytics, setAnalytics] = useState<AnalyticsData | null>(null);
  const [isLoading, setIsLoading] = useState(true);

  useEffect(() => {
    if (!userId) return;
    setIsLoading(true);
    getUserAnalytics(userId)
      .then(setAnalytics)
      .catch((e) => console.error("Error fetching stats data:", e))
      .finally(() => setIsLoading(false));
  }, [userId]);

  // Only render after user is loaded and analytics is fetched
  if (!userId || isLoading || !analytics) {
    return null; // or a loading spinner if you prefer
  }

  // Use analytics data directly
  const totalChats = analytics.overview.total_chats;
  const pdfUploads = analytics.overview.total_pdfs;
  const minutes = analytics.overview.active_time_minutes;
  const hours = Math.floor(minutes / 60);
  const mins = Math.round(minutes % 60);
  const activeTime = `${hours}h ${mins}m`;

  const stats = [
    { label: "Total Chats", value: totalChats, icon: <MessageSquare className="h-5 w-5" />, color: "bg-primary/10" },
    { label: "PDF Uploads", value: pdfUploads, icon: <FileUp className="h-5 w-5" />, color: "bg-green-500/10" },
    { label: "Active Time", value: activeTime, icon: <Clock className="h-5 w-5" />, color: "bg-purple-500/10" },
  ];
  
  const container = {
    hidden: { opacity: 0 },
    show: {
      opacity: 1,
      transition: {
        staggerChildren: 0.1,
      }
    }
  };
  
  const item = {
    hidden: { opacity: 0, y: 20 },
    show: { opacity: 1, y: 0 }
  };
  
  return (
    <motion.div
      variants={container}
      initial="hidden"
      animate="show"
      className="space-y-4"
    >
      <h2 className="text-xl font-semibold">Your Stats</h2>
      <div className="space-y-3">
        {stats.map((stat) => (
          <motion.div
            key={stat.label}
            variants={item}
            className="flex items-center p-3 bg-background rounded-lg border border-border hover:border-primary/30 hover:shadow-sm transition-all duration-200"
            whileHover={{
              scale: 1.02,
              transition: { duration: 0.2 }
            }}
          >
            <div className={`rounded-full p-2 mr-3 ${stat.color}`}>
              {stat.icon}
            </div>
            <div className="flex-1">
              <p className="text-sm text-muted-foreground">{stat.label}</p>
              <p className="font-semibold">{stat.value}</p>
            </div>
            <TrendingUp className="h-4 w-4 text-green-500" />
          </motion.div>
        ))}
      </div>
    </motion.div>
  );
} 