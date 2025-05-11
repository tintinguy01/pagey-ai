"use client";

import React, { useState } from "react";
import { motion } from "framer-motion";
import { FileText, MoreHorizontal, Upload, Trash2 } from "lucide-react";
import { Document, deleteDocument, uploadDocument } from "@/api/client";
import { useToast } from "@/hooks/use-toast";
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";
import {
  AlertDialog,
  AlertDialogAction,
  AlertDialogCancel,
  AlertDialogContent,
  AlertDialogDescription,
  AlertDialogFooter,
  AlertDialogHeader,
  AlertDialogTitle,
} from "@/components/ui/alert-dialog";

interface DocumentsListProps {
  documents: Document[];
  selectedDocId: string | null;
  setSelectedDocId: (id: string) => void;
  onDocumentDeleted?: () => void;
  chatId: number;
  userId: string;
}

export const DocumentsList = ({ 
  documents, 
  selectedDocId, 
  setSelectedDocId,
  onDocumentDeleted,
  chatId,
  userId
}: DocumentsListProps) => {
  const { toast } = useToast();
  const [documentToDelete, setDocumentToDelete] = useState<number | null>(null);
  const fileInputRef = React.useRef<HTMLInputElement>(null);
  const handleFileChange = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;
    try {
      await uploadDocument(file, chatId, userId);
      toast({
        title: "Upload successful",
        description: `Document '${file.name}' uploaded successfully!`,
      });
      if (onDocumentDeleted) onDocumentDeleted(); // reuse to refresh list
    } catch {
      toast({
        title: "Upload failed",
        description: "Failed to upload document. Please try again.",
        variant: "destructive",
      });
    }
  };
  
  // Format file size helper
  const formatFileSize = (bytes: number): string => {
    if (bytes < 1024) return bytes + ' B';
    if (bytes < 1024 * 1024) return (bytes / 1024).toFixed(1) + ' KB';
    return (bytes / (1024 * 1024)).toFixed(1) + ' MB';
  };
  
  // Format date helper
  const formatDate = (dateStr: string): string => {
    const date = new Date(dateStr);
    const now = new Date();
    const diffDays = Math.floor((now.getTime() - date.getTime()) / (1000 * 60 * 60 * 24));
    
    if (diffDays === 0) return 'Today';
    if (diffDays === 1) return 'Yesterday';
    if (diffDays < 7) return `${diffDays} days ago`;
    
    return date.toLocaleDateString();
  };

  // Handle document deletion
  const handleDeleteDocument = async () => {
    if (!documentToDelete) return;
    
    try {
      await deleteDocument(documentToDelete);
      toast({
        title: "Document deleted",
        description: "The document has been removed from this chat.",
      });
      
      // If the deleted document was selected, clear the selection
      if (selectedDocId === documentToDelete.toString()) {
        setSelectedDocId("");
      }
      
      // Refresh the document list
      if (onDocumentDeleted) {
        onDocumentDeleted();
      }
      
      // Reset the document to delete
      setDocumentToDelete(null);
    } catch (error) {
      console.error("Error deleting document:", error);
      toast({
        title: "Error",
        description: "Failed to delete the document. Please try again.",
        variant: "destructive",
      });
    }
  };
  
  if (documents.length === 0) {
    return (
      <div className="flex flex-col items-center justify-center h-full text-center">
        <div className="rounded-full bg-secondary p-6 mb-4">
          <FileText className="h-10 w-10 text-muted-foreground" />
        </div>
        <h3 className="text-xl font-medium mb-2">No files uploaded</h3>
        <p className="text-muted-foreground max-w-md">
          Upload PDF files to get started with your chat session.
        </p>
        <motion.button
          whileHover={{ scale: 1.05 }}
          whileTap={{ scale: 0.95 }}
          className="mt-6 bg-primary text-primary-foreground px-4 py-2 rounded-full font-medium flex items-center gap-2 cursor-pointer"
          onClick={() => fileInputRef.current?.click()}
        >
          <Upload className="h-4 w-4" />
          Upload Document
        </motion.button>
        <input
          type="file"
          accept="application/pdf"
          ref={fileInputRef}
          style={{ display: 'none' }}
          onChange={handleFileChange}
        />
      </div>
    );
  }
  
  return (
    <div className="space-y-4">
      <h3 className="text-lg font-medium">Documents</h3>
      {documents.map((doc) => (
        <motion.div 
          key={doc.id}
          whileHover={{ scale: 1.02 }}
          className={`bg-card border border-border rounded-lg p-4 cursor-pointer flex justify-between items-center ${
            selectedDocId === doc.id.toString() ? 'ring-2 ring-primary' : ''
          }`}
          onClick={(e) => {
            // Only change selection if not clicking on dropdown
            if (!(e.target as HTMLElement).closest('.document-menu')) {
              if (selectedDocId !== doc.id.toString()) {
                setSelectedDocId(doc.id.toString());
                toast({
                  title: "Document changed",
                  description: `Now viewing: ${doc.name}`,
                });
              }
            }
          }}
        >
          <div className="flex items-center gap-3">
            <FileText className="h-10 w-10 text-primary" />
            <div>
              <h4 className="font-medium">{doc.name}</h4>
              <div className="flex items-center text-xs text-muted-foreground mt-1">
                <span>{formatFileSize(doc.size)}</span>
                <span className="mx-2">•</span>
                <span>{doc.pages} {doc.pages === 1 ? 'page' : 'pages'}</span>
                <span className="mx-2">•</span>
                <span>{formatDate(doc.upload_date)}</span>
              </div>
            </div>
          </div>
          <div className="document-menu" onClick={(e) => e.stopPropagation()}>
            <DropdownMenu>
              <DropdownMenuTrigger asChild>
                <button className="p-2 rounded-full hover:bg-accent text-muted-foreground">
                  <MoreHorizontal className="h-5 w-5 cursor-pointer" />
                </button>
              </DropdownMenuTrigger>
              <DropdownMenuContent align="end">
                <DropdownMenuItem 
                  variant="destructive"
                  className="flex items-center gap-2 cursor-pointer"
                  onClick={() => setDocumentToDelete(doc.id)}
                >
                  <Trash2 className="h-4 w-4" />
                  Delete Document
                </DropdownMenuItem>
              </DropdownMenuContent>
            </DropdownMenu>
          </div>
        </motion.div>
      ))}

      {/* Delete Confirmation Dialog */}
      <AlertDialog open={!!documentToDelete} onOpenChange={(open) => !open && setDocumentToDelete(null)}>
        <AlertDialogContent>
          <AlertDialogHeader>
            <AlertDialogTitle>Delete Document?</AlertDialogTitle>
            <AlertDialogDescription>
              This will permanently delete the document from this chat. This action cannot be undone.
            </AlertDialogDescription>
          </AlertDialogHeader>
          <AlertDialogFooter>
            <AlertDialogCancel className="cursor-pointer">Cancel</AlertDialogCancel>
            <AlertDialogAction
              className="bg-destructive text-destructive-foreground cursor-pointer"
              onClick={handleDeleteDocument}
            >
              Delete
            </AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>
    </div>
  );
}; 