"use client";

import React, { useState, useEffect } from "react";
import Link from "next/link";
import { motion, useScroll, useTransform } from "framer-motion";
import { usePathname } from "next/navigation";
import { ThemeToggle } from "@/components/theme-toggle";
import { Mascot } from "@/components/mascot/mascot";
import { useTheme } from "next-themes";
import { SignOutButton } from "@clerk/nextjs";
import { useLoadingNavigation } from "@/hooks/use-loading-navigation";

const MotionLink = motion(Link);

interface NavbarProps {
  transparent?: boolean;
}

export function Navbar({ transparent = false }: NavbarProps) {
  const pathname = usePathname();
  const [scrolled, setScrolled] = useState(false);
  const { scrollY } = useScroll();
  const { theme } = useTheme();
  const isDarkTheme = theme === "dark";
  
  // Get auth status and navigation helpers from custom hook
  const { isSignedIn, isLoaded, navigateToDashboard } = useLoadingNavigation();
  
  // Use static values for initial render to avoid hydration mismatch
  const [mounted, setMounted] = useState(false);
  
  useEffect(() => {
    setMounted(true);
  }, []);

  const navOpacity = useTransform(scrollY, [0, 50], [transparent ? 0.8 : 1, 1]);
  const navBlur = useTransform(scrollY, [0, 50], [3, 8]);
  
  // Dynamic background colors based on theme
  const darkBgInitial = transparent ? 'rgba(10, 25, 47, 0.8)' : 'rgba(10, 25, 47, 0.9)';
  const darkBgScrolled = 'rgba(10, 25, 47, 0.95)';
  const lightBgInitial = transparent ? 'rgba(247, 250, 252, 0.8)' : 'rgba(247, 250, 252, 0.9)';
  const lightBgScrolled = 'rgba(247, 250, 252, 0.95)';
  
  // Use theme-based background
  const navBackground = useTransform(
    scrollY, 
    [0, 50], 
    isDarkTheme 
      ? [darkBgInitial, darkBgScrolled]
      : [lightBgInitial, lightBgScrolled]
  );
  
  // Detect scroll position
  useEffect(() => {
    const handleScroll = () => {
      if (window.scrollY > 20) {
        setScrolled(true);
      } else {
        setScrolled(false);
      }
    };
    
    // Initial call to set correct state on load
    handleScroll();
    
    window.addEventListener("scroll", handleScroll);
    return () => window.removeEventListener("scroll", handleScroll);
  }, []);
  
  const hoverScale = { 
    scale: 1.05, 
    transition: { type: "spring", stiffness: 400, damping: 10 } 
  };

  // Use static styles for server rendering and first client render
  // Then switch to dynamic styles after hydration
  const headerStyle = mounted 
    ? { 
        opacity: navOpacity, 
        backdropFilter: `blur(${navBlur.get()}px)`,
        backgroundColor: navBackground
      }
    : { 
        backdropFilter: "blur(3px)",
        // Use a fixed background color for initial render regardless of theme
        // to avoid hydration mismatch
        backgroundColor: transparent ? 'rgba(10, 25, 47, 0.8)' : 'rgba(10, 25, 47, 0.9)'
      };
  
  const handleAuthAction = () => {
    navigateToDashboard();
  };
  
  return (
    <motion.header 
      className={`w-full fixed top-0 z-[100] ${
        scrolled ? "shadow-md" : ""
      }`}
      style={headerStyle}
      initial={{ y: -100 }}
      animate={{ y: 0 }}
      transition={{ duration: 0.3 }}
    >
      <div className="flex h-16 items-center justify-between container px-4 mx-auto">
        <div className="flex items-center gap-2">
          <Link href="/" className="flex items-center gap-2">
            <div className="relative">
              <Mascot size="sm" interactive />
            </div>
            <motion.span 
              className="text-xl font-bold text-primary"
              animate={{ scale: scrolled ? 0.9 : 1 }}
              transition={{ duration: 0.2 }}
            >
              Pagey AI
            </motion.span>
          </Link>
        </div>
        
        {/* Center nav items */}
        <nav className="hidden md:flex items-center gap-6">
          {[
            { href: "/features", label: "Features" },
            { href: "/pricing", label: "Pricing" },
            { href: "/documentation", label: "Documentation" },
            { href: "/blog", label: "Blog" },
          ].map((item) => (
            <Link
              key={item.href}
              href={item.href}
              className={`text-sm font-medium transition-colors hover:text-primary ${pathname === item.href ? "text-primary" : "text-muted-foreground"}`}
            >
              {item.label}
            </Link>
          ))}
        </nav>
        
        <div className="flex items-center gap-4">
          {isLoaded && isSignedIn ? (
            <>
              <MotionLink
                href="#"
                onClick={(e) => {
                  e.preventDefault();
                  handleAuthAction();
                }}
                className="rounded-full bg-primary px-4 py-2 text-sm font-medium text-primary-foreground"
                whileHover={hoverScale}
                whileTap={{ scale: 0.95 }}
              >
                Enter Pagey AI
              </MotionLink>
              <SignOutButton>
                <motion.button
                  className="rounded-full bg-secondary px-4 py-2 text-sm font-medium text-secondary-foreground cursor-pointer"
                  whileHover={hoverScale}
                  whileTap={{ scale: 0.95 }}
                >
                  Sign Out
                </motion.button>
              </SignOutButton>
            </>
          ) : (
            <motion.button
              onClick={handleAuthAction}
              className="rounded-full bg-primary px-4 py-2 text-sm font-medium text-primary-foreground cursor-pointer"
              whileHover={hoverScale}
              whileTap={{ scale: 0.95 }}
            >
              Sign In
            </motion.button>
          )}
          <ThemeToggle className="cursor-pointer" />
        </div>
      </div>
    </motion.header>
  );
} 