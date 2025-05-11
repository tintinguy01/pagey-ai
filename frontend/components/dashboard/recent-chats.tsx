"use client";

import React, { useState, useEffect } from "react";
import { motion } from "framer-motion";
import Link from "next/link";
import { ChevronRight, FileUp, MessageSquare, Plus } from "lucide-react";
import { Mascot } from "@/components/mascot";
import { useUser } from "@clerk/nextjs";
import { formatDistanceToNow } from "date-fns";
import { getChats } from "@/api/client";
import { Chat } from "@/api/client";

export function RecentChats() {
  const { user } = useUser();
  const userId = user?.id || "";
  const [chats, setChats] = useState<Chat[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  
  // Fetch chats from API
  useEffect(() => {
    const fetchChats = async () => {
      if (!userId) return;
      
      try {
        setIsLoading(true);
        const fetchedChats = await getChats(userId);
        setChats(fetchedChats);
      } catch (error) {
        console.error("Failed to fetch chats:", error);
      } finally {
        setIsLoading(false);
      }
    };
    
    fetchChats();
  }, [userId]);
  
  // Sort by last active and take only the most recent 3
  const recentChats = [...chats]
    .sort((a, b) => new Date(b.last_active).getTime() - new Date(a.last_active).getTime())
    .slice(0, 3);
  
  const container = {
    hidden: { opacity: 0 },
    show: {
      opacity: 1,
      transition: {
        staggerChildren: 0.1,
      }
    }
  };
  
  const item = {
    hidden: { opacity: 0, y: 20 },
    show: { opacity: 1, y: 0 }
  };
  
  // Format date to relative time (e.g. "2 hours ago")
  const formatDate = (dateString: string) => {
    return formatDistanceToNow(new Date(dateString), { addSuffix: true });
  };
  
  return (
    <div className="space-y-4">
      <motion.div 
        className="flex justify-between items-center"
        initial={{ opacity: 0, y: 10 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ duration: 0.3 }}
      >
        <h2 className="text-xl font-semibold">Recent Chats</h2>
        <Link 
          href="/dashboard/chat"
          className="text-primary text-sm hover:underline flex items-center"
        >
          View all <ChevronRight className="h-4 w-4 ml-1" />
        </Link>
      </motion.div>
      
      <motion.div
        variants={container}
        initial="hidden"
        animate="show"
        className="space-y-3"
      >
        {isLoading ? (
          <div className="text-center py-12">
            <p>Loading chats...</p>
          </div>
        ) : (
          <>
            {recentChats.map((chat: Chat) => (
              <motion.div 
                key={chat.id}
                variants={item}
                whileHover={{ 
                  scale: 1.01, 
                  boxShadow: "0 4px 20px rgba(0, 0, 0, 0.05)",
                  borderColor: "rgba(19, 137, 253, 0.3)"
                }}
                className="p-4 bg-sidebar rounded-xl border border-border transition-all duration-200"
              >
                <Link href={`/dashboard/chat/${chat.id}`} className="block">
                  <div className="flex justify-between mb-2">
                    <h3 className="font-medium">{chat.title}</h3>
                    <span className="text-xs text-muted-foreground">{formatDate(chat.last_active)}</span>
                  </div>
                  <p className="text-sm text-muted-foreground mb-3 line-clamp-1">{chat.preview}</p>
                  <div className="flex items-center text-xs text-muted-foreground">
                    <FileUp className="h-3 w-3 mr-1" /> {chat.document_count} {chat.document_count === 1 ? 'file' : 'files'}
                    <MessageSquare className="h-3 w-3 ml-3 mr-1" /> Chat
                  </div>
                </Link>
              </motion.div>
            ))}
            
            {recentChats.length === 0 && (
              <motion.div 
                initial={{ opacity: 0, y: 20 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ delay: 0.3 }}
                className="text-center py-12"
              >
                <Mascot size="md" mood="thinking" className="mx-auto mb-4" />
                <h3 className="font-medium mb-1">No chats yet</h3>
                <p className="text-sm text-muted-foreground mb-4">Upload some PDFs and start chatting</p>
                <Link 
                  href="/dashboard/new"
                  className="inline-flex items-center justify-center rounded-full bg-primary px-4 py-2 text-sm font-medium text-primary-foreground transition-colors hover:bg-primary/90"
                >
                  <Plus className="h-4 w-4 mr-2" /> New Chat
                </Link>
              </motion.div>
            )}
          </>
        )}
      </motion.div>
    </div>
  );
} 