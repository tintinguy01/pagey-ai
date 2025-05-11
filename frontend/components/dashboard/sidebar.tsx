"use client";

import React, { useState } from "react";
import { motion, AnimatePresence } from "framer-motion";
import Link from "next/link";
import { usePathname } from "next/navigation";
import { 
  ChevronLeft,
  Home, 
  Menu, 
  MessageSquare, 
  Plus, 
  X
} from "lucide-react";
import { ThemeToggle } from "@/components/theme-toggle";
import { Mascot } from "@/components/mascot/mascot";
import { TrashDialog } from "@/components/dashboard/trash-dialog";
import { UserSection } from "@/components/dashboard/user-section";
import { SettingsSection } from "@/components/dashboard/settings-section";

interface SidebarProps {
  children: React.ReactNode;
  onChatChange?: () => void;
}

export function Sidebar({ children, onChatChange }: SidebarProps) {
  const [isCollapsed, setIsCollapsed] = useState(false);
  const [isMobileOpen, setIsMobileOpen] = useState(false);
  const pathname = usePathname();
  
  const toggleSidebar = () => {
    setIsCollapsed(!isCollapsed);
  };

  const toggleMobileSidebar = () => {
    setIsMobileOpen(!isMobileOpen);
  };

  const sidebarLinks = [
    { href: "/dashboard", icon: <Home size={20} />, label: "Home" },
    { href: "/dashboard/new", icon: <Plus size={20} />, label: "New Chat" },
    { href: "/dashboard/chat", icon: <MessageSquare size={20} />, label: "Your Chats" },
    // Trash and Settings handled by dialog components below
  ];

  return (
    <div className="min-h-screen flex flex-col bg-background">
      {/* Mobile Header */}
      <header className="sticky top-0 z-40 w-full border-b border-border bg-background md:hidden">
        <div className="flex h-16 items-center justify-between px-4">
          <div className="flex items-center gap-2">
            <button
              onClick={toggleMobileSidebar}
              className="mr-2 rounded-md p-2 text-muted-foreground hover:bg-accent hover:text-accent-foreground"
              aria-label="Toggle Menu"
            >
              <Menu size={20} />
            </button>
            <div className="flex items-center gap-2">
              <Mascot size="sm" mood="happy" interactive />
              <span className="font-bold text-primary">Pagey AI</span>
            </div>
          </div>
          <ThemeToggle />
        </div>
      </header>

      {/* Sidebar & Content Container */}
      <div className="flex flex-row flex-1 min-h-0 min-w-0 overflow-hidden">
        {/* Desktop Sidebar */}
        <motion.aside
          className="hidden md:flex flex-col border-r border-border bg-sidebar z-40 overflow-y-auto"
          animate={{ 
            width: isCollapsed ? 120 : 260 
          }}
          transition={{ duration: 0.2 }}
        >
          <div className="flex h-16 items-center border-b border-border px-4 relative">
            {isCollapsed ? (
              <div className="flex w-full items-center justify-between">
                <Link href="/dashboard" className="flex items-center">
                  <Mascot size="sm" mood="happy" interactive />
                </Link>
                <button
                  onClick={toggleSidebar}
                  className="bg-sidebar-accent text-sidebar-foreground rounded-md p-1"
                  aria-label="Expand sidebar"
                >
                  <ChevronLeft className="h-4 w-4 rotate-180 cursor-pointer" />
                </button>
              </div>
            ) : (
              <div className="flex w-full justify-between items-center">
                <Link href="/dashboard" className="flex items-center gap-2">
                  <Mascot size="sm" mood="happy" interactive />
                  <motion.span
                    initial={{ opacity: 0 }}
                    animate={{ opacity: 1 }}
                    exit={{ opacity: 0 }}
                    className="font-bold text-sidebar-foreground"
                  >
                    Pagey AI
                  </motion.span>
                </Link>
                <button
                  onClick={toggleSidebar}
                  className="bg-sidebar-accent text-sidebar-foreground rounded-md p-1"
                  aria-label="Collapse sidebar"
                >
                  <ChevronLeft className="h-4 w-4 cursor-pointer" />
                </button>
              </div>
            )}
          </div>
          
          <div className="flex-1 overflow-auto py-4">
            <nav className="grid gap-1 px-2">
              {sidebarLinks.map((link) => (
                <Link
                  key={link.href}
                  href={link.href}
                  className={`group flex items-center ${isCollapsed ? "justify-center" : ""} gap-3 rounded-md px-3 py-2 text-sm font-medium transition-all hover:scale-105 relative
                    ${(link.href === "/dashboard" && pathname === "/dashboard") || 
                      (link.href !== "/dashboard" && pathname.startsWith(link.href))
                      ? "bg-sidebar-primary text-sidebar-primary-foreground" 
                      : "text-sidebar-foreground hover:bg-sidebar-accent hover:text-sidebar-accent-foreground"
                    }`}
                >
                  <div className={`${isCollapsed ? "flex justify-center items-center" : ""}`}>
                    {link.icon}
                  </div>
                  {!isCollapsed && (
                    <motion.span
                      initial={{ opacity: 0 }}
                      animate={{ opacity: 1 }}
                      exit={{ opacity: 0 }}
                      className="flex-1"
                    >
                      {link.label}
                    </motion.span>
                  )}
                </Link>
              ))}
              <TrashDialog onChatChange={onChatChange} isCollapsed={isCollapsed} />
            </nav>
          </div>
          
          <div className="border-t border-border mt-auto py-4 flex flex-col gap-2 px-2 pb-4">
            <SettingsSection isCollapsed={isCollapsed} />
            <UserSection isCollapsed={isCollapsed} />
          </div>
        </motion.aside>

        {/* Mobile Sidebar - Overlay */}
        <AnimatePresence>
          {isMobileOpen && (
            <>
              <motion.div
                className="fixed inset-0 z-50 bg-black/80 md:hidden"
                initial={{ opacity: 0 }}
                animate={{ opacity: 1 }}
                exit={{ opacity: 0 }}
                onClick={toggleMobileSidebar}
              />
              <motion.aside
                className="fixed inset-y-0 left-0 z-50 flex w-80 flex-col border-r border-border bg-sidebar md:hidden"
                initial={{ x: "-100%" }}
                animate={{ x: 0 }}
                exit={{ x: "-100%" }}
                transition={{ ease: "easeInOut", duration: 0.3 }}
              >
                <div className="flex h-16 items-center border-b border-border px-4">
                  <Link href="/dashboard" className="flex items-center gap-2" onClick={toggleMobileSidebar}>
                    <Mascot size="sm" mood="happy" interactive />
                    <span className="font-bold text-sidebar-foreground">Pagey AI</span>
                  </Link>
                  <button
                    className="ml-auto rounded-md p-2 text-sidebar-foreground hover:bg-sidebar-accent hover:text-sidebar-accent-foreground"
                    onClick={toggleMobileSidebar}
                    aria-label="Close Sidebar"
                  >
                    <X size={18} />
                  </button>
                </div>
                
                <div className="flex-1 overflow-auto py-4">
                  <div className="flex h-16 items-center border-b border-border px-4">
                    <UserSection isCollapsed={false} />
                  </div>
                  <nav className="grid gap-1 px-2">
                    {sidebarLinks.map((link) => (
                      <Link
                        key={link.href}
                        href={link.href}
                        className={`group flex items-center gap-3 rounded-md px-3 py-2 text-sm font-medium transition-colors
                          ${pathname === link.href || pathname.startsWith(`${link.href}/`)
                            ? "bg-sidebar-primary text-sidebar-primary-foreground" 
                            : "text-sidebar-foreground hover:bg-sidebar-accent hover:text-sidebar-accent-foreground"
                          }`}
                        onClick={toggleMobileSidebar}
                      >
                        {link.icon}
                        <span className="flex-1">{link.label}</span>
                      </Link>
                    ))}
                    <TrashDialog onChatChange={onChatChange} isCollapsed={false} />
                  </nav>
                </div>
                
                <div className="border-t border-border mt-auto py-4 flex flex-col gap-2 px-2 pb-4">
                  <SettingsSection isCollapsed={false} />
                  <UserSection isCollapsed={false} />
                </div>
              </motion.aside>
            </>
          )}
        </AnimatePresence>

        {/* Main Content */}
        <main className="flex-1 min-w-0 min-h-0 overflow-hidden">
          {children}
        </main>
      </div>
    </div>
  );
} 