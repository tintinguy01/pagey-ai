"use client";

import React, { useState, useEffect, useRef } from "react";
import { Mascot } from "@/components/mascot";
import {
  ChevronLeft,
  ChevronRight,
  FileText,
  MessageSquare,
  Pencil,
  Trash2
} from "lucide-react";
import Link from "next/link";
import { useLoadingNavigation } from "@/hooks/use-loading-navigation";
import { getChat, getMessages, getDocuments, Message, Document, Chat, updateChat } from "@/api/client";
import { Input } from "@/components/ui/input";
import { AlertDialog, AlertDialogTrigger, AlertDialogContent, AlertDialogHeader, AlertDialogTitle, AlertDialogFooter, AlertDialogAction, AlertDialogCancel } from "@/components/ui/alert-dialog";
import { toast } from "@/hooks/use-toast";
import dynamic from "next/dynamic";

// Import our components
const ReactPDFViewer = dynamic<{
  documents: Document[];
  selectedDocId: string | null;
  setSelectedDocId: (id: string) => void;
  onHighlightSource?: { file: string; page: number; highlight?: string; line_start?: number; line_end?: number; content?: string } | null;
  scrollToHighlightKey: number;
}>(
  () => import("@/components/chat-id/pdf-viewer/react-pdf-viewer").then(mod => mod.ReactPDFViewer),
  { ssr: false }
);
import { ChatMessages } from "@/components/chat-id/chat-section/chat-messages";
import { DocumentsList } from "@/components/chat-id/chat-section/documents-list";

export default function ChatPage({ params }: { params: { chatId: string } }) {
  const chatIdString = params.chatId;
  
  const { navigateWithLoading } = useLoadingNavigation();
  
  // Handle special case for "/dashboard/chat/new" URL
  React.useEffect(() => {
    if (chatIdString === "new") {
      // Redirect to the new chat creation page
      navigateWithLoading("/dashboard/new");
    }
  }, [chatIdString, navigateWithLoading]);
  
  const [activeTab, setActiveTab] = useState<"chat" | "files">("chat");
  const [showPdf, setShowPdf] = useState(true);
  const [selectedDocId, setSelectedDocId] = useState<string | null>(null);
  const [chat, setChat] = useState<Chat | null>(null);
  const [messages, setMessages] = useState<Message[]>([]);
  const [documents, setDocuments] = useState<Document[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  
  // Add refs and state for resizing
  const [pdfWidth, setPdfWidth] = useState<number>(40); // Default to 40%
  const [isResizing, setIsResizing] = useState(false);
  const resizingRef = useRef<boolean>(false);
  const startXRef = useRef<number>(0);
  const startWidthRef = useRef<number>(0);
  const containerRef = useRef<HTMLDivElement>(null);
  
  // Convert chatId to number
  const chatId = parseInt(chatIdString, 10);
  const isValidChatId = !isNaN(chatId);
  
  // Inline edit state
  const [editing, setEditing] = useState(false);
  const [editValue, setEditValue] = useState("");
  const [deleteDialogOpen, setDeleteDialogOpen] = useState(false);
  
  // State for PDF source highlighting
  const [highlightSource, setHighlightSource] = useState<{
    file: string;
    page: number;
    highlight?: string;
  } | null>(null);
  
  // Add a state to track active source badge
  const [activeSourceBadge, setActiveSourceBadge] = useState<string | null>(null);
  // Add a state to track the last source we scrolled to
  const [lastScrolledSourceId, setLastScrolledSourceId] = useState<string | null>(null);
  // Add a key to trigger scroll-to-highlight in the PDF viewer
  const [scrollToHighlightKey, setScrollToHighlightKey] = useState<number>(0);
  
  // Replace the highlightSource useEffect with a better one that doesn't auto-clear
  useEffect(() => {
    if (highlightSource) {
      // Scroll to the highlighted page but don't auto-clear the highlight
      // The user can now click the badge again to clear the highlight
    }
  }, [highlightSource]);
  
  // Fetch chat data from backend API
  useEffect(() => {
    const fetchChatData = async () => {
      if (!isValidChatId) {
        setIsLoading(false);
        return;
      }
      
      try {
        setIsLoading(true);
        const [chatData, messagesData, documentsData] = await Promise.all([
          getChat(chatId),
          getMessages(chatId),
          getDocuments(chatId)
        ]);
        
        setChat(chatData);
        setMessages(messagesData);
        setDocuments(documentsData);
      } catch (error) {
        console.error("Error fetching chat data:", error);
      } finally {
        setIsLoading(false);
      }
    };
    
    fetchChatData();
  }, [chatId, isValidChatId]);
  
  const togglePdfView = () => {
    setShowPdf(!showPdf);
  };
  
  // Function to refresh messages
  const refreshMessages = async () => {
    if (!isValidChatId) return;
    
    try {
      const messagesData = await getMessages(chatId);
      setMessages(messagesData);
    } catch (error) {
      console.error("Error refreshing messages:", error);
    }
  };
  
  // Function to refresh documents
  const refreshDocuments = async () => {
    if (!isValidChatId) return;
    try {
      const documentsData = await getDocuments(chatId);
      setDocuments(documentsData);
    } catch (error) {
      console.error("Error refreshing documents:", error);
    }
  };
  
  // Set the initially selected document once documents are loaded
  useEffect(() => {
    if (documents.length > 0 && !selectedDocId) {
      setSelectedDocId(documents[0].id.toString());
    }
  }, [documents, selectedDocId]);
  
  // Resizing functions
  const handleResizeStart = (e: React.MouseEvent | React.TouchEvent) => {
    e.preventDefault();
    e.stopPropagation();
    resizingRef.current = true;
    setIsResizing(true);
    const clientX = 'touches' in e ? e.touches[0].clientX : (e as React.MouseEvent).clientX;
    startXRef.current = clientX;
    // Use the actual current width of the PDF section for more accurate resizing
    if (containerRef.current) {
      const pdfContainer = containerRef.current.querySelector('[data-pdf-container="true"]') as HTMLElement | null;
      if (pdfContainer) {
        const style = window.getComputedStyle(pdfContainer);
        const containerWidth = containerRef.current.offsetWidth;
        if (style.width && containerWidth) {
          const pxWidth = parseFloat(style.width);
          startWidthRef.current = (pxWidth / containerWidth) * 100;
        } else {
          startWidthRef.current = pdfWidth;
        }
      } else {
        startWidthRef.current = pdfWidth;
      }
    } else {
      startWidthRef.current = pdfWidth;
    }
    document.body.style.cursor = 'col-resize';
    if ('touches' in e) {
      document.addEventListener('touchmove', handleTouchMove, { passive: false });
      document.addEventListener('touchend', handleResizeEnd);
      document.addEventListener('touchcancel', handleResizeEnd);
    } else {
      document.addEventListener('mousemove', handleResizeMove);
      document.addEventListener('mouseup', handleResizeEnd);
    }
  };
  const handleResizeMove = (e: MouseEvent) => {
    if (!resizingRef.current || !containerRef.current) return;
    e.preventDefault();
    const containerRect = containerRef.current.getBoundingClientRect();
    const mouseX = e.clientX - containerRect.left;
    const containerWidth = containerRef.current.offsetWidth;
    // Calculate new width as a percentage of the container
    let newWidth = (mouseX / containerWidth) * 100;
    newWidth = Math.max(20, Math.min(80, newWidth));
    const pdfContainer = containerRef.current.querySelector('[data-pdf-container="true"]') as HTMLElement | null;
    const chatContainer = containerRef.current.querySelector('[data-chat-container="true"]') as HTMLElement | null;
    if (pdfContainer) pdfContainer.style.width = `${newWidth}%`;
    if (chatContainer) chatContainer.style.width = `${100 - newWidth}%`;
    setPdfWidth(newWidth);
  };
  const handleTouchMove = (e: TouchEvent) => {
    if (!resizingRef.current || !containerRef.current) return;
    e.preventDefault();
    const containerRect = containerRef.current.getBoundingClientRect();
    const touchX = e.touches[0].clientX - containerRect.left;
    const containerWidth = containerRef.current.offsetWidth;
    let newWidth = (touchX / containerWidth) * 100;
    newWidth = Math.max(20, Math.min(80, newWidth));
    const pdfContainer = containerRef.current.querySelector('[data-pdf-container="true"]') as HTMLElement | null;
    const chatContainer = containerRef.current.querySelector('[data-chat-container="true"]') as HTMLElement | null;
    if (pdfContainer) pdfContainer.style.width = `${newWidth}%`;
    if (chatContainer) chatContainer.style.width = `${100 - newWidth}%`;
    setPdfWidth(newWidth);
  };
  const handleResizeEnd = () => {
    if (!resizingRef.current) return;
    resizingRef.current = false;
    setIsResizing(false);
    document.body.style.cursor = '';
    if (containerRef.current) {
      const pdfContainer = containerRef.current.querySelector('[data-pdf-container="true"]') as HTMLElement | null;
      if (pdfContainer) {
        const style = window.getComputedStyle(pdfContainer);
        const containerWidth = containerRef.current.offsetWidth;
        if (style.width && containerWidth) {
          const pxWidth = parseFloat(style.width);
          const percentWidth = Math.max(20, Math.min(80, (pxWidth / containerWidth) * 100));
          setPdfWidth(percentWidth);
        }
      }
    }
    document.removeEventListener('mousemove', handleResizeMove);
    document.removeEventListener('mouseup', handleResizeEnd);
    document.removeEventListener('touchmove', handleTouchMove);
    document.removeEventListener('touchend', handleResizeEnd);
    document.removeEventListener('touchcancel', handleResizeEnd);
  };
  useEffect(() => {
    return () => {
      document.removeEventListener('mousemove', handleResizeMove);
      document.removeEventListener('mouseup', handleResizeEnd);
      document.removeEventListener('touchmove', handleTouchMove);
      document.removeEventListener('touchend', handleResizeEnd);
      document.removeEventListener('touchcancel', handleResizeEnd);
    };
  }, []);
  
  // Rename handler
  const handleRename = async (newTitle: string) => {
    if (!chat || !newTitle.trim()) return;
    try {
      const updated = await updateChat(chat.id, newTitle.trim());
      setChat(updated);
      setEditing(false);
      toast({ title: "Chat renamed successfully." });
    } catch {
      toast({ title: "Failed to rename chat.", variant: "destructive" });
    }
  };
  
  // Archive (delete) handler
  const handleArchive = async () => {
    if (!chat) return;
    try {
      await updateChat(chat.id, undefined, true);
      toast({ title: "Chat moved to trash. You can restore it from Trash." });
      navigateWithLoading("/dashboard/chat");
    } catch {
      toast({ title: "Failed to move chat to trash.", variant: "destructive" });
    }
  };
  
  // Update the handleSourceClick function to toggle highlight and badge activation
  const handleSourceClick = (source: { file: string; page: number; highlight?: string }) => {
    // Create a unique identifier for this source badge
    const sourceBadgeId = `${source.file}-${source.page}-${source.highlight?.substring(0, 20) || ''}`;
    
    // If this badge is already active, clear the highlight
    if (activeSourceBadge === sourceBadgeId) {
      setHighlightSource(null);
      setActiveSourceBadge(null);
      return;
    }
    
    // Switch to chat tab if not already
    if (activeTab !== 'chat') setActiveTab('chat');
    
    // Show PDF viewer if hidden
    if (!showPdf) setShowPdf(true);
    
    // Find the document by name
    const doc = documents.find(d => d.name === source.file);
    if (doc) setSelectedDocId(doc.id.toString());
    
    // Set highlight source for PDF viewer
    setHighlightSource(source);
    
    // Set this badge as active
    setActiveSourceBadge(sourceBadgeId);

    // Only trigger scroll if this is a new badge (not the last one we scrolled to)
    if (lastScrolledSourceId !== sourceBadgeId) {
      setScrollToHighlightKey(prev => prev + 1); // Change key to trigger scroll
      setLastScrolledSourceId(sourceBadgeId);
    }
  };
  
  // Handle loading and error states
  if (!isValidChatId && !isLoading) {
    return (
      <div className="flex items-center justify-center h-screen">
        <p className="text-lg text-muted-foreground">Invalid chat ID</p>
      </div>
    );
  }
  
  // If the data is still loading
  if (isLoading) {
    return (
      <div className="flex flex-col h-screen">
        <header className="flex items-center justify-between border-b border-border p-4">
          <div className="flex items-center gap-2">
            <Link href="/dashboard/chat" className="p-1 rounded-full hover:bg-accent">
              <ChevronLeft className="h-5 w-5" />
            </Link>
            <div className="h-6 w-40 bg-secondary rounded-md animate-pulse"></div>
          </div>
        </header>
        <div className="flex-1 flex items-center justify-center">
          <Mascot size="md" mood="thinking" />
        </div>
      </div>
    );
  }
  
  // If there was an error or chat not found
  if ((!chat) && !isLoading) {
    return (
      <div className="flex items-center justify-center h-screen flex-col gap-4">
        <Mascot size="md" mood="thinking" />
        <p className="text-lg text-muted-foreground">Chat not found</p>
        <button 
          className="px-4 py-2 bg-primary text-primary-foreground rounded-md"
          onClick={() => navigateWithLoading("/dashboard/chat")}
        >
          Back to Chats
        </button>
      </div>
    );
  }

  return (
    <div className="flex flex-col h-screen w-full min-h-0">
      {/* Chat header */}
      <header className="flex items-center justify-between border-b border-border p-4">
        <div className="flex items-center gap-2 min-w-0 flex-1">
          <Link href="/dashboard/chat" className="p-1 rounded-full hover:bg-accent">
            <ChevronLeft className="h-5 w-5" />
          </Link>
          {editing ? (
            <Input
              className="font-bold text-lg bg-transparent border-none shadow-none px-0 py-0 h-auto focus-visible:ring-0 focus-visible:border-none"
              value={editValue}
              autoFocus
              onChange={e => setEditValue(e.target.value)}
              onBlur={() => setEditing(false)}
              onKeyDown={async e => {
                if (e.key === "Enter") {
                  await handleRename(editValue);
                } else if (e.key === "Escape") {
                  setEditing(false);
                }
              }}
            />
          ) : (
            <h2 className="font-bold text-lg flex items-center gap-2 min-w-0 truncate">
              <span className="truncate max-w-[200px]">{chat?.title}</span>
              <Pencil
                className="h-4 w-4 text-muted-foreground cursor-pointer hover:text-primary"
                onClick={() => {
                  if (!chat) return;
                  setEditing(true);
                  setEditValue(chat.title);
                }}
              />
            </h2>
          )}
        </div>
        {/* Move delete button to far right */}
        <div className="flex items-center ml-auto">
          <AlertDialog open={deleteDialogOpen} onOpenChange={setDeleteDialogOpen}>
            <AlertDialogTrigger asChild>
              <Trash2
                className="h-5 w-5 text-destructive cursor-pointer hover:text-destructive/80 ml-2"
                onClick={() => setDeleteDialogOpen(true)}
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
                  onClick={handleArchive}
                >Delete</AlertDialogAction>
              </AlertDialogFooter>
            </AlertDialogContent>
          </AlertDialog>
        </div>
      </header>
      {/* Overlay for resizing to capture mouse events above iframe */}
      {isResizing && (
        <div
          style={{ position: 'fixed', inset: 0, zIndex: 50, cursor: 'col-resize' }}
          onMouseMove={e => handleResizeMove(e.nativeEvent)}
          onMouseUp={handleResizeEnd}
          onMouseLeave={handleResizeEnd}
          onTouchMove={e => handleTouchMove(e.nativeEvent)}
          onTouchEnd={handleResizeEnd}
          onTouchCancel={handleResizeEnd}
        />
      )}
      <div ref={containerRef} className="flex flex-1 w-full min-h-0 h-0">
        {/* PDF viewer */}
        {showPdf && documents.length > 0 && (
          <div
            data-pdf-container="true"
            style={{ width: `${pdfWidth}%`, minWidth: '200px', maxWidth: '80%' }}
            className="h-full bg-background min-w-[200px]"
          >
            <ReactPDFViewer
              documents={documents}
              selectedDocId={selectedDocId}
              setSelectedDocId={setSelectedDocId}
              onHighlightSource={highlightSource}
              scrollToHighlightKey={scrollToHighlightKey}
            />
          </div>
        )}
        {/* Resize handle */}
        {showPdf && documents.length > 0 && (
          <div
            className={`cursor-ew-resize flex items-center justify-center w-1.5 flex-shrink-0 transition-colors ${isResizing ? 'bg-primary/50' : 'bg-primary/20 hover:bg-primary/30'}`}
            onMouseDown={handleResizeStart}
            onTouchStart={handleResizeStart}
            style={{ touchAction: 'none', zIndex: 10 }}
          >
            <div className="flex flex-col items-center gap-2">
              <div className="h-8 w-0.5 bg-primary rounded-full"></div>
              <div className="h-8 w-0.5 bg-primary rounded-full"></div>
              <div className="h-8 w-0.5 bg-primary rounded-full"></div>
            </div>
          </div>
        )}
        
        {/* Chat section */}
        <div
          data-chat-container="true"
          className="flex-1 min-w-[200px] flex flex-col h-full min-h-0"
          style={{ width: showPdf && documents.length > 0 ? `${100 - pdfWidth}%` : '100%' }}
        >
          {/* Tabs */}
          <div className="flex border-b border-border">
            <button 
              className={`flex-1 py-3 flex items-center justify-center gap-2 border-b-2 font-medium text-sm transition-colors cursor-pointer ${activeTab === 'chat' ? 'border-primary text-primary' : 'border-transparent text-muted-foreground hover:text-foreground'}`}
              onClick={() => setActiveTab('chat')}
            >
              <MessageSquare className="h-4 w-4" /> 
              Chat
            </button>
            <button 
              className={`flex-1 py-3 flex items-center justify-center gap-2 border-b-2 font-medium text-sm transition-colors cursor-pointer ${activeTab === 'files' ? 'border-primary text-primary' : 'border-transparent text-muted-foreground hover:text-foreground'}`}
              onClick={() => setActiveTab('files')}
            >
              <FileText className="h-4 w-4" /> 
              Files ({documents.length})
            </button>
            
            <button
              className="p-2 mr-2 rounded-md hover:bg-accent text-muted-foreground hover:text-foreground cursor-pointer"
              onClick={togglePdfView}
              aria-label={showPdf ? "Hide PDF" : "Show PDF"}
            >
              {showPdf ? <ChevronRight className="h-4 w-4" /> : <ChevronLeft className="h-4 w-4" />}
            </button>
          </div>
          
          {activeTab === 'chat' ? (
            <div className="flex-1 min-h-0 flex flex-col">
              <div className="flex-1 min-h-0 flex flex-col overflow-auto">
                <ChatMessages
                  messages={messages}
                  chatId={chatId}
                  onNewMessage={refreshMessages}
                  onSourceClick={handleSourceClick}
                  onDocumentsUploaded={refreshDocuments}
                  activeSourceId={activeSourceBadge}
                />
              </div>
            </div>
          ) : (
            <div className="flex-1 p-4 overflow-auto">
              <DocumentsList 
                documents={documents}
                selectedDocId={selectedDocId}
                setSelectedDocId={setSelectedDocId}
                onDocumentDeleted={refreshDocuments}
              />
            </div>
          )}
        </div>
      </div>
    </div>
  );
} 