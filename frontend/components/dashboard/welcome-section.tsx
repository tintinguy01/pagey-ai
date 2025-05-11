"use client";

import React, { useState } from "react";
import { Calendar } from "lucide-react";
import { Mascot } from "@/components/mascot/mascot";
import { motion } from "framer-motion";

export function WelcomeSection() {
  const [mascotMood, setMascotMood] = useState<"happy" | "thinking" | "excited">("happy");
  
  const handleMascotClick = () => {
    const moods: ("happy" | "thinking" | "excited")[] = ["happy", "thinking", "excited"];
    const currentIndex = moods.indexOf(mascotMood);
    const nextIndex = (currentIndex + 1) % moods.length;
    setMascotMood(moods[nextIndex]);
  };
  
  return (
    <motion.div 
      className="flex flex-col md:flex-row items-center justify-between p-6 bg-secondary rounded-xl"
      initial={{ opacity: 0, y: 20 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ duration: 0.5 }}
    >
      <div className="flex gap-4 items-center mb-4 md:mb-0">
        <motion.div 
          onClick={handleMascotClick}
          whileHover={{ scale: 1.1 }}
          whileTap={{ scale: 0.9 }}
          className="cursor-pointer"
        >
          <Mascot size="md" mood={mascotMood} interactive />
        </motion.div>
        <div>
          <h1 className="text-3xl font-bold">Welcome back!</h1>
          <p className="text-muted-foreground mt-1">What would you like to do today?</p>
        </div>
      </div>
      <motion.div 
        className="flex gap-2 items-center"
        initial={{ opacity: 0 }}
        animate={{ opacity: 1 }}
        transition={{ delay: 0.3, duration: 0.5 }}
      >
        <p className="text-muted-foreground text-sm mr-2">
          <Calendar className="inline-block w-4 h-4 mr-1" /> 
          {new Date().toLocaleDateString('en-US', { weekday: 'long', year: 'numeric', month: 'long', day: 'numeric' })}
        </p>
      </motion.div>
    </motion.div>
  );
} 