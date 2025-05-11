'use client';

import React, { useEffect, useState } from 'react';
import { FileText, ExternalLink, AlertCircle } from 'lucide-react';

interface PDFFallbackProps {
  url: string;
  filename?: string;
}

/**
 * A reliable fallback for viewing PDFs when more advanced viewers fail.
 * Uses browser's native PDF viewing capabilities.
 */
export default function PDFFallback({ url, filename = 'document.pdf' }: PDFFallbackProps) {
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [blobUrl, setBlobUrl] = useState<string | null>(null);

  useEffect(() => {
    if (!url) {
      setError('No URL provided');
      setIsLoading(false);
      return;
    }

    const loadPdf = async () => {
      try {
        setIsLoading(true);
        console.log('PDFFallback: Loading PDF from URL:', url);
        
        // If it's already a blob URL, use it directly
        if (url.startsWith('blob:')) {
          console.log('PDFFallback: URL is already a blob, using directly');
          setBlobUrl(url);
          setIsLoading(false);
          return;
        }
        
        // Fetch the PDF as a blob
        const response = await fetch(url, {
          credentials: 'include',
          mode: 'cors',
          headers: {
            'Accept': 'application/pdf, application/octet-stream'
          },
          cache: 'no-store' // Prevent caching issues
        });
        
        if (!response.ok) {
          throw new Error(`Failed to load PDF: ${response.statusText} (${response.status})`);
        }
        
        const contentType = response.headers.get('content-type');
        console.log('PDFFallback: Response content type:', contentType);
        
        const blob = await response.blob();
        console.log('PDFFallback: Blob size:', blob.size, 'bytes');
        
        if (blob.size === 0) {
          throw new Error('PDF blob is empty');
        }
        
        const objectUrl = URL.createObjectURL(blob);
        console.log('PDFFallback: Created blob URL:', objectUrl.substring(0, 30) + '...');
        setBlobUrl(objectUrl);
        setIsLoading(false);
      } catch (err) {
        console.error('PDFFallback: Error loading PDF:', err);
        setError(`Failed to load PDF: ${err instanceof Error ? err.message : String(err)}`);
        setIsLoading(false);
      }
    };
    
    loadPdf();
    
    // Clean up on unmount
    return () => {
      if (blobUrl && blobUrl.startsWith('blob:') && blobUrl !== url) {
        // Only revoke if we created it (not if we're just passing through a blob URL)
        console.log('PDFFallback: Revoking blob URL');
        URL.revokeObjectURL(blobUrl);
      }
    };
  }, [url, blobUrl]);

  if (isLoading) {
    return (
      <div className="flex items-center justify-center h-full">
        <div className="flex flex-col items-center">
          <div className="h-12 w-12 border-2 border-t-primary border-primary/30 rounded-full animate-spin mb-4"></div>
          <p className="text-sm text-muted-foreground">Loading document...</p>
        </div>
      </div>
    );
  }

  if (error || !blobUrl) {
    return (
      <div className="flex flex-col items-center justify-center h-full px-4">
        <AlertCircle className="h-16 w-16 text-destructive mb-4" />
        <p className="text-destructive text-center mb-4">{error || 'Failed to load document'}</p>
        
        <div className="flex flex-col sm:flex-row space-y-4 sm:space-y-0 sm:space-x-4">
          <a 
            href={url} 
            download={filename}
            className="px-4 py-2 bg-primary text-primary-foreground rounded-md hover:bg-primary/90 text-center"
          >
            Download PDF
          </a>
          
          <a 
            href={url} 
            target="_blank" 
            rel="noopener noreferrer"
            className="flex items-center px-4 py-2 bg-card hover:bg-accent rounded-md justify-center"
          >
            Open in new tab
            <ExternalLink className="ml-2 h-4 w-4" />
          </a>
          
          <button
            onClick={() => window.location.reload()}
            className="px-4 py-2 bg-card hover:bg-accent rounded-md"
          >
            Reload page
          </button>
        </div>
      </div>
    );
  }

  return (
    <div className="w-full h-full relative">
      <object
        data={blobUrl}
        type="application/pdf"
        className="w-full h-full"
        aria-label={filename}
      >
        <div className="flex flex-col items-center justify-center h-full px-4">
          <FileText className="h-16 w-16 text-muted-foreground mb-4" />
          <p className="text-center mb-4">Your browser cannot display this PDF. Please download it instead.</p>
          
          <div className="flex flex-col sm:flex-row space-y-4 sm:space-y-0 sm:space-x-4">
            <a 
              href={blobUrl} 
              download={filename}
              className="px-4 py-2 bg-primary text-primary-foreground rounded-md hover:bg-primary/90 text-center"
            >
              Download PDF
            </a>
            
            <a 
              href={blobUrl} 
              target="_blank" 
              rel="noopener noreferrer"
              className="flex items-center px-4 py-2 bg-card hover:bg-accent rounded-md justify-center"
            >
              Open in new tab
              <ExternalLink className="ml-2 h-4 w-4" />
            </a>
          </div>
        </div>
      </object>
    </div>
  );
}