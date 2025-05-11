"use client";

import React, { useState, useEffect, useRef } from "react";
import { Navbar } from "@/components/layout/navbar";
import { Footer } from "@/components/layout/footer";
import { Hero } from "@/components/landing/hero";
import { Features } from "@/components/landing/features";
import { Testimonials } from "@/components/landing/testimonials";
import { Cta } from "@/components/landing/cta";

export default function HomePage() {
  const [currentSection, setCurrentSection] = useState(0);
  const [isScrolling, setIsScrolling] = useState(false);
  const scrollRef = useRef<HTMLDivElement>(null);
  const sections = useRef<HTMLDivElement[]>([]);
  const observerRef = useRef<IntersectionObserver | null>(null);
  
  // Restore section position from localStorage on initial load
  useEffect(() => {
    // Only run in client
    if (typeof window !== 'undefined') {
      const savedSection = localStorage.getItem('currentSection');
      if (savedSection) {
        const sectionIndex = parseInt(savedSection, 10);
        setCurrentSection(sectionIndex);
        // Add a small delay to ensure DOM is ready
        setTimeout(() => {
          scrollToSection(sectionIndex, false);
        }, 100);
      }
    }
  }, []);
   
  // Register sections for scrolling
  const addSection = (el: HTMLDivElement | null) => {
    if (el && !sections.current.includes(el)) {
      sections.current.push(el);
    }
  };
  
  // Scroll to a specific section
  const scrollToSection = (index: number, saveToStorage = true) => {
    if (isScrolling) return;
    
    setIsScrolling(true);
    setCurrentSection(index);
    
    if (saveToStorage && typeof window !== 'undefined') {
      localStorage.setItem('currentSection', index.toString());
    }
    
    if (sections.current[index]) {
      window.scrollTo({
        top: sections.current[index].offsetTop,
        behavior: 'smooth'
      });
      
      // Prevent multiple scroll events
      setTimeout(() => {
        setIsScrolling(false);
      }, 1000);
    }
  };

  // Initialize IntersectionObserver for better section tracking
  useEffect(() => {
    // Wait for sections to be registered
    if (sections.current.length === 0) return;

    // Cleanup previous observer
    if (observerRef.current) {
      observerRef.current.disconnect();
    }

    // Create new observer
    observerRef.current = new IntersectionObserver(
      (entries) => {
        if (isScrolling) return;
        
        entries.forEach((entry) => {
          if (entry.isIntersecting) {
            const index = sections.current.findIndex(
              (section) => section === entry.target
            );
            if (index !== -1) {
              setCurrentSection(index);
            }
          }
        });
      },
      {
        root: null,
        rootMargin: '-50% 0px -50% 0px', // Trigger when section is centered in viewport
        threshold: 0.1,
      }
    );

    // Observe all sections
    sections.current.forEach((section) => {
      if (section) observerRef.current?.observe(section);
    });

    return () => {
      observerRef.current?.disconnect();
    };
  }, [isScrolling, sections.current.length]);
  
  // Handle wheel event for full-page scrolling
  useEffect(() => {
    const handleWheel = (e: WheelEvent) => {
      if (isScrolling) return;
      
      const direction = e.deltaY > 0 ? 1 : -1;
      const nextSection = Math.min(
        Math.max(currentSection + direction, 0),
        sections.current.length - 1
      );
      
      if (nextSection !== currentSection) {
        scrollToSection(nextSection);
      }
    };
    
    const throttledWheel = throttle(handleWheel, 500);
    window.addEventListener('wheel', throttledWheel as EventListener);
    
    return () => {
      window.removeEventListener('wheel', throttledWheel as EventListener);
    };
  }, [currentSection, isScrolling]);
  
  // Utility function to limit how often a function runs
  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  function throttle<T extends (...args: any[]) => void>(
    func: T, 
    limit: number
  ): T {
    let inThrottle = false;
    // eslint-disable-next-line @typescript-eslint/no-explicit-any
    return function(this: unknown, ...args: any[]) {
      if (!inThrottle) {
        func.apply(this, args);
        inThrottle = true;
        setTimeout(() => inThrottle = false, limit);
      }
    } as T;
  }

  return (
    <div className="flex flex-col relative bg-background dark:bg-gradient-to-b dark:from-[#0a192f] dark:to-[#112240]" ref={scrollRef}>
      {/* Ensure navbar has higher z-index than all other elements */}
      <div className="z-[100]">
        <Navbar transparent />
      </div>
      
      {/* Scroll Indicator */}
      <div className="fixed right-8 top-1/2 -translate-y-1/2 z-50 hidden md:flex flex-col gap-3">
        {Array(4).fill(0).map((_, i) => (
          <button
            key={i}
            className={`w-3 h-3 rounded-full transition-all duration-300 cursor-pointer ${
              i === currentSection 
                ? "bg-primary scale-125" 
                : "bg-primary/30 hover:bg-primary/50"
            }`}
            onClick={() => scrollToSection(i)}
            aria-label={`Scroll to section ${i + 1}`}
            />
        ))}
      </div>
      
      <main className="flex-1 pt-16 text-foreground"> {/* Add text-foreground to ensure text respects theme */}
        <div 
          ref={(el) => addSection(el)} 
          className="min-h-screen flex items-center justify-center"
          id="hero-section"
          >
          <Hero />
        </div>
        
        <div 
          ref={(el) => addSection(el)} 
          className="min-h-screen flex items-center justify-center"
          id="features-section"
        >
          <Features />
        </div>
        
        <div 
          ref={(el) => addSection(el)} 
          className="min-h-screen flex items-center justify-center"
          id="testimonials-section"
        >
          <Testimonials />
        </div>
        
        <div 
          ref={(el) => addSection(el)} 
          className="min-h-screen flex items-center justify-center"
          id="cta-section"
        >
          <Cta />
        </div>
      </main>
      
      <Footer />
    </div>
  );
}
