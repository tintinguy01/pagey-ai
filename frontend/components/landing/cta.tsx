"use client";

import React, { useState, useEffect, useRef } from "react";
import { motion } from "framer-motion";
import Link from "next/link";
import { Mascot } from "@/components/mascot";
import { useLoadingNavigation } from "@/hooks/use-loading-navigation";

const MotionLink = motion(Link);

export function Cta() {
  const [decorativeElements, setDecorativeElements] = useState<Array<{left: string, top: string}>>([]);
  const elementsInitialized = useRef(false);
  const { handleAuthAction, navigateWithLoading } = useLoadingNavigation();
  
  // Initialize decorative elements on client side only
  useEffect(() => {
    if (!elementsInitialized.current) {
      const elements = Array(8).fill(0).map(() => ({
        left: `${Math.random() * 100}%`,
        top: `${Math.random() * 100}%`,
      }));
      setDecorativeElements(elements);
      elementsInitialized.current = true;
    }
  }, []);

  const hoverScale = { 
    scale: 1.05, 
    transition: { type: "spring", stiffness: 400, damping: 10 } 
  };

  const handleStartTrial = (e: React.MouseEvent) => {
    e.preventDefault();
    handleAuthAction(() => {
      navigateWithLoading('/dashboard');
    }, 'signUp');
  };

  return (
    <section className="w-full h-full min-h-screen py-16 md:py-24 flex items-center bg-background dark:bg-gradient-to-b dark:from-[#1a365d] dark:to-[#0a192f]">
      <div className="container px-4 mx-auto">
        <motion.div
          initial={{ opacity: 0, scale: 0.9 }}
          whileInView={{ opacity: 1, scale: 1 }}
          viewport={{ once: true }}
          transition={{ duration: 0.6 }}
          className="relative overflow-hidden rounded-3xl bg-gradient-to-r from-primary to-blue-500 p-8 text-center text-primary-foreground md:p-16"
        >
          {/* Background decoration */}
          <div className="absolute inset-0 z-0 overflow-hidden">
            <div className="absolute -left-20 -top-20 h-64 w-64 rounded-full bg-white/10 blur-3xl" />
            <div className="absolute -bottom-40 -right-20 h-96 w-96 rounded-full bg-white/10 blur-3xl" />
            
            {/* Small decorative elements - Only render when initialized on client side */}
            {decorativeElements.map((element, i) => (
              <motion.div
                key={i}
                className="absolute h-8 w-8 flex items-center justify-center cursor-pointer"
                style={{
                  left: element.left,
                  top: element.top,
                  transform: 'translate(-50%, -50%)',
                  zIndex: 20
                }}
                whileHover={{ scale: 1.5 }}
              >
                <motion.div
                  className="h-2 w-2 rounded-full bg-white/40"
                  animate={{
                    y: [0, -20, 0],
                    opacity: [0.2, 0.8, 0.2],
                  }}
                  transition={{
                    duration: 3 + i,
                    repeat: Infinity,
                    delay: i * 0.2,
                  }}
                />
              </motion.div>
            ))}
          </div>
          
          <div className="relative z-10">
            <motion.div
              initial={{ y: 20, opacity: 0 }}
              whileInView={{ y: 0, opacity: 1 }}
              viewport={{ once: true }}
              transition={{ delay: 0.2 }}
              className="mx-auto mb-5 w-20"
            >
              <Mascot size="md" mood="excited" />
            </motion.div>
            
            <motion.h2
              initial={{ y: 20, opacity: 0 }}
              whileInView={{ y: 0, opacity: 1 }}
              viewport={{ once: true }}
              transition={{ delay: 0.3 }}
              className="text-3xl font-bold tracking-tight sm:text-4xl md:text-5xl"
            >
              Ready to transform how you work with PDFs?
            </motion.h2>
            
            <motion.p
              initial={{ y: 20, opacity: 0 }}
              whileInView={{ y: 0, opacity: 1 }}
              viewport={{ once: true }}
              transition={{ delay: 0.4 }}
              className="mx-auto mt-6 max-w-xl text-lg text-primary-foreground/90"
            >
              Start your free trial today and experience the power of AI-assisted document interaction.
            </motion.p>
            
            <motion.div
              initial={{ y: 20, opacity: 0 }}
              whileInView={{ y: 0, opacity: 1 }}
              viewport={{ once: true }}
              transition={{ delay: 0.5 }}
              className="mt-8 flex flex-col gap-4 sm:flex-row justify-center"
            >
              <motion.button
                onClick={handleStartTrial}
                className="inline-flex h-12 items-center justify-center cursor-pointer rounded-full bg-white px-8 text-sm font-medium text-primary transition-colors hover:bg-white/90 focus-visible:outline-none disabled:pointer-events-none disabled:opacity-50"
                whileHover={hoverScale}
                whileTap={{ scale: 0.95 }}
              >
                Start Free Trial
              </motion.button>
              <MotionLink
                href="/pricing"
                className="inline-flex h-12 items-center justify-center rounded-full border border-white/20 bg-transparent px-8 text-sm font-medium text-white transition-colors hover:bg-white/10 focus-visible:outline-none disabled:pointer-events-none disabled:opacity-50"
                whileHover={hoverScale}
                whileTap={{ scale: 0.95 }}
              >
                View Pricing
              </MotionLink>
            </motion.div>
            
            <motion.p
              initial={{ opacity: 0 }}
              whileInView={{ opacity: 1 }}
              viewport={{ once: true }}
              transition={{ delay: 0.6 }}
              className="mt-6 text-sm text-white/70"
            >
              No credit card required. 7-day free trial.
            </motion.p>
          </div>
        </motion.div>
      </div>
    </section>
  );
} 