"use client";

import React from "react";
import Link from "next/link";
import { motion } from "framer-motion";

interface SectionCardProps {
  title: string;
  description: string;
  link: string;
  delayIndex?: number;
}

export function SectionCard({ title, description, link, delayIndex = 0 }: SectionCardProps) {
  return (
    <motion.div
      initial={{ opacity: 0, y: 20 }}
      whileInView={{ opacity: 1, y: 0 }}
      viewport={{ once: true }}
      transition={{ duration: 0.5, delay: 0.1 + (delayIndex * 0.1) }}
      className="bg-card/50 backdrop-blur-sm border border-border/50 p-6 rounded-xl hover:shadow-md transition-shadow"
    >
      <h2 className="text-xl font-semibold mb-3 text-foreground">{title}</h2>
      <p className="text-muted-foreground mb-4">{description}</p>
      <Link href={link} className="text-primary hover:underline">
        Read more →
      </Link>
    </motion.div>
  );
} 