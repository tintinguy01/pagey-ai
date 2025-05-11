"use client";

import React, { useState, useEffect } from "react";
import { motion, AnimatePresence } from "framer-motion";

interface Testimonial {
  id: number;
  name: string;
  role: string;
  company: string;
  avatar: string;
  content: string;
}

export function Testimonials() {
  const testimonials: Testimonial[] = [
    {
      id: 1,
      name: "Sarah Johnson",
      role: "Research Analyst",
      company: "DataInsights Inc.",
      avatar: "https://randomuser.me/api/portraits/women/68.jpg",
      content: "Pagey AI has completely transformed how I work with research papers. The ability to chat with multiple PDFs and get cited responses saves me hours of work every week."
    },
    {
      id: 2,
      name: "Michael Chen",
      role: "Legal Counsel",
      company: "LexCorp Partners",
      avatar: "https://randomuser.me/api/portraits/men/32.jpg",
      content: "As a lawyer, I deal with hundreds of pages of documents daily. Pagey AI helps me quickly extract relevant information from contracts and legal briefs. It's become an essential tool in my workflow."
    },
    {
      id: 3,
      name: "Priya Patel",
      role: "PhD Student",
      company: "University of Technology",
      avatar: "https://randomuser.me/api/portraits/women/44.jpg",
      content: "I use Pagey AI to help me understand complex academic papers. The AI not only answers my questions but shows me exactly where in the document the information comes from. Incredible for my research!"
    },
    {
      id: 4,
      name: "David Wilson",
      role: "Financial Advisor",
      company: "WealthWise Solutions",
      avatar: "https://randomuser.me/api/portraits/men/75.jpg",
      content: "Analyzing financial reports used to take me hours. With Pagey AI, I can upload quarterly reports and instantly get insights about company performance. It's like having a financial analyst assistant."
    }
  ];
  
  const [currentIndex, setCurrentIndex] = useState(0);
  const [autoplay, setAutoplay] = useState(true);
  
  // Autoplay functionality
  useEffect(() => {
    if (!autoplay) return;
    
    const interval = setInterval(() => {
      setCurrentIndex((prev) => (prev + 1) % testimonials.length);
    }, 5000);
    
    return () => clearInterval(interval);
  }, [autoplay, testimonials.length]);
  
  const handleDotClick = (index: number) => {
    setCurrentIndex(index);
    setAutoplay(false);
    // Resume autoplay after 10 seconds of inactivity
    setTimeout(() => setAutoplay(true), 10000);
  };

  return (
    <section className="w-full h-full min-h-screen py-16 md:py-24 flex items-center bg-background dark:bg-gradient-to-b dark:from-[#112240] dark:to-[#1a365d]">
      <div className="container px-4 mx-auto">
        <motion.div 
          initial={{ opacity: 0, y: 20 }}
          whileInView={{ opacity: 1, y: 0 }}
          viewport={{ once: true }}
          transition={{ duration: 0.5 }}
          className="text-center mb-16"
        >
          <h2 className="text-3xl font-bold tracking-tight sm:text-4xl mb-4 text-foreground">What Our Users Say</h2>
          <p className="max-w-2xl mx-auto text-muted-foreground">
            Join thousands of professionals who trust Pagey AI for their document needs.
          </p>
        </motion.div>
        
        <div className="relative max-w-4xl mx-auto">
          {/* Testimonial cards */}
          <div className="relative h-[400px] sm:h-[320px] md:h-[280px]">
            <AnimatePresence mode="wait">
              <motion.div 
                key={testimonials[currentIndex].id}
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
                        src={testimonials[currentIndex].avatar} 
                        alt={testimonials[currentIndex].name} 
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
                      
                      <p className="text-base md:text-lg mb-4 flex-grow text-foreground">{testimonials[currentIndex].content}</p>
                      <div>
                        <h4 className="font-semibold text-foreground">{testimonials[currentIndex].name}</h4>
                        <p className="text-sm text-muted-foreground">
                          {testimonials[currentIndex].role}, {testimonials[currentIndex].company}
                        </p>
                      </div>
                    </div>
                  </div>
                </div>
              </motion.div>
            </AnimatePresence>
          </div>
          
          {/* Navigation dots */}
          <div className="flex justify-center mt-8 gap-2">
            {testimonials.map((_, index) => (
              <button
                key={index}
                onClick={() => handleDotClick(index)}
                className={`w-3 h-3 rounded-full transition-colors cursor-pointer ${
                  index === currentIndex 
                    ? "bg-primary" 
                    : "bg-primary/20 hover:bg-primary/40"
                }`}
                aria-label={`View testimonial ${index + 1}`}
              />
            ))}
          </div>
          
          {/* Arrow navigation for larger screens */}
          <div className="hidden md:block">
            <button 
              onClick={() => {
                setCurrentIndex((prev) => (prev - 1 + testimonials.length) % testimonials.length);
                setAutoplay(false);
                setTimeout(() => setAutoplay(true), 10000);
              }}
              className="absolute top-1/2 -left-12 cursor-pointer -translate-y-1/2 w-10 h-10 rounded-full bg-background border border-border flex items-center justify-center text-foreground hover:bg-secondary transition-colors"
              aria-label="Previous testimonial"
            >
              <svg xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24" strokeWidth={1.5} stroke="currentColor" className="w-5 h-5">
                <path strokeLinecap="round" strokeLinejoin="round" d="M15.75 19.5L8.25 12l7.5-7.5" />
              </svg>
            </button>
            <button 
              onClick={() => {
                setCurrentIndex((prev) => (prev + 1) % testimonials.length);
                setAutoplay(false);
                setTimeout(() => setAutoplay(true), 10000);
              }}
              className="absolute top-1/2 -right-12 cursor-pointer -translate-y-1/2 w-10 h-10 rounded-full bg-background border border-border flex items-center justify-center text-foreground hover:bg-secondary transition-colors"
              aria-label="Next testimonial"
            >
              <svg xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24" strokeWidth={1.5} stroke="currentColor" className="w-5 h-5">
                <path strokeLinecap="round" strokeLinejoin="round" d="M8.25 4.5l7.5 7.5-7.5 7.5" />
              </svg>
            </button>
          </div>
        </div>
      </div>
    </section>
  );
} 