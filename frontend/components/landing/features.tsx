"use client";

import React from "react";
import { motion, useScroll, useTransform } from "framer-motion";
import { BookOpen, MessageSquare, Upload } from "lucide-react";

export function Features() {
  const { scrollY } = useScroll();
  const y1 = useTransform(scrollY, [0, 1000], [0, -50]);
  const y2 = useTransform(scrollY, [200, 1000], [100, 0]);
  
  const featureCards = [
    {
      icon: <Upload className="h-10 w-10 text-primary" />,
      title: "Upload PDFs",
      description: "Upload one or multiple PDF documents to your chat section. Support for large files and batch uploads.",
      motion: {
        y: useTransform(scrollY, [300, 600], [50, -20]),
        rotate: useTransform(scrollY, [300, 600], [5, 0])
      }
    },
    {
      icon: <MessageSquare className="h-10 w-10 text-primary" />,
      title: "Ask Questions",
      description: "Ask questions in natural language about your documents. Our AI understands context and handles complex queries.",
      motion: {
        y: useTransform(scrollY, [350, 650], [70, -20]),
        rotate: useTransform(scrollY, [350, 650], [-3, 0])
      }
    },
    {
      icon: <BookOpen className="h-10 w-10 text-primary" />,
      title: "Get Cited Answers",
      description: "Receive AI responses with direct citations to your source documents. Perfect for research and study sessions.",
      motion: {
        y: useTransform(scrollY, [400, 700], [90, -20]),
        rotate: useTransform(scrollY, [400, 700], [2, 0])
      }
    }
  ];

  return (
    <section className="relative overflow-hidden w-full h-full min-h-screen flex items-center bg-background dark:bg-gradient-to-b dark:from-[#112240] dark:to-[#1a365d]">
      {/* Background gradients */}
      <div className="absolute inset-0 overflow-hidden">
        <div className="absolute left-1/4 top-1/4 h-64 w-64 rounded-full bg-primary/5 blur-3xl" />
        <div className="absolute right-1/4 bottom-1/4 h-64 w-64 rounded-full bg-primary/10 blur-3xl" />
      </div>
      
      <div className="container relative px-4 mx-auto">
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          whileInView={{ opacity: 1, y: 0 }}
          viewport={{ once: true }}
          transition={{ duration: 0.5 }}
          className="text-center mb-16"
          style={{ y: y1 }}
        >
          <h2 className="text-3xl font-bold tracking-tight sm:text-4xl mb-4 text-foreground">How It Works</h2>
          <p className="max-w-2xl mx-auto text-muted-foreground">
            Pagey AI makes document interactions simple, fast, and intelligent.
          </p>
        </motion.div>
        
        <div className="grid gap-10 md:grid-cols-3 relative z-10">
          {featureCards.map((feature, index) => (
            <motion.div
              key={index}
              initial={{ opacity: 0, y: 50 }}
              whileInView={{ opacity: 1, y: 0 }}
              viewport={{ once: true, margin: "-100px" }}
              transition={{ duration: 0.5, delay: index * 0.1 }}
              style={feature.motion}
              whileHover={{ 
                y: -5, 
                boxShadow: "0 10px 25px rgba(0, 0, 0, 0.1)",
                transition: { type: "spring", stiffness: 300, damping: 15 }
              }}
              className="flex flex-col items-center text-center p-8 rounded-xl bg-card/70 backdrop-blur-sm border border-border/50 shadow-md relative h-full"
            >
              <div className="relative mb-6">
                {/* Decorative circle behind icon */}
                <div className="absolute inset-0 rounded-full bg-primary/10 scale-150 blur-md" />
                <div className="relative rounded-full bg-primary/10 p-4">
                  {feature.icon}
                </div>
              </div>
              <h3 className="text-xl font-semibold mb-3 text-foreground">{feature.title}</h3>
              <p className="text-muted-foreground">{feature.description}</p>
            </motion.div>
          ))}
        </div>
        
        {/* Decorative element - floating document */}
        <motion.div
          className="hidden lg:block absolute -bottom-20 -right-20 w-64 h-80 bg-card border border-border/40 rounded-lg shadow-lg"
          style={{ y: y2, rotate: useTransform(scrollY, [200, 1000], [15, 0]) }}
          initial={{ opacity: 0 }}
          whileInView={{ opacity: 0.7 }}
          viewport={{ once: true }}
        >
          <div className="absolute top-6 left-6 w-3/4 h-2 rounded-full bg-muted" />
          <div className="absolute top-12 left-6 w-1/2 h-2 rounded-full bg-muted" />
          <div className="absolute top-20 left-6 right-6 bottom-6 bg-muted/30 rounded-md" />
        </motion.div>
      </div>
    </section>
  );
} 