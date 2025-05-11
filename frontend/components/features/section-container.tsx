"use client";

import React from "react";

interface SectionContainerProps {
  id?: string;
  className?: string;
  children: React.ReactNode;
  bgClassName?: string;
}

export function SectionContainer({ 
  id, 
  className = "", 
  children,
  bgClassName = "bg-background dark:bg-gradient-to-b dark:from-[#0a192f] dark:to-[#112240]"
}: SectionContainerProps) {
  return (
    <section 
      id={id}
      className={`relative overflow-hidden w-full h-full min-h-screen flex items-center ${bgClassName} ${className}`}
    >
      {children}
    </section>
  );
} 