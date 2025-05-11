"use client";

import React from "react";
import { Navbar } from "@/components/layout/navbar";
import { Footer } from "@/components/layout/footer";

interface PageLayoutProps {
  children: React.ReactNode;
  className?: string;
  bgClassName?: string;
}

export function PageLayout({ 
  children, 
  className = "", 
  bgClassName = "bg-background dark:bg-gradient-to-b dark:from-[#0a192f] dark:to-[#112240]" 
}: PageLayoutProps) {
  return (
    <div className={`flex flex-col min-h-screen ${bgClassName} ${className}`}>
      <Navbar />
      <main className="flex-1 text-foreground">
        {children}
      </main>
      <Footer />
    </div>
  );
} 