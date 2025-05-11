"use client";

import React, { useState } from "react";
import { motion } from "framer-motion";
import Link from "next/link";
import { BarChart, Plus } from "lucide-react";
import { AnalyticsDialog } from "@/components/dashboard/analytics-dialog";

export function QuickActions() {
  const [open, setOpen] = useState(false);
  const quickActions = [
    { 
      title: "Create New Chat", 
      description: "Upload PDFs and start a new conversation",
      icon: <Plus className="h-6 w-6" />,
      href: "/dashboard/new",
      color: "bg-primary text-primary-foreground",
      onClick: undefined,
    },
    { 
      title: "View Analytics", 
      description: "See your usage statistics",
      icon: <BarChart className="h-6 w-6" />,
      color: "bg-secondary text-secondary-foreground",
      onClick: () => setOpen(true),
    },
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
      className="space-y-4 md:col-span-2"
    >
      <h2 className="text-xl font-semibold">Quick Actions</h2>
      <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
        {quickActions.map((action, index) => (
          <motion.div key={action.title} variants={item} custom={index}>
            {action.onClick ? (
              <button
                type="button"
                className="block w-full h-full"
                onClick={action.onClick}
              >
                <motion.div 
                  className={`flex flex-col justify-center items-center h-full p-5 rounded-xl ${action.color} shadow-sm transition-all duration-200 cursor-pointer`}
                  whileHover={{ 
                    scale: 1.03, 
                    boxShadow: "0 10px 25px rgba(0, 0, 0, 0.1)",
                  }}
                  whileTap={{ scale: 0.98 }}
                >
                  <div className="rounded-full w-12 h-12 flex items-center justify-center bg-white/10 mb-4">
                    {action.icon}
                  </div>
                  <h3 className="font-semibold text-lg mb-1">{action.title}</h3>
                  <p className="text-sm opacity-80">{action.description}</p>
                </motion.div>
              </button>
            ) : (
              <Link 
                href={action.href!}
                className="block h-full"
              >
                <motion.div 
                  className={`flex flex-col justify-center items-center h-full p-5 rounded-xl ${action.color} shadow-sm transition-all duration-200`}
                  whileHover={{ 
                    scale: 1.03, 
                    boxShadow: "0 10px 25px rgba(0, 0, 0, 0.1)",
                  }}
                  whileTap={{ scale: 0.98 }}
                >
                  <div className="rounded-full w-12 h-12 flex items-center justify-center bg-white/10 mb-4">
                    {action.icon}
                  </div>
                  <h3 className="font-semibold text-lg mb-1">{action.title}</h3>
                  <p className="text-sm opacity-80">{action.description}</p>
                </motion.div>
              </Link>
            )}
          </motion.div>
        ))}
      </div>
      
      {/* Analytics Dialog */}
      <AnalyticsDialog open={open} onOpenChange={setOpen} />
    </motion.div>
  );
} 