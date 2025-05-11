"use client";

import React from "react";
import { motion, MotionStyle } from "framer-motion";

interface FeatureCardProps {
  icon: React.ReactNode;
  title: string;
  description: string;
  motionStyle?: MotionStyle;
  index?: number;
}

export function FeatureCard({ 
  icon, 
  title, 
  description, 
  motionStyle,
  index = 0
}: FeatureCardProps) {
  return (
    <motion.div
      initial={{ opacity: 0, y: 50 }}
      whileInView={{ opacity: 1, y: 0 }}
      viewport={{ once: true, margin: "-100px" }}
      transition={{ duration: 0.5, delay: index * 0.1 }}
      style={motionStyle}
      whileHover={{ 
        y: -5, 
        boxShadow: "0 10px 25px rgba(0, 0, 0, 0.1)",
        transition: { type: "spring", stiffness: 300, damping: 15 }
      }}
      className="flex flex-col items-center text-center p-8 rounded-xl bg-card/70 backdrop-blur-sm border border-border/50 shadow-md relative h-full"
    >
      <div className="relative mb-6">
        {/* Decorative circle behind icon */}
        <div className="absolute inset-0 rounded-full bg-primary/10 scale-150 blur-md" />
        <div className="relative rounded-full bg-primary/10 p-4">
          {icon}
        </div>
      </div>
      <h3 className="text-xl font-semibold mb-3 text-foreground">{title}</h3>
      <p className="text-muted-foreground">{description}</p>
    </motion.div>
  );
} 