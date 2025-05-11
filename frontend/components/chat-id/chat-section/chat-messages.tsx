"use client";

import React, { useState, useRef, useEffect } from "react";
import { motion } from "framer-motion";
import { Mascot } from "@/components/mascot";
import { FileText, Send, Upload } from "lucide-react";
import { Message, chatWithAI, uploadDocument } from "@/api/client";
import { useUser } from "@clerk/nextjs";
import ReactMarkdown from "react-markdown";
import remarkGfm from "remark-gfm";
import remarkEmoji from "remark-emoji";
import remarkBreaks from "remark-breaks";
import styles from "./chat-messages.module.css";
import { Separator } from "@/components/ui/separator";
import { useToast } from "@/hooks/use-toast";

interface ChatMessagesProps {
  messages: Message[];
  chatId: number;
  onNewMessage?: () => void;
  onSourceClick?: (source: { file: string; page: number; highlight?: string; line_start?: number; line_end?: number; content?: string }) => void;
  onDocumentsUploaded?: () => void;
  activeSourceId?: string | null;
}

// Add Source type for local type safety
interface Source {
  file: string;
  page: number;
  /**
   * The actual highlighted text from the PDF (can be multiple lines/paragraphs).
   * This should NOT be the PDF name.
   */
  highlight: string;
  line_start?: number;
  line_end?: number;
  content?: string;
  highlights?: string[];
  key_phrases?: string[];  // Added key_phrases for bidirectional highlighting
}

export const ChatMessages = ({ messages, chatId, onNewMessage, onSourceClick, onDocumentsUploaded, activeSourceId }: ChatMessagesProps) => {
  const [message, setMessage] = useState("");
  const [mascotMood, setMascotMood] = useState<"happy" | "thinking" | "excited">("happy");
  const [isLoading, setIsLoading] = useState(false);
  const [thinking, setThinking] = useState(false);
  const { user } = useUser();
  const [hoveredSourceIdx, setHoveredSourceIdx] = useState<number | null>(null);
  const fileInputRef = useRef<HTMLInputElement>(null);
  const [pendingMessages, setPendingMessages] = useState<Message[]>([]);
  const endOfMessagesRef = useRef<HTMLDivElement>(null);
  const textareaRef = useRef<HTMLTextAreaElement>(null);
  const { toast } = useToast();

  const handleSendMessage = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!message.trim() || !chatId || !user?.id) return;
    const userMsg: Message = {
      id: Date.now(),
      chat_id: chatId,
      content: message.trim(),
      role: "user",
      timestamp: new Date().toISOString(),
      sources: [],
    };
    setPendingMessages([userMsg]);
    setMessage("");
    setMascotMood("thinking");
    setIsLoading(true);
    setThinking(true);
    try {
      await chatWithAI(chatId, message.trim());
      if (onNewMessage) onNewMessage();
      setPendingMessages([]);
      if (textareaRef.current) textareaRef.current.style.height = "auto";
    } catch (error) {
      console.error("Error sending message:", error);
      setPendingMessages([]);
    } finally {
      setIsLoading(false);
      setMascotMood("happy");
      setThinking(false);
    }
  };

  const handleUpload = async (e: React.ChangeEvent<HTMLInputElement>) => {
    if (!user?.id || !chatId) return;
    const files = e.target.files;
    if (!files || files.length === 0) return;
    try {
      for (const file of Array.from(files)) {
        await uploadDocument(file, chatId, user.id);
      }
      toast({ title: "Upload successful!", description: "Your PDF(s) have been added to the chat." });
      if (onNewMessage) onNewMessage();
      if (onDocumentsUploaded) onDocumentsUploaded();
    } catch {
      toast({ title: "Upload failed", description: "There was a problem uploading your PDF(s).", variant: "destructive" });
    } finally {
      if (fileInputRef.current) fileInputRef.current.value = "";
    }
  };

  const allMessages = [...messages, ...pendingMessages];
  const sortedMessages = [...allMessages].sort((a, b) => new Date(a.timestamp).getTime() - new Date(b.timestamp).getTime());

  useEffect(() => {
    if (endOfMessagesRef.current) {
      endOfMessagesRef.current.scrollIntoView({ behavior: "smooth" });
    }
  }, [sortedMessages.length, thinking]);

  useEffect(() => {
    if (textareaRef.current) {
      textareaRef.current.style.height = "auto";
      textareaRef.current.style.height = textareaRef.current.scrollHeight + "px";
    }
  }, [message]);

  const generateSourceId = (source: { 
    file: string; 
    page: number; 
    highlight?: string; 
    line_start?: number; 
    line_end?: number; 
    content?: string 
  }) => {
    return `${source.file}-${source.page}-${source.highlight?.substring(0, 20) || ''}`;
  };

  function highlightText(text: string, highlights: string[] | undefined, key_phrases: string[] | undefined): React.ReactNode {
    console.log("Highlighting with phrases:", key_phrases);
    
    // First try using key_phrases for precise highlighting
    if (key_phrases && key_phrases.length > 0) {
      // Sort by length (longest first) to avoid nested highlights
      const sorted = [...key_phrases].sort((a, b) => b.length - a.length);
      let nodes: (string | React.ReactNode)[] = [text];
      
      sorted.forEach((phrase) => {
        if (!phrase || phrase.length < 4) return; // Skip very short phrases
        // Escape regex special characters
        const pattern = phrase.replace(/[.*+?^${}()|[\]\\]/g, '\\$&');
        const regex = new RegExp(`(${pattern})`, 'gi');
        
        nodes = nodes.flatMap((part) => {
          if (typeof part !== 'string') return [part];
          // Split text by regex pattern and wrap matches in highlight span
          const parts = part.split(regex);
          if (parts.length === 1) return [part];
          
          const result: React.ReactNode[] = [];
          for (let i = 0; i < parts.length; i++) {
            const segment = parts[i];
            if (segment === '') continue;
            
            // Every other part is a match
            if (i % 2 === 1) {
              result.push(
                <span 
                  className={styles["markdown-pre-line-highlight"]} 
                  key={`highlight-${i}-${segment.substring(0, 10)}`}
                >
                  {segment}
                </span>
              );
            } else {
              result.push(segment);
            }
          }
          return result;
        });
      });
      
      return <>{nodes}</>;
    }
    
    // Fall back to original highlight method if no key_phrases
    if (!highlights || highlights.length === 0) return text;
    
    // Sort highlights by length descending to avoid nested matches
    const sorted = [...highlights].filter(h => h && h.length > 10).sort((a, b) => b.length - a.length);
    let nodes: (string | React.ReactNode)[] = [text];
    
    sorted.forEach((highlight) => {
      // Escape regex special characters
      const pattern = highlight.replace(/[.*+?^${}()|[\]\\]/g, '\\$&');
      const regex = new RegExp(`(${pattern})`, 'gi');
      
      nodes = nodes.flatMap((part) => {
        if (typeof part !== 'string') return [part];
        // Split text by regex pattern and wrap matches in highlight span
        const parts = part.split(regex);
        if (parts.length === 1) return [part];
        
        const result: React.ReactNode[] = [];
        for (let i = 0; i < parts.length; i++) {
          const segment = parts[i];
          if (segment === '') continue;
          
          // Every other part is a match
          if (i % 2 === 1) {
            result.push(
              <span 
                className={styles["markdown-pre-line-highlight"]} 
                key={`highlight-${i}-${segment.substring(0, 10)}`}
              >
                {segment}
              </span>
            );
          } else {
            result.push(segment);
          }
        }
        return result;
      });
    });
    
    return <>{nodes}</>;
  }

  return (
    <>
      <div className="flex-1 overflow-auto p-4 space-y-4">
        {sortedMessages.length === 0 ? (
          <div className="flex flex-col items-center justify-center h-full text-center gap-4">
            <Mascot size="md" mood="happy" />
            <span className="text-muted-foreground">No messages yet. Start the conversation!</span>
          </div>
        ) : (
          <>
            {sortedMessages.map((msg, idx) => {
              const key = msg.id + '-' + idx;
              if (msg.role === 'user') {
                return (
                  <div key={key} className="flex w-full justify-end mb-2">
                    <motion.div
                      initial={{ opacity: 0, y: 10 }}
                      animate={{ opacity: 1, y: 0 }}
                      transition={{ duration: 0.2 }}
                      className="relative bg-primary text-primary-foreground rounded-2xl p-4 shadow-lg hover:shadow-xl transition-shadow max-w-[60%] flex flex-col"
                    >
                      <span className="absolute -right-3 top-6 w-0 h-0 border-t-8 border-t-transparent border-b-8 border-b-transparent border-l-8 border-l-primary" />
                      <div className="whitespace-pre-line text-base leading-relaxed pb-5">{msg.content}</div>
                      <div className="absolute bottom-2 right-4 text-xs text-primary-foreground/70">
                        {new Date(msg.timestamp).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}
                      </div>
                    </motion.div>
                  </div>
                );
              } else if (msg.role === 'assistant') {
                return (
                  <div key={key} className="flex w-[80%] justify-start mb-2 gap-2">
                    <Mascot size="sm" mood={mascotMood} className="mt-2 flex-shrink-0" />
                    <div className="flex flex-col">
                      <span className="text-xs font-semibold text-muted-foreground mb-1 ml-1">Pagey AI</span>
                      <motion.div
                        initial={{ opacity: 0, y: 10 }}
                        animate={{ opacity: 1, y: 0 }}
                        transition={{ duration: 0.2 }}
                        className="relative bg-secondary/80 rounded-2xl p-4 shadow-lg border border-border/70 hover:shadow-xl transition-shadow max-w-[70vw]"
                      >
                        <span className="absolute -left-3 top-6 w-0 h-0 border-t-8 border-t-transparent border-b-8 border-b-transparent border-r-8 border-r-secondary/80" />
                        <div className="bg-secondary/60 rounded-xl px-6 py-4 shadow-sm">
                          <div className={styles["markdown-pre-line"] + " text-foreground dark:text-white"}>
                            <ReactMarkdown
                              remarkPlugins={[remarkGfm, remarkEmoji, remarkBreaks]}
                              components={{
                                hr: () => <Separator className="my-4" />,
                                h2: (props) => (
                                  <>
                                    <h2 {...props} />
                                    <Separator className="my-2" />
                                  </>
                                ),
                                h3: (props) => (
                                  <>
                                    <h3 {...props} />
                                    <Separator className="my-2" />
                                  </>
                                ),
                                p: ({ children }) => {
                                  if (msg.sources && activeSourceId) {
                                    const found = msg.sources.find((source) => generateSourceId(source) === activeSourceId);
                                    const activeSource = found as Source | undefined;
                                    console.log("Active source:", activeSource);
                                    const highlights = activeSource?.highlights;
                                    const key_phrases = activeSource?.key_phrases;
                                    console.log("Highlights:", highlights);
                                    console.log("Key phrases:", key_phrases);
                                    if (Array.isArray(highlights) && highlights.length > 0) {
                                      let text = '';
                                      if (Array.isArray(children)) text = children.join('');
                                      else if (children !== undefined && children !== null) text = String(children);
                                      return <p>{highlightText(text, highlights, key_phrases)}</p>;
                                    }
                                  }
                                  return <p>{children}</p>;
                                },
                                li: ({ children }) => {
                                  if (msg.sources && activeSourceId) {
                                    const found = msg.sources.find((source) => generateSourceId(source) === activeSourceId);
                                    const activeSource = found as Source | undefined;
                                    console.log("Active source:", activeSource);
                                    const highlights = activeSource?.highlights;
                                    const key_phrases = activeSource?.key_phrases;
                                    console.log("Highlights:", highlights);
                                    console.log("Key phrases:", key_phrases);
                                    if (Array.isArray(highlights) && highlights.length > 0) {
                                      let text = '';
                                      if (Array.isArray(children)) text = children.join('');
                                      else if (children !== undefined && children !== null) text = String(children);
                                      return <li>{highlightText(text, highlights, key_phrases)}</li>;
                                    }
                                  }
                                  return <li>{children}</li>;
                                },
                                span: ({ children }) => {
                                  if (msg.sources && activeSourceId) {
                                    const found = msg.sources.find((source) => generateSourceId(source) === activeSourceId);
                                    const activeSource = found as Source | undefined;
                                    console.log("Active source:", activeSource);
                                    const highlights = activeSource?.highlights;
                                    const key_phrases = activeSource?.key_phrases;
                                    console.log("Highlights:", highlights);
                                    console.log("Key phrases:", key_phrases);
                                    if (Array.isArray(highlights) && highlights.length > 0) {
                                      let text = '';
                                      if (Array.isArray(children)) text = children.join('');
                                      else if (children !== undefined && children !== null) text = String(children);
                                      return <span>{highlightText(text, highlights, key_phrases)}</span>;
                                    }
                                  }
                                  return <span>{children}</span>;
                                },
                              }}
                            >
                              {msg.content}
                            </ReactMarkdown>
                          </div>
                        </div>
                        <div className="text-xs text-muted-foreground text-right mt-2">
                          {new Date(msg.timestamp).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}
                        </div>
                        {msg.sources && msg.sources.length > 0 && (
                          <motion.div initial={{ opacity: 0, y: 10 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: 0.05, duration: 0.2 }} className="mt-2">
                            <div className="flex items-center gap-2 mb-2">
                              <span className="text-xs font-semibold text-muted-foreground tracking-wide uppercase">📄 Sources</span>
                              <div className="flex-1 border-t border-border" />
                            </div>
                            <div className="flex flex-wrap gap-2">
                              {msg.sources.map((source, i) => (
                                <motion.button
                                  key={`badge-${msg.id}-${i}`}
                                  type="button"
                                  whileHover={{ scale: 1.08 }}
                                  whileTap={{ scale: 0.97 }}
                                  className={`px-3 py-1 rounded-full border shadow-sm transition-all duration-200 text-xs font-medium flex items-center gap-1 cursor-pointer ${
                                    activeSourceId === generateSourceId(source)
                                      ? 'bg-primary/90 text-primary-foreground ring-2 ring-primary/60 border-primary'
                                      : 'bg-accent text-accent-foreground border-border hover:bg-primary/90 hover:text-primary-foreground'
                                  } ${hoveredSourceIdx === i ? 'ring-2 ring-primary/40' : ''}`}
                                  title={`${source.file} (Page ${source.page})`}
                                  onClick={() => {
                                    console.log("Source clicked:", {
                                      file: source.file,
                                      page: source.page,
                                      highlight: source.highlight?.substring(0, 50) + "...",
                                      key_phrases: source.key_phrases
                                    });
                                    onSourceClick && onSourceClick({
                                      file: source.file,
                                      page: source.page,
                                      highlight: source.highlight,
                                      line_start: source.line_start,
                                      line_end: source.line_end,
                                      content: source.content,
                                    });
                                  }}
                                  onMouseEnter={() => setHoveredSourceIdx(i)}
                                  onMouseLeave={() => setHoveredSourceIdx(null)}
                                  animate={activeSourceId === generateSourceId(source) ? { y: [0, -2, 0] } : {}}
                                  transition={{ duration: 0.3 }}
                                >
                                  <FileText className={`h-3 w-3 mr-1 ${activeSourceId === generateSourceId(source) ? 'opacity-100' : 'opacity-70'}`} />
                                  <span className="truncate max-w-[120px]">{source.file.replace(/\.[^/.]+$/, "")} (p.{source.page})</span>
                                </motion.button>
                              ))}
                            </div>
                          </motion.div>
                        )}
                      </motion.div>
                    </div>
                  </div>
                );
              }
              return null;
            })}
            <div ref={endOfMessagesRef} />
          </>
        )}
        {thinking && (
          <motion.div initial={{ opacity: 0, y: 10 }} animate={{ opacity: 1, y: 0 }} className="flex justify-start">
            <div className="max-w-[85%] rounded-lg p-3 bg-secondary flex items-start gap-2">
              <Mascot size="sm" mood="thinking" className="mr-2 flex-shrink-0 animate-bounce" />
              <div className="flex-1">
                <div className="flex items-center mb-2">
                  <span className="font-medium">Pagey AI</span>
                  <span className="text-xs text-muted-foreground ml-auto">...</span>
                </div>
                <div className="italic text-muted-foreground">Pagey is thinking...</div>
              </div>
            </div>
          </motion.div>
        )}
      </div>
      <form onSubmit={handleSendMessage} className="border-t border-border p-4 bg-background">
        <div className="flex-1 relative">
          <textarea
            ref={textareaRef}
            placeholder="Ask Pagey anything about your PDF..."
            className="w-full rounded-lg border border-border bg-secondary px-4 py-3 pr-4 pb-16 text-base focus:outline-none focus:ring-2 focus:ring-primary resize-none max-h-40 min-h-[40px] shadow-sm transition scrollbar-hide"
            value={message}
            onChange={(e) => setMessage(e.target.value)}
            disabled={isLoading}
            rows={1}
            spellCheck={true}
            autoFocus
            style={{ overflow: 'hidden' }}
          />
          <div className="absolute bottom-4 right-4 flex gap-2">
          <input
            type="file"
            accept="application/pdf"
            multiple
            ref={fileInputRef}
            style={{ display: "none" }}
              onChange={handleUpload}
          />
          <button
            type="button"
              className="w-10 h-10 flex items-center justify-center rounded-full border border-border bg-accent text-accent-foreground hover:bg-primary/90 hover:text-primary-foreground transition cursor-pointer"
              disabled={isLoading}
            onClick={() => fileInputRef.current?.click()}
            title="Upload PDF(s) to this chat"
              style={{ zIndex: 2 }}
          >
            <Upload className="h-5 w-5" />
          </button>
        <motion.button
          type="submit"
          whileHover={{ scale: 1.05 }}
          whileTap={{ scale: 0.95 }}
              className={`w-10 h-10 flex items-center justify-center rounded-full border border-border transition cursor-pointer ${
            message.trim() && !isLoading
              ? 'bg-primary text-primary-foreground' 
                  : 'bg-background text-muted-foreground'
          }`}
          disabled={!message.trim() || isLoading}
              style={{ zIndex: 2 }}
        >
              {message.trim() && !isLoading ? (
          <Send className="h-5 w-5" />
              ) : (
                <svg className="h-5 w-5" fill="none" stroke="currentColor" strokeWidth={2} viewBox="0 0 24 24">
                  <circle cx="12" cy="12" r="10" />
                  <path d="M8 15s1.5 2 4 2 4-2 4-2" />
                  <path d="M9 9h.01" />
                  <path d="M15 9h.01" />
                </svg>
              )}
        </motion.button>
          </div>
        </div>
      </form>
    </>
  );
};