"use client";

import React from "react";
import { motion } from "framer-motion";
import { Mascot } from "@/components/mascot/mascot";

interface LoadingSpinnerProps {
  fullScreen?: boolean;
  showMascot?: boolean;
  text?: string;
  size?: "sm" | "md" | "lg";
}

export function LoadingSpinner({
  fullScreen = true,
  showMascot = true,
  text = "Loading...",
  size = "md"
}: LoadingSpinnerProps) {
  // Size mappings
  const sizes = {
    sm: {
      spinner: "w-8 h-8",
      text: "text-base",
      mascot: "sm"
    },
    md: {
      spinner: "w-12 h-12",
      text: "text-lg",
      mascot: "md"
    },
    lg: {
      spinner: "w-16 h-16",
      text: "text-xl",
      mascot: "lg"
    }
  };

  const containerClasses = fullScreen 
    ? "fixed inset-0 z-50 flex items-center justify-center bg-background/80 backdrop-blur-sm" 
    : "flex items-center justify-center";

  // Animation for the loading spinner
  const spinTransition = {
    repeat: Infinity,
    ease: "linear",
    duration: 1.5
  };

  return (
    <div className={containerClasses}>
      <div className="flex flex-col items-center justify-center">
        {showMascot && (
          <motion.div 
            className="mb-4"
            initial={{ scale: 0.8, opacity: 0 }}
            animate={{ scale: 1, opacity: 1 }}
            transition={{ duration: 0.5 }}
          >
            <Mascot size={sizes[size].mascot as "sm" | "md" | "lg"} mood="thinking" />
          </motion.div>
        )}
        
        <motion.div
          className={`relative ${sizes[size].spinner}`}
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          transition={{ duration: 0.3 }}
        >
          <motion.div 
            className="absolute inset-0 rounded-full border-t-2 border-r-2 border-primary"
            animate={{ rotate: 360 }}
            transition={spinTransition}
          />
          <motion.div 
            className="absolute inset-0 rounded-full border-t-2 border-r-2 border-primary/30"
            style={{ rotate: 45 }}
            animate={{ rotate: 405 }}
            transition={{
              ...spinTransition,
              duration: 2
            }}
          />
        </motion.div>
        
        {text && (
          <motion.p 
            className={`mt-4 ${sizes[size].text} text-foreground font-medium`}
            initial={{ opacity: 0, y: 10 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.5, delay: 0.2 }}
          >
            {text}
          </motion.p>
        )}
      </div>
    </div>
  );
} 