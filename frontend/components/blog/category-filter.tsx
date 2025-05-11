"use client";

import React from "react";
import { motion } from "framer-motion";

interface CategoryFilterProps {
  categories: string[];
  activeCategory: string;
  setActiveCategory: (category: string) => void;
}

export function CategoryFilter({ 
  categories, 
  activeCategory, 
  setActiveCategory 
}: CategoryFilterProps) {
  return (
    <motion.div 
      className="flex flex-wrap justify-center gap-2 mb-10"
      initial={{ opacity: 0, y: 20 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ duration: 0.5, delay: 0.1 }}
    >
      {categories.map((category, index) => (
        <button
          key={index}
          onClick={() => setActiveCategory(category)}
          className={`px-4 py-1.5 rounded-full text-sm transition-colors cursor-pointer ${
            activeCategory === category
              ? "bg-primary text-primary-foreground"
              : "bg-card/50 text-foreground/80 hover:bg-card/80"
          }`}
        >
          {category}
        </button>
      ))}
    </motion.div>
  );
} 