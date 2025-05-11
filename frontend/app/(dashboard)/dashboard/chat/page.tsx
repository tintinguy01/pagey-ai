"use client";

import React, { useState, useEffect } from "react";
import { motion } from "framer-motion";
import { CalendarIcon, FileTextIcon, MessageSquareIcon, Pencil, Trash2 } from "lucide-react";
import { formatDistanceToNow } from "date-fns";
import { useLoadingNavigation } from "@/hooks/use-loading-navigation";
import { useUser } from "@clerk/nextjs";
import { getChats, updateChat, Chat } from "@/api/client";
import { SearchBar } from "@/components/ui/search-bar";
import { useToast } from "@/hooks/use-toast";
import { Input } from "@/components/ui/input";
import { AlertDialog, AlertDialogTrigger, AlertDialogContent, AlertDialogHeader, AlertDialogTitle, AlertDialogFooter, AlertDialogAction, AlertDialogCancel } from "@/components/ui/alert-dialog";

export default function ChatsPage() {
  const [searchQuery, setSearchQuery] = useState("");
  const [chats, setChats] = useState<Chat[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const { navigateWithLoading } = useLoadingNavigation();
  const { user, isLoaded: isUserLoaded } = useUser();
  const { toast } = useToast();
  
  // Inline edit state
  const [editingId, setEditingId] = useState<number | null>(null);
  const [editValue, setEditValue] = useState("");
  const [deleteId, setDeleteId] = useState<number | null>(null);
  
  // For chat list refresh from TrashDialog or sidebar
  const [refreshChats, setRefreshChats] = useState(0);
  useEffect(() => {
    const handler = () => setRefreshChats(c => c + 1);
    window.addEventListener('chats-updated', handler);
    return () => window.removeEventListener('chats-updated', handler);
  }, []);
  const triggerChatsUpdated = () => {
    window.dispatchEvent(new Event('chats-updated'));
  };
  
  // Get chats from the backend API
  useEffect(() => {
    const fetchChats = async () => {
      if (!user?.id) return;
      
      try {
        setIsLoading(true);
        const response = await getChats(user.id);
        setChats(response.filter(chat => !chat.is_archived));
      } catch (error) {
        console.error("Error fetching chats:", error);
      } finally {
        setIsLoading(false);
      }
    };
    
    if (isUserLoaded && user) {
      fetchChats();
    }
  }, [user, isUserLoaded, refreshChats]);
  
  const handleClickOutside = () => {
    // This function is no longer used
  };

  const filteredChats = chats.filter((chat) => 
    chat.title.toLowerCase().includes(searchQuery.toLowerCase()) ||
    chat.preview.toLowerCase().includes(searchQuery.toLowerCase())
  );

  const navigateToChat = (chatId: number) => {
    navigateWithLoading(`/dashboard/chat/${chatId}`);
    setTimeout(() => triggerChatsUpdated(), 500);
  };

  const handleMoveToTrash = async (chatId: number) => {
    try {
      await updateChat(chatId, undefined, true);
      setChats(prevChats => prevChats.filter(chat => chat.id !== chatId));
      toast({ title: "Chat moved to trash. You can restore it from Trash." });
      navigateWithLoading("/dashboard/chat");
    } catch (error) {
      toast({ title: "Failed to move chat to trash." });
      console.error("Error moving chat to trash:", error);
    }
  };

  const handleRename = async (chatId: number, newTitle: string) => {
    if (newTitle.trim()) {
      try {
        const updatedChat = await updateChat(chatId, newTitle.trim());
        setChats(prevChats => prevChats.map(chat => chat.id === chatId ? updatedChat : chat));
        toast({ title: "Chat renamed successfully." });
      } catch (error) {
        toast({ title: "Failed to rename chat." });
        console.error("Error renaming chat:", error);
      }
    }
  };

  // Group chats by date sections, ensuring each chat appears only in the most recent section
  const today = new Date();
  const yesterday = new Date(today);
  yesterday.setDate(yesterday.getDate() - 1);
  const thisWeek = new Date(today);
  thisWeek.setDate(thisWeek.getDate() - 7);
  const thisMonth = new Date(today);
  thisMonth.setMonth(thisMonth.getMonth() - 1);

  // Deduplicate chats: only show in the most recent section
  const seenChatIds = new Set<number>();
  function filterAndMark(chats: Chat[]) {
    return chats.filter(chat => {
      if (seenChatIds.has(chat.id)) return false;
      seenChatIds.add(chat.id);
      return true;
    });
  }

  const chatsBySection = {
    today: filterAndMark(filteredChats.filter((chat) => {
      const chatDate = new Date(chat.last_active);
      return chatDate.getDate() === today.getDate() && 
        chatDate.getMonth() === today.getMonth() && 
        chatDate.getFullYear() === today.getFullYear();
    })),
    yesterday: filterAndMark(filteredChats.filter((chat) => {
      const chatDate = new Date(chat.last_active);
      return chatDate.getDate() === yesterday.getDate() && 
        chatDate.getMonth() === yesterday.getMonth() && 
        chatDate.getFullYear() === yesterday.getFullYear();
    })),
    thisWeek: filterAndMark(filteredChats.filter((chat) => {
      const chatDate = new Date(chat.last_active);
      return chatDate > thisWeek && 
        chatDate < yesterday;
    })),
    thisMonth: filterAndMark(filteredChats.filter((chat) => {
      const chatDate = new Date(chat.last_active);
      return chatDate > thisMonth && 
        chatDate < thisWeek;
    })),
    older: filterAndMark(filteredChats.filter((chat) => {
      const chatDate = new Date(chat.last_active);
      return chatDate < thisMonth;
    }))
  };

  // Show loading state if user is not loaded yet
  if (!isUserLoaded || isLoading) {
    return (
      <div className="container mx-auto p-6 max-w-5xl">
        <div className="flex justify-between items-center mb-6">
          <h1 className="text-2xl font-bold">Your Chats</h1>
        </div>
        <div className="flex justify-center items-center py-12">
          <div className="animate-pulse flex flex-col space-y-4 w-full">
            <div className="h-6 bg-sidebar rounded w-1/3"></div>
            <div className="space-y-2">
              {[1, 2, 3].map(i => (
                <div key={i} className="h-24 bg-sidebar rounded"></div>
              ))}
            </div>
          </div>
        </div>
      </div>
    );
  }

  return (
    <div className="container mx-auto p-6 max-w-5xl" onClick={handleClickOutside}>
      <div className="flex justify-between items-center mb-6">
        <h1 className="text-2xl font-bold">Your Chats</h1>
        <div className="relative w-64">
          <SearchBar
            placeholder="Search chats..."
            value={searchQuery}
            onChange={(value) => setSearchQuery(value)}
          />
        </div>
      </div>

      {filteredChats.length === 0 ? (
        <div className="flex flex-col items-center justify-center py-16 text-center">
          <div className="rounded-full bg-secondary p-6 mb-4">
            <MessageSquareIcon className="h-10 w-10 text-muted-foreground" />
          </div>
          <h3 className="text-xl font-medium mb-2">No chats found</h3>
          {searchQuery ? (
            <p className="text-muted-foreground max-w-md">
              No chats match your search criteria. Try a different search term or clear your search.
            </p>
          ) : (
            <p className="text-muted-foreground max-w-md">
              You haven&apos;t started any chats yet. Upload a document and start chatting with Pagey AI!
            </p>
          )}
          <motion.button
            whileHover={{ scale: 1.05 }}
            whileTap={{ scale: 0.95 }}
            className="mt-6 bg-primary text-primary-foreground px-4 py-2 rounded-full font-medium cursor-pointer"
            onClick={() => {
              navigateWithLoading('/dashboard/new');
              setTimeout(() => triggerChatsUpdated(), 500);
            }}
          >
            Start a New Chat
          </motion.button>
        </div>
      ) : (
        <div className="space-y-8">
          {/* Today's Chats */}
          {chatsBySection.today.length > 0 && (
            <section>
              <h2 className="text-sm font-medium text-muted-foreground mb-3 flex items-center">
                <CalendarIcon className="h-4 w-4 mr-2" /> Today
              </h2>
              <div className="space-y-3">
                {chatsBySection.today.map((chat) => renderChatCard(chat))}
              </div>
            </section>
          )}

          {/* Yesterday's Chats */}
          {chatsBySection.yesterday.length > 0 && (
            <section>
              <h2 className="text-sm font-medium text-muted-foreground mb-3 flex items-center">
                <CalendarIcon className="h-4 w-4 mr-2" /> Yesterday
              </h2>
              <div className="space-y-3">
                {chatsBySection.yesterday.map((chat) => renderChatCard(chat))}
              </div>
            </section>
          )}

          {/* This Week's Chats */}
          {chatsBySection.thisWeek.length > 0 && (
            <section>
              <h2 className="text-sm font-medium text-muted-foreground mb-3 flex items-center">
                <CalendarIcon className="h-4 w-4 mr-2" /> This Week
              </h2>
              <div className="space-y-3">
                {chatsBySection.thisWeek.map((chat) => renderChatCard(chat))}
              </div>
            </section>
          )}

          {/* This Month's Chats */}
          {chatsBySection.thisMonth.length > 0 && (
            <section>
              <h2 className="text-sm font-medium text-muted-foreground mb-3 flex items-center">
                <CalendarIcon className="h-4 w-4 mr-2" /> This Month
              </h2>
              <div className="space-y-3">
                {chatsBySection.thisMonth.map((chat) => renderChatCard(chat))}
              </div>
            </section>
          )}

          {/* Older Chats */}
          {chatsBySection.older.length > 0 && (
            <section>
              <h2 className="text-sm font-medium text-muted-foreground mb-3 flex items-center">
                <CalendarIcon className="h-4 w-4 mr-2" /> Older
              </h2>
              <div className="space-y-3">
                {chatsBySection.older.map((chat) => renderChatCard(chat))}
              </div>
            </section>
          )}
        </div>
      )}
    </div>
  );

  function renderChatCard(chat: Chat) {
    const isEditing = editingId === chat.id;
    return (
      <motion.div 
        key={chat.id}
        initial={{ opacity: 0, y: 10 }}
        animate={{ opacity: 1, y: 0 }}
        whileHover={{ scale: 1.01 }}
        transition={{ duration: 0.2 }}
        className="bg-sidebar border border-border hover:border-primary/30 rounded-lg p-4 hover:shadow-sm transition-all cursor-pointer flex flex-col justify-between relative"
        onClick={() => navigateToChat(chat.id)}
      >
        <div className="flex-1 pr-4">
          <div className="flex items-center justify-between">
            {isEditing ? (
              <Input
                className="font-medium text-base bg-transparent border-none shadow-none px-0 py-0 h-auto focus-visible:ring-0 focus-visible:border-none"
                value={editValue}
                autoFocus
                onChange={e => setEditValue(e.target.value)}
                onBlur={() => setEditingId(null)}
                onKeyDown={async e => {
                  if (e.key === "Enter") {
                    await handleRename(chat.id, editValue);
                    setEditingId(null);
                  } else if (e.key === "Escape") {
                    setEditingId(null);
                  }
                }}
              />
            ) : (
              <h3 className="font-medium">{chat.title}</h3>
            )}
            <span className="text-xs text-muted-foreground">
              {formatDistanceToNow(new Date(chat.last_active), { addSuffix: true })}
            </span>
          </div>
          <div className="flex items-center mt-1">
            <span className="flex items-center text-xs text-muted-foreground">
              <MessageSquareIcon className="h-3 w-3 mr-1" />
              {chat.message_count} messages
            </span>
            <span className="mx-2 text-muted-foreground">•</span>
            <span className="flex items-center text-xs text-muted-foreground">
              <FileTextIcon className="h-3 w-3 mr-1" />
              {chat.document_count} {chat.document_count === 1 ? 'document' : 'documents'}
            </span>
          </div>
          <p className="text-sm text-muted-foreground mt-2 truncate">
            {chat.preview}
          </p>
        </div>
        <div className="absolute bottom-3 right-3 flex gap-2 z-10">
          <Pencil
            className="h-4 w-4 text-muted-foreground cursor-pointer hover:text-primary"
            onClick={e => {
              e.stopPropagation();
              setEditingId(chat.id);
              setEditValue(chat.title);
            }}
          />
          <AlertDialog open={deleteId === chat.id} onOpenChange={open => !open && setDeleteId(null)}>
            <AlertDialogTrigger asChild>
              <Trash2
                className="h-4 w-4 text-destructive cursor-pointer hover:text-destructive/80"
                onClick={e => {
                  e.stopPropagation();
                  setDeleteId(chat.id);
                }}
              />
            </AlertDialogTrigger>
            <AlertDialogContent>
              <AlertDialogHeader>
                <AlertDialogTitle>Delete Chat?</AlertDialogTitle>
                <div>This will move the chat to trash. You can restore it from Trash later.</div>
              </AlertDialogHeader>
              <AlertDialogFooter>
                <AlertDialogCancel className="cursor-pointer">Cancel</AlertDialogCancel>
                <AlertDialogAction
                  className="bg-destructive text-destructive-foreground cursor-pointer"
                  onClick={async () => {
                    await handleMoveToTrash(chat.id);
                    setDeleteId(null);
                  }}
                >Delete</AlertDialogAction>
              </AlertDialogFooter>
            </AlertDialogContent>
          </AlertDialog>
        </div>
      </motion.div>
    );
  }
} 