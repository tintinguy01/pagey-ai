"use client";

import React, { useState, useCallback } from "react";
import { motion } from "framer-motion";
import { Mascot } from "@/components/mascot";
import { ArrowRight, FileText, Info, Upload, X } from "lucide-react";
import Link from "next/link";
import { useUser } from "@clerk/nextjs";
import { useLoadingNavigation } from "@/hooks/use-loading-navigation";
import { useToast } from "@/hooks/use-toast";
import { createChat, uploadDocument } from "@/api/client";

export default function NewChatPage() {
  const [chatName, setChatName] = useState("");
  const [uploadedFiles, setUploadedFiles] = useState<File[]>([]);
  const [isDragging, setIsDragging] = useState(false);
  const [mascotMood, setMascotMood] = useState<"happy" | "thinking" | "excited">("happy");
  const [isCreating, setIsCreating] = useState(false);
  const [processingStatus, setProcessingStatus] = useState("");
  
  const { user } = useUser();
  const userId = user?.id || "";
  const { navigateWithLoading } = useLoadingNavigation();
  const { toast } = useToast();
  
  const handleDragEnter = useCallback((e: React.DragEvent) => {
    e.preventDefault();
    e.stopPropagation();
    setIsDragging(true);
    setMascotMood("excited");
  }, []);
  
  const handleDragLeave = useCallback((e: React.DragEvent) => {
    e.preventDefault();
    e.stopPropagation();
    setIsDragging(false);
    setMascotMood("happy");
  }, []);
  
  const handleDragOver = useCallback((e: React.DragEvent) => {
    e.preventDefault();
    e.stopPropagation();
  }, []);
  
  const handleDrop = useCallback((e: React.DragEvent) => {
    e.preventDefault();
    e.stopPropagation();
    setIsDragging(false);
    setMascotMood("happy");
    
    if (e.dataTransfer.files && e.dataTransfer.files.length > 0) {
      const newFiles = Array.from(e.dataTransfer.files)
        .filter(file => file.type === "application/pdf");
      
      if (newFiles.length > 0) {
        setUploadedFiles(prev => [...prev, ...newFiles]);
        setMascotMood("excited");
        toast({
          title: "Files added",
          description: `${newFiles.length} PDF${newFiles.length > 1 ? 's' : ''} added successfully.`,
        });
        setTimeout(() => setMascotMood("happy"), 2000);
      } else {
        toast({
          variant: "destructive",
          title: "Error adding files",
          description: "Only PDF files are supported."
        });
      }
    }
  }, [toast]);
  
  const handleFileSelection = (e: React.ChangeEvent<HTMLInputElement>) => {
    if (e.target.files && e.target.files.length > 0) {
      const newFiles = Array.from(e.target.files)
        .filter(file => file.type === "application/pdf");
      
      if (newFiles.length > 0) {
        setUploadedFiles(prev => [...prev, ...newFiles]);
        setMascotMood("excited");
        toast({
          title: "Files added",
          description: `${newFiles.length} PDF${newFiles.length > 1 ? 's' : ''} added successfully.`,
        });
        setTimeout(() => setMascotMood("happy"), 2000);
      } else {
        toast({
          variant: "destructive",
          title: "Error adding files",
          description: "Only PDF files are supported."
        });
      }
    }
  };
  
  const removeFile = (index: number) => {
    const fileName = uploadedFiles[index].name;
    setUploadedFiles(prev => prev.filter((_, i) => i !== index));
    setMascotMood("thinking");
    toast({
      title: "File removed",
      description: `${fileName} was removed from the upload queue.`,
    });
    setTimeout(() => setMascotMood("happy"), 1000);
  };
  
  const formatFileSize = (bytes: number) => {
    if (bytes < 1024) return bytes + ' bytes';
    if (bytes < 1024 * 1024) return (bytes / 1024).toFixed(1) + ' KB';
    return (bytes / (1024 * 1024)).toFixed(1) + ' MB';
  };
  
  const isFormValid = chatName.trim().length > 0 && uploadedFiles.length > 0;
  
  // Function to create a chat and upload PDFs
  const handleCreateChat = async () => {
    if (!isFormValid || !userId || isCreating) return;
    
    try {
      setIsCreating(true);
      setMascotMood("thinking");
      setProcessingStatus("Creating chat...");
      
      // Step 1: Create a chat using the backend API
      const chat = await createChat(chatName.trim(), userId);
      
      toast({
        title: "Chat created",
        description: "Now processing your documents...",
      });
      
      // Step 2: Process and upload each document to the chat
      for (let i = 0; i < uploadedFiles.length; i++) {
        const file = uploadedFiles[i];
        setProcessingStatus(`Processing PDF ${i + 1} of ${uploadedFiles.length}: ${file.name}`);
        
        try {
          toast({
            title: `Uploading ${file.name}`,
            description: `Uploading document ${i + 1} of ${uploadedFiles.length}`,
          });
          
          // Upload document to the backend
          await uploadDocument(file, chat.id, userId);
        } catch (docError) {
          console.error(`Error processing document ${file.name}:`, docError);
          toast({
            variant: "destructive",
            title: "Document Error",
            description: `Failed to process ${file.name}. Continuing with other files.`,
          });
          // Continue with next file even if one fails
        }
      }
      
      setProcessingStatus("Chat created successfully!");
      
      toast({
        title: "Chat ready!",
        description: "Your PDF chat has been created successfully.",
      });
      
      // Navigate to the newly created chat
      navigateWithLoading(`/dashboard/chat/${chat.id}`);
    } catch (error) {
      console.error("Error creating chat:", error);
      setMascotMood("thinking");
      setProcessingStatus("Error creating chat. Please try again.");
      
      toast({
        variant: "destructive",
        title: "Error creating chat",
        description: "There was a problem creating your chat. Please try again.",
      });
    } finally {
      setIsCreating(false);
    }
  };
  
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

  return (
    <div className="container mx-auto p-6 max-w-3xl">
      <motion.div
        variants={container}
        initial="hidden"
        animate="show"
        className="space-y-6"
      >
        <motion.div variants={item} className="flex items-center gap-4 mb-8">
          <Mascot size="md" mood={mascotMood} />
          <div>
            <h1 className="text-3xl font-bold">Create a new chat</h1>
            <p className="text-muted-foreground mt-1">Upload PDFs and start a conversation with them</p>
          </div>
        </motion.div>
        
        <motion.div variants={item} className="space-y-4">
          <label className="font-medium">Chat Name</label>
          <input
            type="text"
            placeholder="E.g., Project Research, Financial Report, etc."
            className="w-full px-4 py-3 bg-secondary rounded-lg border border-border focus:border-primary focus:outline-none"
            value={chatName}
            onChange={e => setChatName(e.target.value)}
            disabled={isCreating}
          />
        </motion.div>
        
        <motion.div 
          variants={item} 
          className={`border-2 border-dashed rounded-lg p-8 text-center transition-colors ${
            isDragging 
              ? 'border-primary bg-primary/5' 
              : 'border-border hover:border-primary/50'
          }`}
          onDragEnter={handleDragEnter}
          onDragLeave={handleDragLeave}
          onDragOver={handleDragOver}
          onDrop={handleDrop}
        >
          <div className="flex flex-col items-center">
            <Upload className="h-12 w-12 text-muted-foreground mb-4" />
            <p className="text-lg font-medium mb-2">Drag and drop your PDFs here</p>
            <p className="text-muted-foreground mb-6">or</p>
            <label className="bg-primary text-primary-foreground px-4 py-2 rounded-full font-medium cursor-pointer hover:bg-primary/90 transition-colors">
              Browse Files
              <input
                type="file"
                accept=".pdf"
                multiple
                className="hidden"
                onChange={handleFileSelection}
                disabled={isCreating}
              />
            </label>
          </div>
        </motion.div>
        
        {uploadedFiles.length > 0 && (
          <motion.div variants={item} className="space-y-4">
            <div className="flex items-center justify-between">
              <h3 className="font-medium">Selected Files ({uploadedFiles.length})</h3>
              <button 
                className="text-sm text-primary hover:underline"
                onClick={() => setUploadedFiles([])}
                disabled={isCreating}
              >
                Clear All
              </button>
            </div>
            <div className="space-y-2 max-h-60 overflow-y-auto pr-2">
              {uploadedFiles.map((file, index) => (
                <div 
                  key={file.name + index} 
                  className="flex items-center justify-between p-3 bg-secondary rounded-lg border border-border"
                >
                  <div className="flex items-center space-x-3">
                    <FileText className="h-5 w-5 text-primary" />
                    <div className="overflow-hidden">
                      <p className="font-medium truncate max-w-[250px]">{file.name}</p>
                      <p className="text-muted-foreground text-xs">{formatFileSize(file.size)}</p>
                    </div>
                  </div>
                  <button 
                    className="p-1 hover:bg-background rounded-full"
                    onClick={() => removeFile(index)}
                    disabled={isCreating}
                  >
                    <X className="h-4 w-4 text-muted-foreground" />
                  </button>
                </div>
              ))}
            </div>
          </motion.div>
        )}
        
        <motion.div variants={item} className="flex flex-col items-center gap-4 pt-4">
          {isCreating && processingStatus && (
            <div className="text-center mb-2 text-muted-foreground text-sm">{processingStatus}</div>
          )}
          <motion.button
            whileHover={isFormValid && !isCreating ? { scale: 1.05 } : undefined}
            whileTap={isFormValid && !isCreating ? { scale: 0.95 } : undefined}
            className={`flex items-center space-x-2 px-6 py-3 rounded-full font-medium transition-colors ${
              isFormValid && !isCreating
                ? 'bg-primary text-primary-foreground cursor-pointer'
                : 'bg-secondary text-muted-foreground cursor-not-allowed'
            }`}
            onClick={handleCreateChat}
            disabled={!isFormValid || isCreating}
          >
            <span>Create Chat</span>
            <ArrowRight className="h-5 w-5" />
          </motion.button>
          
          <Link href="/dashboard" className="text-sm text-muted-foreground hover:text-foreground hover:underline">
            Cancel
          </Link>
        </motion.div>
        
        <motion.div variants={item} className="mt-8 p-4 bg-secondary rounded-lg border border-border">
          <div className="flex gap-2">
            <Info className="h-5 w-5 text-muted-foreground flex-shrink-0 mt-0.5" />
            <div>
              <p className="text-sm text-muted-foreground">
                PDF files will be processed and analyzed to extract their content. You&apos;ll be 
                able to chat with your documents and ask questions about them. The AI will 
                provide responses based on the document content.
              </p>
            </div>
          </div>
        </motion.div>
      </motion.div>
    </div>
  );
} 