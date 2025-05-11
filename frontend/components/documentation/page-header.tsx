"use client";

import React from "react";
import { motion } from "framer-motion";
import { Mascot } from "@/components/mascot";

interface PageHeaderProps {
  title: string;
  description: string;
  showMascot?: boolean;
  mascotMood?: "happy" | "thinking" | "excited";
}

export function PageHeader({ 
  title, 
  description, 
  showMascot = true,
  mascotMood = "happy" 
}: PageHeaderProps) {
  return (
    <div className="flex flex-col items-center mb-12">
      {showMascot && (
        <motion.div
          initial={{ opacity: 0, y: -20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.5 }}
          className="mb-6"
        >
          <Mascot size="md" mood={mascotMood} />
        </motion.div>
      )}
      
      <motion.h1 
        className="text-4xl md:text-5xl font-bold text-center mb-4 text-foreground"
        initial={{ opacity: 0, y: 20 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ duration: 0.5, delay: 0.2 }}
      >
        {title}
      </motion.h1>
      
      <motion.p
        className="text-xl text-muted-foreground text-center max-w-2xl"
        initial={{ opacity: 0, y: 20 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ duration: 0.5, delay: 0.3 }}
      >
        {description}
      </motion.p>
    </div>
  );
} 