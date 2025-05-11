"use client";
import React, { useState, useRef, useEffect, useMemo, useCallback } from "react";
import { Document as PdfDocument } from "react-pdf";
// Import our centralized PDF configuration explicitly to ensure it's loaded first
import { pdfConfig } from '@/lib/pdf-config';
import { SourceHighlight } from './types/pdf-types';
import { usePdfDocument } from './hooks/use-pdf-document';
import { usePdfHighlights } from './hooks/use-pdf-highlights';
import { usePdfPageTracking } from './hooks/use-pdf-page-tracking';
import { usePdfZoom } from './hooks/use-pdf-zoom';
import { usePdfRecalculate } from './hooks/use-pdf-recalculate';
import { PdfRenderer } from './components/pdf-renderer';

// Log configuration to confirm it's loaded
console.log('PDF Viewer using worker:', pdfConfig.workerSrc);

function AutoHighlightPdfViewer({
  url,
  highlightSource,
  scale = 1.0,
  onPageChange,
  onDocumentLoad,
  viewMode = 'scroll',
  currentPage,
  scrollToHighlightKey,
}: {
  url: string;
  highlightSource?: SourceHighlight | null;
  scale?: number;
  onPageChange?: (page: number) => void;
  onDocumentLoad?: (numPages: number) => void;
  viewMode?: 'scroll' | 'page';
  currentPage?: number;
  scrollToHighlightKey?: number;
}) {
  // State to control highlight visibility
  const [highlightVisible, setHighlightVisible] = useState<boolean>(true);
  
  // References
  const containerRef = useRef<HTMLDivElement>(null);
  
  // Use extracted hooks
  const {
    numPages,
    isLoading,
    error,
    pdfLoaded,
    loadingTimeout,
    handleDocumentLoadSuccess,
    handleDocumentLoadError,
    urlRef
  } = usePdfDocument({ url, onDocumentLoad });
  
  const {
    pageRefs,
    stableVisiblePageRef,
    singlePageMode,
    setSinglePageMode
  } = usePdfPageTracking({ 
    numPages, 
    pdfLoaded, 
    viewMode, 
    onPageChange, 
    currentPage 
  });
  
  const {
    zoom,
    containerWidth,
  } = usePdfZoom({
    initialScale: scale,
    containerRef
  });

  // Add a ref to store the latest onPageRendered callback for highlights
  const onPageRenderedRef = useRef<(pageNumber: number) => void>();

  // Pass a setter to usePdfHighlights so it can register its callback
  const {
    highlights,
    setOnPageRenderedCallback
  } = usePdfHighlights({
    highlightSource,
    numPages,
    pdfLoaded,
    pageRefs,
    viewMode,
    scrollToHighlightKey,
    setSinglePageMode,
    stableVisiblePageRef,
    onPageChange,
    setOnPageRenderedCallback: (cb) => { onPageRenderedRef.current = cb; }
  });

  // Handler to call when a page is rendered
  const handlePageRendered = useCallback((pageNumber: number) => {
    if (onPageRenderedRef.current) {
      onPageRenderedRef.current(pageNumber);
    }
  }, []);

  // We're using the recalculate hook but don't need to expose its functions
  usePdfRecalculate({
    highlights,
    highlightVisible,
    pageRefs,
    containerRef,
    zoom,
    viewMode,
    singlePageMode
  });

  // Effect to watch for external highlight toggles via DOM attribute
  useEffect(() => {
    const handleAttributeChange = (mutations: MutationRecord[]) => {
      for (const mutation of mutations) {
        if (mutation.type === 'attributes' && 
            mutation.attributeName === 'data-highlight-visible' && 
            containerRef.current) {
          const newValue = containerRef.current.getAttribute('data-highlight-visible') === 'true';
          if (newValue !== highlightVisible) {
            setHighlightVisible(newValue);
          }
        }
      }
    };
    
    // Set up mutation observer to watch for attribute changes
    if (containerRef.current) {
      const observer = new MutationObserver(handleAttributeChange);
      observer.observe(containerRef.current, { attributes: true });
      
      // Set initial attribute
      containerRef.current.setAttribute('data-highlight-visible', highlightVisible.toString());
      
      return () => observer.disconnect();
    }
  }, [highlightVisible]);
  
  // Effect to ensure page changes work properly in page mode
  useEffect(() => {
    if (viewMode === 'page' && currentPage) {
      setSinglePageMode(currentPage);
      stableVisiblePageRef.current = currentPage;
    }
  }, [viewMode, currentPage, setSinglePageMode, stableVisiblePageRef]);

  // Override the default navigation functions to ensure they work with active highlights
  const handleNextPage = useCallback(() => {
    if (viewMode === 'page' && singlePageMode < (numPages || 1)) {
      // Move to the next page
      const newPage = singlePageMode + 1;
      setSinglePageMode(newPage);
      stableVisiblePageRef.current = newPage;
      
      // Notify parent component
      if (onPageChange) {
        onPageChange(newPage);
      }
    }
  }, [viewMode, singlePageMode, numPages, onPageChange, setSinglePageMode, stableVisiblePageRef]);

  const handlePreviousPage = useCallback(() => {
    if (viewMode === 'page' && singlePageMode > 1) {
      // Move to the previous page
      const newPage = singlePageMode - 1;
      setSinglePageMode(newPage);
      stableVisiblePageRef.current = newPage;
      
      // Notify parent component
      if (onPageChange) {
        onPageChange(newPage);
      }
    }
  }, [viewMode, singlePageMode, onPageChange, setSinglePageMode, stableVisiblePageRef]);

  // Add keyboard navigation for single page mode
  useEffect(() => {
    // Define keyboard navigation handler for single page mode
    const handleKeyDown = (e: KeyboardEvent) => {
                  if (viewMode === 'page') {
        if (e.key === 'ArrowRight' || e.key === 'ArrowDown') {
          handleNextPage();
        } else if (e.key === 'ArrowLeft' || e.key === 'ArrowUp') {
          handlePreviousPage();
        }
      }
    };

    // Add keyboard event listener
    window.addEventListener('keydown', handleKeyDown);

    // Clean up
    return () => {
      window.removeEventListener('keydown', handleKeyDown);
    };
  }, [viewMode, handleNextPage, handlePreviousPage]);

  // Handle the keydown event to prevent default behavior that might interfere with scrolling
  useEffect(() => {
    const handleGlobalKeyDown = (e: KeyboardEvent) => {
      // Only modify behavior if we're in the PDF viewer
      if (containerRef.current && containerRef.current.contains(document.activeElement)) {
        // Prevent space and arrow keys from scrolling the page if they're used for navigation
        if (e.key === ' ' || e.key === 'ArrowDown' || e.key === 'ArrowUp') {
          if (viewMode === 'page') {
            e.preventDefault();
          }
        }
      }
    };

    window.addEventListener('keydown', handleGlobalKeyDown);
    return () => {
      window.removeEventListener('keydown', handleGlobalKeyDown);
    };
  }, [viewMode]);

  // Add focus handling to ensure scrolling works
  useEffect(() => {
    // Focus the container when loaded to ensure it can receive scroll events
    if (pdfLoaded && containerRef.current) {
      containerRef.current.focus();
    }
  }, [pdfLoaded]);

  // Handle scroll events for page tracking
  const handleScroll = (e: React.UIEvent<HTMLDivElement>) => {
    if (viewMode !== 'scroll') return;
    
    try {
      // This is a simplified version - main logic moved to hooks
      const container = e.currentTarget;
      
      // Page detection logic is handled in the PdfPageTracking hook
      // This is just a thin wrapper to connect the scroll event
      container.getBoundingClientRect();
    } catch (err) {
      console.error("Error in handleScroll:", err);
    }
  };

  // Memoize the PDF Document component to prevent unnecessary re-renders
  const pdfDocument = useMemo(() => (
    <PdfDocument
      file={url}
      onLoadSuccess={handleDocumentLoadSuccess}
      onLoadError={handleDocumentLoadError}
      loading={<div className="flex items-center justify-center h-full">Loading PDF...</div>}
      error={<div className="flex items-center justify-center h-full text-red-500">Failed to load PDF.</div>}
      externalLinkTarget="_blank"
      options={{
        cMapUrl: 'https://cdn.jsdelivr.net/npm/pdfjs-dist@2.12.313/cmaps/',
        cMapPacked: true,
        disableAutoFetch: false,
        disableStream: false,
        isEvalSupported: true,
        // Add higher quality rendering options
        maxImageSize: 8192 * 8192,
        isOffscreenCanvasSupported: true,
        useSystemFonts: true,
        useWorkerFetch: true,
        fontExtraProperties: true,
        enableXfa: true,
        disableFontFace: false,
        // Force higher quality
        renderInteractiveForms: true,
        renderer: "canvas",
        rangeChunkSize: 65536,
        maxCanvasPixels: 16777216 // 4096 x 4096
      }}
    >
      {/* Changed from div to main element for better semantics and scrolling */}
      <main className="px-4 py-2 pdf-pages-container">
        <PdfRenderer
          numPages={numPages}
          pdfLoaded={pdfLoaded}
          pageRefs={pageRefs}
          viewMode={viewMode}
          singlePageMode={singlePageMode}
          containerWidth={containerWidth}
          highlights={highlights}
          highlightVisible={highlightVisible}
          urlRef={urlRef}
          zoom={zoom}
          handleScroll={handleScroll}
          onPageRendered={handlePageRendered}
        />
      </main>
    </PdfDocument>
  ), [
    url, 
    handleDocumentLoadSuccess, 
    handleDocumentLoadError, 
    numPages, 
    pdfLoaded, 
    pageRefs, 
    viewMode, 
    singlePageMode, 
    containerWidth, 
    highlights, 
    highlightVisible, 
    urlRef, 
    zoom, 
    handleScroll,
    handlePageRendered
  ]);

  if (!url) {
    return <div className="flex items-center justify-center h-full">No document URL provided</div>;
  }

  if (error) {
    return (
      <div className="flex flex-col items-center justify-center h-full text-red-500">
        <p className="mb-4">{error}</p>
        <button 
          onClick={() => window.location.reload()} 
          className="px-4 py-2 bg-card hover:bg-accent rounded-md cursor-pointer"
        >
          Reload page
        </button>
      </div>
    );
  }

  // Show a fallback if loading takes too long
  if (loadingTimeout && isLoading) {
    return (
      <div className="flex flex-col items-center justify-center h-full">
        <p className="mb-4 text-center">PDF is taking a long time to load.</p>
        <p className="mb-4 text-center text-sm text-muted-foreground">
          This could be due to a large file or network issues.
        </p>
        <div className="flex gap-4">
          <button 
            onClick={() => window.location.reload()} 
            className="px-4 py-2 bg-primary text-primary-foreground hover:bg-primary/90 rounded-md cursor-pointer"
          >
            Retry
          </button>
          <a 
            href={url}
            target="_blank"
            rel="noopener noreferrer"
            className="px-4 py-2 bg-card hover:bg-accent rounded-md cursor-pointer"
          >
            Open in new tab
          </a>
        </div>
      </div>
    );
  }

  return (
    <div
      className="flex p-2 w-full h-full bg-background pdf-main-container"
      ref={containerRef}
      tabIndex={0}
      data-highlight-visible={highlightVisible}
      data-can-toggle-highlight="true"
      data-view-mode={viewMode}
      style={viewMode === 'page' ? { justifyContent: 'center', alignItems: 'center', padding: '20px' } : undefined}
      onScroll={e => {
        // Important! Make sure this ALWAYS calls onPageChange when scrolling
        if (viewMode === 'scroll') {
          // Find current most visible page
          let current = 1;
          let minDistance = Infinity;
          
          pageRefs.current.forEach((ref, idx) => {
            if (ref) {
              const rect = ref.getBoundingClientRect();
              const containerRect = containerRef.current?.getBoundingClientRect() || { top: 0, height: 0 };
              const containerCenter = containerRect.top + containerRect.height / 2;
              const pageCenter = rect.top + rect.height / 2;
              const distance = Math.abs(pageCenter - containerCenter);
              
              if (distance < minDistance) {
                minDistance = distance;
                current = idx + 1;
              }
            }
          });
          
          // Update page number
          if (stableVisiblePageRef.current !== current) {
            stableVisiblePageRef.current = current;
            if (onPageChange) {
              onPageChange(current);
            }
          }
        }
        e.stopPropagation();
      }}
    >
      {isLoading && (
        <div className="absolute inset-0 flex items-center justify-center bg-black bg-opacity-50 z-50">
          <div className="animate-spin rounded-full h-12 w-12 border-t-2 border-b-2 border-white"></div>
        </div>
      )}
      {pdfDocument}
    </div>
  );
}

export default AutoHighlightPdfViewer; 