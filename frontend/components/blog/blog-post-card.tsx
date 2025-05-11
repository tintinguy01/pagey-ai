"use client";

import React from "react";
import { motion } from "framer-motion";
import Link from "next/link";

interface BlogPostProps {
  id: number;
  title: string;
  excerpt: string;
  author: string;
  date: string;
  category: string;
  image: string;
  readTime: string;
  delayIndex?: number;
}

export function BlogPostCard({
  id,
  title,
  excerpt,
  author,
  date,
  category,
  image,
  readTime,
  delayIndex = 0
}: BlogPostProps) {
  return (
    <motion.article
      className="bg-card/50 backdrop-blur-sm border border-border/50 rounded-xl overflow-hidden hover:shadow-lg transition-shadow"
      initial={{ opacity: 0, y: 20 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ duration: 0.5, delay: 0.2 + delayIndex * 0.1 }}
    >
      <div className="relative h-48 w-full">
        <img
          src={image}
          alt={title}
          className="object-cover w-full h-full"
        />
        <div className="absolute top-4 left-4">
          <span className="px-3 py-1 bg-primary/90 text-primary-foreground text-xs rounded-full">
            {category}
          </span>
        </div>
      </div>
      
      <div className="p-6">
        <div className="flex items-center text-sm text-muted-foreground mb-3">
          <span>{date}</span>
          <span className="mx-2">•</span>
          <span>{readTime}</span>
        </div>
        
        <h2 className="text-xl font-semibold mb-3 text-foreground">{title}</h2>
        <p className="text-muted-foreground mb-4">{excerpt}</p>
        
        <div className="flex items-center justify-between">
          <div className="flex items-center">
            <div className="w-8 h-8 bg-primary/20 rounded-full flex items-center justify-center mr-2">
              <span className="text-primary font-semibold text-sm">
                {author.charAt(0)}
              </span>
            </div>
            <span className="text-sm text-foreground">{author}</span>
          </div>
          
          <Link href={`/blog/${id}`} className="text-primary hover:underline text-sm">
            Read more →
          </Link>
        </div>
      </div>
    </motion.article>
  );
} 