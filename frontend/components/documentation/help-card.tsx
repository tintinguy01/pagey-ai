"use client";

import React from "react";
import Link from "next/link";
import { motion } from "framer-motion";

interface HelpCardProps {
  title: string;
  description: string;
  buttonText: string;
  buttonLink: string;
  delay?: number;
  className?: string;
}

export function HelpCard({ 
  title, 
  description, 
  buttonText, 
  buttonLink, 
  delay = 0.5,
  className = ""
}: HelpCardProps) {
  return (
    <motion.div
      className={`bg-card/50 backdrop-blur-sm border border-border/50 p-8 rounded-xl max-w-4xl mx-auto ${className}`}
      initial={{ opacity: 0, y: 20 }}
      whileInView={{ opacity: 1, y: 0 }}
      viewport={{ once: true }}
      transition={{ duration: 0.5, delay }}
    >
      <h2 className="text-2xl font-semibold mb-4 text-foreground">{title}</h2>
      <p className="mb-4 text-foreground">
        {description}
      </p>
      <Link 
        href={buttonLink} 
        className="inline-flex items-center px-4 py-2 rounded-full bg-primary text-primary-foreground hover:bg-primary/90 transition-colors"
      >
        {buttonText}
      </Link>
    </motion.div>
  );
} 