"use client";

import React from "react";
import { motion } from "framer-motion";

interface TestimonialProps {
  id: number;
  name: string;
  role: string;
  company: string;
  avatar: string;
  content: string;
}

export function TestimonialCard({ 
  id, 
  name, 
  role, 
  company, 
  avatar, 
  content 
}: TestimonialProps) {
  return (
    <motion.div 
      key={id}
      initial={{ opacity: 0, y: 20 }}
      animate={{ opacity: 1, y: 0 }}
      exit={{ opacity: 0, y: -20 }}
      transition={{ duration: 0.5 }}
      className="absolute inset-0"
    >
      <div className="bg-card/70 backdrop-blur-md rounded-2xl shadow-lg p-6 md:p-8 border border-border/50 h-full">
        <div className="flex flex-col md:flex-row gap-6 items-center md:items-start h-full">
          <div className="flex-shrink-0">
            <img 
              src={avatar} 
              alt={name} 
              className="w-16 h-16 rounded-full border-2 border-primary/20"
            />
          </div>
          <div className="flex-1 text-center md:text-left flex flex-col">
            {/* Quote icon */}
            <svg 
              className="w-8 h-8 text-primary/20 mb-2 mx-auto md:mx-0" 
              fill="currentColor" 
              viewBox="0 0 32 32"
            >
              <path d="M10 8c-3.3 0-6 2.7-6 6v10h10V14H7c0-1.7 1.3-3 3-3V8zm18 0c-3.3 0-6 2.7-6 6v10h10V14h-7c0-1.7 1.3-3 3-3V8z" />
            </svg>
            
            <p className="text-base md:text-lg mb-4 flex-grow text-foreground">{content}</p>
            <div>
              <h4 className="font-semibold text-foreground">{name}</h4>
              <p className="text-sm text-muted-foreground">
                {role}, {company}
              </p>
            </div>
          </div>
        </div>
      </div>
    </motion.div>
  );
} 