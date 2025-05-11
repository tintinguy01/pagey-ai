"use client";

import React, { useEffect, useState, useRef } from "react";
import { motion, useScroll, useTransform } from "framer-motion";
import Link from "next/link";
import { ArrowRight } from "lucide-react";
import { Mascot } from "@/components/mascot";
import { useLoadingNavigation } from "@/hooks/use-loading-navigation";
import { createMotionComponent } from "@/lib/motion-helpers";

// Create a motion version of Link component using the updated API
const MotionLink = createMotionComponent(Link);

export function Hero() {
  const [mousePosition, setMousePosition] = useState({ x: 0, y: 0 });
  const { scrollY } = useScroll();
  const [decorativeElements, setDecorativeElements] = useState<Array<{left: string, top: string}>>([]);
  const elementsInitialized = useRef(false);
  const { handleAuthAction, navigateWithLoading } = useLoadingNavigation();
  
  // Parallax effect values
  const y1 = useTransform(scrollY, [0, 500], [0, -100]);
  const y2 = useTransform(scrollY, [0, 500], [0, -50]);
  
  // Initialize decorative elements on client side only
  useEffect(() => {
    if (!elementsInitialized.current) {
      const elements = Array(5).fill(0).map(() => ({
        left: `${Math.random() * 100}%`,
        top: `${Math.random() * 100}%`,
      }));
      setDecorativeElements(elements);
      elementsInitialized.current = true;
    }
  }, []);
  
  // Mouse parallax effect
  useEffect(() => {
    const handleMouseMove = (e: MouseEvent) => {
      setMousePosition({
        x: e.clientX / window.innerWidth - 0.5,
        y: e.clientY / window.innerHeight - 0.5
      });
    };
    
    window.addEventListener("mousemove", handleMouseMove);
    return () => {
      window.removeEventListener("mousemove", handleMouseMove);
    };
  }, []);
  
  const container = {
    hidden: { opacity: 0 },
    show: {
      opacity: 1,
      transition: {
        staggerChildren: 0.2,
        delayChildren: 0.3,
      }
    }
  };
  
  const item = {
    hidden: { opacity: 0, y: 20 },
    show: { opacity: 1, y: 0, transition: { type: "spring", stiffness: 300, damping: 24 } }
  };
  
  const hoverScale = { 
    scale: 1.05, 
    transition: { type: "spring", stiffness: 400, damping: 10 } 
  };

  const handleGetStarted = (e: React.MouseEvent) => {
    e.preventDefault();
    handleAuthAction(() => {
      navigateWithLoading('/dashboard');
    }, 'signUp');
  };

  return (
    <section className="relative overflow-hidden w-full h-full min-h-screen flex items-center bg-background dark:bg-gradient-to-b dark:from-[#0a192f] dark:to-[#112240]">
      {/* Background animated elements */}
      <div className="absolute inset-0 overflow-hidden">
        {/* Gradient blob 1 */}
        <motion.div 
          className="absolute -top-20 -right-20 h-64 w-64 rounded-full bg-primary/20 blur-3xl"
          animate={{
            x: mousePosition.x * 20,
            y: mousePosition.y * 20,
          }}
          transition={{ type: "spring", damping: 15 }}
        />
        
        {/* Gradient blob 2 */}
        <motion.div 
          className="absolute bottom-0 left-0 h-96 w-96 rounded-full bg-primary/10 blur-3xl" 
          animate={{
            x: mousePosition.x * -30,
            y: mousePosition.y * -30,
          }}
          transition={{ type: "spring", damping: 15 }}
        />
        
        {/* Small decorative elements - Only render when initialized on client side */}
        {decorativeElements.map((element, i) => (
          <motion.div
            key={i}
            className="absolute h-2 w-2 rounded-full bg-primary/50"
            style={{
              left: element.left,
              top: element.top,
            }}
            animate={{
              scale: [1, 1.5, 1],
              opacity: [0.3, 0.7, 0.3],
            }}
            transition={{
              duration: 3 + i,
              repeat: Infinity,
              repeatType: "reverse",
            }}
          />
        ))}
      </div>
      
      <div className="container relative px-4 mx-auto">
        <div className="grid gap-6 lg:grid-cols-2 lg:gap-12 items-center">
          <motion.div
            variants={container}
            initial="hidden"
            animate="show"
            className="flex flex-col gap-4"
            style={{ y: y2 }}
          >
            <motion.div variants={item}>
              <span className="inline-block rounded-full bg-primary/10 px-4 py-1.5 text-sm font-medium text-primary mb-4">
                Introducing Pagey AI
              </span>
            </motion.div>
            <motion.h1
              variants={item}
              className="text-4xl font-bold tracking-tight sm:text-5xl md:text-6xl bg-clip-text text-transparent bg-gradient-to-r from-primary to-blue-400"
            >
              Chat with your PDFs using AI
            </motion.h1>
            <motion.p
              variants={item}
              className="text-muted-foreground text-lg max-w-md"
            >
              Upload your PDFs and ask questions in natural language. Our AI will answer based on your documents with direct citations.
            </motion.p>
            <motion.div
              variants={item}
              className="flex flex-col sm:flex-row gap-4 mt-6"
            >
              <motion.button
                onClick={handleGetStarted}
                className="inline-flex h-12 items-center justify-center rounded-full bg-primary cursor-pointer px-8 text-sm font-medium text-primary-foreground transition-colors hover:bg-primary/90 focus-visible:outline-none disabled:pointer-events-none disabled:opacity-50"
                whileHover={hoverScale}
                whileTap={{ scale: 0.95 }}
              >
                Get Started
                <ArrowRight className="ml-2 h-4 w-4" />
              </motion.button>
              <MotionLink
                href="/pricing"
                className="inline-flex h-12 items-center justify-center rounded-full border border-input bg-background px-8 text-sm font-medium transition-colors hover:bg-accent hover:text-accent-foreground focus-visible:outline-none disabled:pointer-events-none disabled:opacity-50"
                whileHover={hoverScale}
                whileTap={{ scale: 0.95 }}
              >
                View Pricing
              </MotionLink>
            </motion.div>
            
            <motion.div 
              variants={item}
              className="mt-6 flex items-center gap-8"
            >
              <div className="text-muted-foreground">
                <span className="block text-2xl font-bold text-foreground">5000+</span>
                <span className="text-xs">Happy Users</span>
              </div>
              <div className="text-muted-foreground">
                <span className="block text-2xl font-bold text-foreground">1M+</span>
                <span className="text-xs">PDFs Processed</span>
              </div>
              <div className="text-muted-foreground">
                <span className="block text-2xl font-bold text-foreground">4.9/5</span>
                <span className="text-xs">User Rating</span>
              </div>
            </motion.div>
          </motion.div>
          
          {/* Hero illustration */}
          <motion.div 
            className="relative hidden lg:block"
            style={{ y: y1 }}
          >
            {/* Mascot & UI elements */}
            <div className="relative h-[300px] w-[80%]">
              <motion.div
                className="absolute left-1/2 top-1/2 -translate-x-1/2 -translate-y-1/2"
                animate={{
                  x: mousePosition.x * -20,
                  y: mousePosition.y * -20,
                }}
                transition={{ type: "spring", damping: 15 }}
              >
                <Mascot size="lg" interactive className="scale-150" />
              </motion.div>
              
              {/* Floating UI cards */}
              <motion.div
                className="absolute left-0 top-10 max-w-[260px] rounded-xl bg-card p-4 shadow-lg"
                initial={{ opacity: 0, x: -100 }}
                animate={{ opacity: 1, x: 0 }}
                transition={{ delay: 0.5, duration: 0.5 }}
                style={{
                  x: useTransform(() => mousePosition.x * 15 - 100),
                  y: useTransform(() => mousePosition.y * 10 + 40),
                }}
              >
                <div className="mb-2 h-2 w-20 rounded-full bg-primary/20"></div>
                <div className="mb-3 h-3 w-40 rounded-full bg-muted"></div>
                <div className="flex gap-2">
                  <div className="h-8 w-8 rounded-lg bg-primary/20"></div>
                  <div className="h-8 flex-1 rounded-lg bg-muted"></div>
                </div>
              </motion.div>
              
              <motion.div
                className="absolute right-20 bottom-20 max-w-[240px] rounded-xl bg-card p-4 shadow-lg"
                initial={{ opacity: 0, x: 100 }}
                animate={{ opacity: 1, x: 0 }}
                transition={{ delay: 0.7, duration: 0.5 }}
                style={{
                  x: useTransform(() => mousePosition.x * -15 + 80),
                  y: useTransform(() => mousePosition.y * -12 - 80),
                }}
              >
                <div className="mb-2 h-2 w-16 rounded-full bg-primary/20"></div>
                <div className="mb-2 h-3 w-36 rounded-full bg-muted"></div>
                <div className="h-3 w-28 rounded-full bg-muted"></div>
              </motion.div>
              
              <motion.div
                className="absolute right-0 top-40 flex h-10 items-center rounded-full bg-card px-4 shadow-lg"
                initial={{ opacity: 0, x: 100 }}
                animate={{ opacity: 1, x: 0 }}
                transition={{ delay: 0.9, duration: 0.5 }}
                style={{
                  x: useTransform(() => mousePosition.x * -20 + 100),
                  y: useTransform(() => mousePosition.y * 15 + 160),
                }}
              >
                <div className="mr-2 h-4 w-4 rounded-full bg-primary"></div>
                <div className="h-3 w-24 rounded-full bg-muted"></div>
              </motion.div>
            </div>
          </motion.div>
        </div>
      </div>
    </section>
  );
} 