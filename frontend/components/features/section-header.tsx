"use client";

import React from "react";
import { motion } from "framer-motion";

interface SectionHeaderProps {
  title: string;
  description?: string;
  centered?: boolean;
  delay?: number;
  className?: string;
  titleClassName?: string;
  descriptionClassName?: string;
}

export function SectionHeader({
  title,
  description,
  centered = true,
  delay = 0,
  className = "mb-16",
  titleClassName = "",
  descriptionClassName = ""
}: SectionHeaderProps) {
  return (
    <motion.div
      initial={{ opacity: 0, y: 20 }}
      whileInView={{ opacity: 1, y: 0 }}
      viewport={{ once: true }}
      transition={{ duration: 0.5, delay }}
      className={`${centered ? 'text-center' : ''} ${className}`}
    >
      <h2 className={`text-3xl font-bold tracking-tight sm:text-4xl mb-4 text-foreground ${titleClassName}`}>
        {title}
      </h2>
      {description && (
        <p className={`max-w-2xl ${centered ? 'mx-auto' : ''} text-muted-foreground ${descriptionClassName}`}>
          {description}
        </p>
      )}
    </motion.div>
  );
} 