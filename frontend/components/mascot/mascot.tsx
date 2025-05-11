"use client";

import React, { useState, useEffect, useRef } from "react";
import { motion, useAnimation } from "framer-motion";

export interface MascotProps {
  size?: "sm" | "md" | "lg";
  mood?: "happy" | "thinking" | "excited"; // Keeping this for backward compatibility
  className?: string;
  interactive?: boolean;
}

export function Mascot({ 
  size = "md", 
  mood,
  className = "", 
  interactive = false 
}: MascotProps) {
  const [internalMood, setInternalMood] = useState<"happy" | "thinking" | "excited">("happy");
  const currentMood = mood ?? internalMood;
  const [isHovered, setIsHovered] = useState(false);
  const [blinking, setBlinking] = useState(false);
  const eyesControl = useAnimation();
  const mouthControl = useAnimation();
  const isMounted = useRef(false);
  
  // Set mounted state
  useEffect(() => {
    isMounted.current = true;
    
    // Initialize animation controls after component is mounted
    eyesControl.set({ scaleY: 1 });
    mouthControl.set({ d: "M 15, 38 Q 24, 46 33, 38" });
    
    return () => {
      isMounted.current = false;
    };
  }, []);
  
  // Automatic blinking (only if mood is not controlled)
  useEffect(() => {
    if (mood !== undefined) return; // skip if controlled
    if (!isMounted.current) return;
    const blinkInterval = setInterval(() => {
      if (isMounted.current) {
        blink();
      }
    }, Math.random() * 3000 + 2000); // Random blink between 2-5 seconds
    return () => clearInterval(blinkInterval);
  }, [mood]);
  
  const blink = async () => {
    if (!isMounted.current || blinking) return;
    setBlinking(true);
    
    if (isMounted.current) {
      await eyesControl.start({ scaleY: 0.1, transition: { duration: 0.1 } });
      if (isMounted.current) {
        await eyesControl.start({ scaleY: 1, transition: { duration: 0.1 } });
        setBlinking(false);
      }
    } else {
      setBlinking(false);
    }
  };
  
  // Occasional mood changes for interactive mascots (only if mood is not controlled)
  useEffect(() => {
    if (mood !== undefined) return; // skip if controlled
    if (!interactive) return;
    const moodChangeInterval = setInterval(() => {
      if (!isMounted.current) return;
      const randomChance = Math.random();
      if (randomChance < 0.3) { // 30% chance to change mood
        const randomMood = Math.random();
        if (randomMood < 0.7) {
          // Just blink
          blink();
        } else if (randomMood < 0.9) {
          // Brief thinking expression
          showThinkingExpression();
        } else {
          // Brief excited expression
          showExcitedExpression();
        }
      }
    }, 8000);
    return () => clearInterval(moodChangeInterval);
  }, [interactive, mood]);
  
  const showThinkingExpression = async () => {
    if (!isMounted.current) return;
    setInternalMood("thinking");
    await mouthControl.start({ 
      d: "M 15, 40 Q 24, 38 33, 40",
      transition: { duration: 0.3 }
    });
    if (!isMounted.current) return;
    await new Promise(resolve => setTimeout(resolve, 2000));
    if (!isMounted.current) return;
    await mouthControl.start({ 
      d: "M 15, 38 Q 24, 46 33, 38",
      transition: { duration: 0.3 }
    });
    if (isMounted.current) {
      setInternalMood("happy");
    }
  };
  
  const showExcitedExpression = async () => {
    if (!isMounted.current) return;
    setInternalMood("excited");
    await mouthControl.start({ 
      d: "M 15, 38 Q 24, 48 33, 38",
      transition: { duration: 0.3 }
    });
    if (!isMounted.current) return;
    await new Promise(resolve => setTimeout(resolve, 1500));
    if (!isMounted.current) return;
    await mouthControl.start({ 
      d: "M 15, 38 Q 24, 46 33, 38",
      transition: { duration: 0.3 }
    });
    if (isMounted.current) {
      setInternalMood("happy");
    }
  };
  
  const sizes = {
    sm: "w-16 h-16",
    md: "w-24 h-24",
    lg: "w-32 h-32",
  };

  const floatAnimation = {
    y: [0, -6, 0],
    transition: {
      y: {
        duration: 2,
        repeat: Infinity,
        repeatType: "reverse",
      }
    }
  };
  
  const hoverAnimation = {
    scale: isHovered ? 1.1 : 1,
    rotate: isHovered ? [0, -5, 5, -3, 3, 0] : 0,
    transition: {
      scale: { duration: 0.2 },
      rotate: {
        duration: 0.5, 
        ease: "easeInOut"
      }
    }
  };
  
  const handleClick = () => {
    if (interactive) {
      const randomExpression = Math.random();
      if (randomExpression < 0.5) {
        showExcitedExpression();
      } else {
        showThinkingExpression();
      }
    }
  };

  return (
    <motion.div 
      className={`${sizes[size]} ${className} relative ${interactive ? "cursor-pointer" : ""}`}
      animate={{
        ...floatAnimation,
        ...hoverAnimation
      }}
      onClick={handleClick}
      onHoverStart={() => interactive && setIsHovered(true)}
      onHoverEnd={() => interactive && setIsHovered(false)}
    >
      {/* Main PDF body */}
      <motion.svg
        viewBox="0 0 48 60"
        fill="none"
        xmlns="http://www.w3.org/2000/svg"
        className="w-full h-full"
      >
        {/* PDF body */}
        <motion.path
          d="M 4 4 L 4 56 L 44 56 L 44 18 L 30 4 Z"
          fill="#1389FD"
          stroke="#0F2132"
          strokeWidth="2"
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          transition={{ duration: 0.3 }}
        />
        
        {/* Folded corner */}
        <motion.path
          d="M 30 4 L 30 18 L 44 18 Z"
          fill="#91C8FF"
          stroke="#0F2132"
          strokeWidth="2"
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          transition={{ duration: 0.3, delay: 0.1 }}
        />
        
        {/* Eyes - Positioned higher and more rounded for friendlier look */}
        <motion.circle
          cx="16"
          cy="28"
          r="4"
          fill="#FFFFFF"
          initial={{ scale: 0 }}
          animate={{ scale: 1 }}
          transition={{ duration: 0.3, delay: 0.2 }}
        />
        <motion.circle
          cx="32"
          cy="28"
          r="4"
          fill="#FFFFFF"
          initial={{ scale: 0 }}
          animate={{ scale: 1 }}
          transition={{ duration: 0.3, delay: 0.2 }}
        />
        
        {/* Pupils - Animated happy eyes */}
        <motion.circle
          cx={currentMood === "thinking" ? "15.5" : "16"}
          cy={currentMood === "thinking" ? "27" : "28"}
          r="2"
          fill="#0F2132"
          animate={eyesControl}
        />
        <motion.circle
          cx={currentMood === "thinking" ? "31.5" : "32"}
          cy={currentMood === "thinking" ? "27" : "28"}
          r="2"
          fill="#0F2132"
          animate={eyesControl}
        />
        
        {/* Mouth - Animatable smile */}
        <motion.path
          d="M 15, 38 Q 24, 46 33, 38"
          stroke="#0F2132"
          strokeWidth="2"
          fill="transparent"
          animate={mouthControl}
        />

        {/* Optional: Small rosy cheeks for extra cuteness */}
        <motion.circle
          cx="12"
          cy="36" 
          r="2"
          fill="#FF9999"
          opacity="0.5"
          animate={{
            opacity: currentMood === "excited" ? 0.8 : 0.5,
            scale: currentMood === "excited" ? 1.2 : 1,
          }}
        />
        <motion.circle
          cx="36"
          cy="36"
          r="2" 
          fill="#FF9999"
          opacity="0.5"
          animate={{
            opacity: currentMood === "excited" ? 0.8 : 0.5,
            scale: currentMood === "excited" ? 1.2 : 1,
          }}
        />

        {/* Hand-on-chin SVG path for thinking mode */}
        {currentMood === "thinking" && (
          <motion.path
            d="M 20 44 Q 24 48 28 44"
            stroke="#0F2132"
            strokeWidth="2"
            fill="none"
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            transition={{ duration: 0.5 }}
          />
        )}
      </motion.svg>
      
      {/* Sparkles for excited mode */}
      {currentMood === "excited" && (
        <>
          <motion.div 
            className="absolute -top-2 -right-2 text-yellow-400 text-xl"
            initial={{ scale: 0, rotate: 0 }}
            animate={{ scale: 1, rotate: 360 }}
            transition={{ duration: 0.5, repeat: 2, repeatType: "reverse" }}
          >
            ✨
          </motion.div>
          <motion.div 
            className="absolute -bottom-1 -left-1 text-yellow-400 text-xl"
            initial={{ scale: 0, rotate: 0 }}
            animate={{ scale: 1, rotate: 360 }}
            transition={{ duration: 0.5, delay: 0.2, repeat: 2, repeatType: "reverse" }}
          >
            ✨
          </motion.div>
        </>
      )}
      
      {/* Thought bubble for thinking mode */}
      {currentMood === "thinking" && (
        <motion.div 
          className="absolute -top-6 -right-4 text-primary text-xl"
          initial={{ opacity: 0, scale: 0 }}
          animate={{ opacity: 1, scale: [1, 1.1, 1], y: [-2, 2, -2] }}
          transition={{ 
            opacity: { duration: 0.3 },
            scale: { duration: 1, repeat: Infinity, repeatType: "reverse" },
            y: { repeat: Infinity, duration: 1.5 } 
          }}
        >
          <div className="relative">
            <div className="absolute -bottom-1 -left-1 h-2 w-2 rounded-full bg-primary/80" />
            <div className="absolute -bottom-3 -left-3 h-3 w-3 rounded-full bg-primary/60" />
            <div className="absolute -bottom-6 -left-6 h-4 w-4 rounded-full bg-primary/40" />
            <div className="rounded-lg bg-primary/20 p-2">
              🤔
            </div>
          </div>
        </motion.div>
      )}
    </motion.div>
  );
} 