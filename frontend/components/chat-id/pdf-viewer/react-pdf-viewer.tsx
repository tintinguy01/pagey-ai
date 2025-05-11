'use client';

import React, { useState, useEffect, useRef, useMemo, useCallback } from 'react';
import { Document } from '@/api/client';
import { useToast } from '@/hooks/use-toast';
import { config } from '@/config';
import dynamic from "next/dynamic";
// Import the PDF configuration
import '@/lib/pdf-config';
import { 
  ZoomIn, 
  ZoomOut, 
  Maximize, 
  ChevronLeft,
  ChevronRight,
  RefreshCw,
  ScrollText,
  FileDown,
} from 'lucide-react';
import { Button } from "@/components/ui/button";
import { 
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { cn } from "@/lib/utils";
import AutoHighlightPdfViewer from './auto-highlight-pdf-viewer';

const API_BASE_URL = config.api.baseUrl;

// Import the fallback PDF viewer for cases where the main viewer fails
const PDFFallback = dynamic(() => import("./pdf-fallback"), {
  ssr: false,
  loading: () => (
    <div className="flex items-center justify-center h-full">
      <div className="h-8 w-8 border-2 border-t-primary border-primary/30 rounded-full animate-spin"></div>
    </div>
  )
});

interface ReactPDFViewerProps {
  documents: Document[];
  selectedDocId: string | null;
  setSelectedDocId: (id: string) => void;
  onHighlightSource?: { file: string; page: number; highlight?: string; line_start?: number; line_end?: number; content?: string } | null;
  scrollToHighlightKey: number;
}

export const ReactPDFViewer = ({ documents, selectedDocId, setSelectedDocId, onHighlightSource, scrollToHighlightKey }: ReactPDFViewerProps) => {
  const { toast } = useToast();
  const [pdfSource, setPdfSource] = useState<string>("");
  const [scale, setScale] = useState<number>(1.0);
  const [currentPage, setCurrentPage] = useState<number>(1);
  const [totalPages, setTotalPages] = useState<number>(1);
  const [showPageIndicator, setShowPageIndicator] = useState<boolean>(false);
  const pageIndicatorTimeoutRef = useRef<NodeJS.Timeout | null>(null);
  const isDocumentChanged = useRef<boolean>(false);
  const [viewerFailed, setViewerFailed] = useState(false);
  // Add view mode state - scrolling (default) or page mode
  const [viewMode, setViewMode] = useState<'scroll' | 'page'>('scroll');
  // Add state for fit-to-width mode
  const [fitToWidth, setFitToWidth] = useState<boolean>(false);
  // Add reference to store the actual current page to prevent flicker
  const lastStablePageRef = useRef<number>(1);
  const pageChangeTimeoutRef = useRef<NodeJS.Timeout | null>(null);
  
  // Reference to the PDF viewer component API
  const pdfViewerRef = useRef<HTMLDivElement>(null);
  
  const selectedDocument = documents.find((doc) => doc.id.toString() === selectedDocId) || documents[0];
  
  // Reset zoom when document changes
  useEffect(() => {
    setScale(1.0);
    setCurrentPage(1);
    lastStablePageRef.current = 1;
    isDocumentChanged.current = true;
    setViewerFailed(false); // Reset failure state when document changes
  }, [selectedDocId]);
  
  // Hide page indicator after delay
  useEffect(() => {
    if (showPageIndicator) {
      if (pageIndicatorTimeoutRef.current) {
        clearTimeout(pageIndicatorTimeoutRef.current);
      }
      
      pageIndicatorTimeoutRef.current = setTimeout(() => {
        setShowPageIndicator(false);
      }, 3000);
    }
    
    return () => {
      if (pageIndicatorTimeoutRef.current) {
        clearTimeout(pageIndicatorTimeoutRef.current);
      }
    };
  }, [showPageIndicator, currentPage]);
  
  // Load PDF document
  useEffect(() => {
    // For testing purposes - use a sample PDF if the API endpoint is not available
    const testPdf = "/sample.pdf";
    
    const loadPdf = async () => {
      if (!selectedDocument) {
        console.log("No document selected, using sample PDF");
        setPdfSource(testPdf);
        return;
      }

      try {
        const apiUrl = `${process.env.NEXT_PUBLIC_API_BASE_URL || API_BASE_URL}/api/documents/content/${selectedDocument.id}`;
        console.log("Fetching PDF from:", apiUrl);
        
        const response = await fetch(apiUrl, {
          credentials: 'include',
          headers: {
            'Accept': 'application/pdf',
          },
          // Add cache control and error handling
          cache: 'no-store',
          redirect: 'follow'
        });
        
        if (response.ok) {
          const contentType = response.headers.get('content-type');
          console.log("Response content type:", contentType);
          
          if (!contentType || !contentType.includes('application/pdf')) {
            console.warn("Warning: Response is not a PDF, content type:", contentType);
          }
          
          const blob = await response.blob();
          console.log("PDF blob size:", blob.size, "bytes");
          
          if (blob.size === 0) {
            console.error("PDF blob is empty");
            throw new Error("PDF blob is empty");
          }
          
          // Revoke any existing blob URL to prevent memory leaks
          if (pdfSource && pdfSource.startsWith('blob:')) {
            console.log("Revoking previous blob URL:", pdfSource);
            URL.revokeObjectURL(pdfSource);
          }
          
          const blobUrl = URL.createObjectURL(blob);
          console.log("Created blob URL:", blobUrl);
          setPdfSource(blobUrl);
        } else {
          console.warn("Could not load PDF from API:", response.status, response.statusText);
          console.log("Response headers:", Object.fromEntries([...response.headers.entries()]));
          console.log("Using fallback sample PDF");
          setPdfSource(testPdf);
          
          toast({
            title: "Could not load document",
            description: `Error: ${response.status} ${response.statusText}. Using sample document.`
          });
        }
      } catch (error) {
        console.error("Error loading PDF:", error);
        setPdfSource(testPdf);
        toast({
          title: "Could not load document",
          description: "Using sample document for demonstration"
        });
      }
    };
    
    loadPdf();
    
    return () => {
      // Clean up blob URL when component unmounts
      if (pdfSource && pdfSource.startsWith('blob:')) {
        URL.revokeObjectURL(pdfSource);
      }
    };
  }, [selectedDocument, toast]);

  // Format file size helper
  const formatFileSize = (bytes: number): string => {
    if (bytes < 1024) return bytes + ' B';
    if (bytes < 1024 * 1024) return (bytes / 1024).toFixed(1) + ' KB';
    return (bytes / (1024 * 1024)).toFixed(1) + ' MB';
  };

  // Memoize zoom controls to prevent unnecessary re-renders
  const handleZoomIn = useMemo(() => () => {
    setScale(prev => {
      const newScale = Math.min(prev + 0.1, 3.0);
      // Only show indicator if scale actually changed
      if (newScale !== prev) {
        setShowPageIndicator(true);
      }
      return newScale;
    });
  }, []);
  
  const handleZoomOut = useMemo(() => () => {
    setScale(prev => {
      const newScale = Math.max(prev - 0.1, 0.5);
      // Only show indicator if scale actually changed
      if (newScale !== prev) {
        setShowPageIndicator(true);
      }
      return newScale;
    });
  }, []);
  
  const handleResetZoom = useMemo(() => () => {
    setScale(1.0);
    setShowPageIndicator(true);
  }, []);
  
  const handleDocumentChange = (docId: string) => {
    setSelectedDocId(docId);
    setCurrentPage(1);
    lastStablePageRef.current = 1;
  };
  
  // Handle page change with a direct update to ensure the page indicator shows the correct page
  const handlePageChange = useCallback((page: number) => {
    console.log("handlePageChange called with page:", page);
    
    // Clear any pending timeout
    if (pageChangeTimeoutRef.current) {
      clearTimeout(pageChangeTimeoutRef.current);
    }
    
    // Update immediately
    lastStablePageRef.current = page;
    setCurrentPage(page);
    setShowPageIndicator(true);
    
    // Set timeout to hide indicator
    pageIndicatorTimeoutRef.current = setTimeout(() => {
      setShowPageIndicator(false);
    }, 2000);
  }, []);
  
  const handleDocumentLoad = (numPages: number) => {
    console.log("PDF document loaded with", numPages, "pages");
    setTotalPages(numPages);
    // Only show indicator when document is loaded for the first time
    if (isDocumentChanged.current) {
      setShowPageIndicator(true);
      isDocumentChanged.current = false;
    }
    
    // Initialize page detection after a delay to ensure DOM is ready
    if (viewMode === 'scroll') {
      setTimeout(() => {
        console.log("Initializing page detection after document load");
        detectCurrentPage();
        // Run detection again after a longer delay to ensure all pages are rendered
        setTimeout(detectCurrentPage, 1000);
      }, 200);
    }
  };
  
  const handleViewerError = () => {
    console.error("PDF viewer failed to load");
    setViewerFailed(true);
    toast({
      title: "PDF Viewer Error",
      description: "Advanced viewer couldn't load. Switched to compatibility mode.",
      variant: "destructive"
    });
  };
  
  const retryMainViewer = () => {
    setViewerFailed(false);
    toast({
      title: "PDF Viewer",
      description: "Switching back to advanced PDF viewer",
    });
  };

  // Toggle between scroll and page view modes
  const toggleViewMode = useCallback(() => {
    // Don't call toast inside the state updater function
    const nextMode = viewMode === 'scroll' ? 'page' : 'scroll';
    
    // First update the state
    setViewMode(nextMode);
    
    // Then show the toast (outside the state updater)
    toast({
      title: `View Mode: ${nextMode === 'scroll' ? 'Scrolling' : 'Page'}`,
      description: nextMode === 'scroll' 
        ? 'Continuous scrolling enabled' 
        : 'Single page mode enabled',
      duration: 2000,
    });
  }, [toast, viewMode]);

  // Add a toggle for fit-to-width mode
  const toggleFitToWidth = useCallback(() => {
    const newValue = !fitToWidth;
    setFitToWidth(newValue);
    
    // Reset scale to 1.0 when disabling fit-to-width
    if (!newValue) {
      setScale(1.0);
    }
    
    // Show toast after state update, not inside the updater function
    toast({
      title: `Fit to Width: ${newValue ? 'On' : 'Off'}`,
      description: newValue 
        ? 'PDF will scale to fit window width' 
        : 'Using custom zoom level',
      duration: 2000,
    });
  }, [toast, fitToWidth]);

  // Add explicit page navigation functions
  const goToNextPage = useCallback(() => {
    if (lastStablePageRef.current < totalPages) {
      const newPage = lastStablePageRef.current + 1;
      lastStablePageRef.current = newPage;
      setCurrentPage(newPage);
      setShowPageIndicator(true);
      // Also notify PDF viewer to actually change the page
      if (handlePageChange) {
        handlePageChange(newPage);
      }
    }
  }, [totalPages, handlePageChange]);
  
  const goToPreviousPage = useCallback(() => {
    if (lastStablePageRef.current > 1) {
      const newPage = lastStablePageRef.current - 1;
      lastStablePageRef.current = newPage;
      setCurrentPage(newPage);
      setShowPageIndicator(true);
      // Also notify PDF viewer to actually change the page
      if (handlePageChange) {
        handlePageChange(newPage);
      }
    }
  }, [handlePageChange]);

  // Add a scroll zoom handler
  const handleWheelZoom = useCallback((e: React.WheelEvent<HTMLDivElement>) => {
    // Only handle zooming if Ctrl key is pressed
    if (e.ctrlKey) {
      e.preventDefault(); // Only prevent default when zooming

      // Determine zoom direction
      if (e.deltaY < 0) {
        // Zoom in (scroll up)
        setScale(prev => {
          const newScale = Math.min(prev + 0.1, 3.0);
          if (newScale !== prev) {
            setShowPageIndicator(true);
          }
          return newScale;
        });
      } else {
        // Zoom out (scroll down)
        setScale(prev => {
          const newScale = Math.max(prev - 0.1, 0.5);
          if (newScale !== prev) {
            setShowPageIndicator(true);
          }
          return newScale;
        });
      }
    }
    // Let normal scroll behavior happen when Ctrl is not pressed
  }, []);

  // Add effect to handle fit-to-width mode
  useEffect(() => {
    // Set data-fit-to-width attribute on the pdf container when fitToWidth changes
    if (pdfViewerRef.current) {
      pdfViewerRef.current.setAttribute('data-fit-to-width', fitToWidth.toString());
    }
  }, [fitToWidth]);

  // Custom function to directly detect the current page
  const detectCurrentPage = useCallback(() => {
    try {
      // Find the PDF container
      const container = document.getElementById('pdf-viewer-scroll-container');
      if (!container) {
        return false;
      }

      // Find all page containers with extra selectors for better detection
      const pageElements = Array.from(document.querySelectorAll('.pdf-page-container, .react-pdf__Page, .react-pdf__Page__textContent'))
        .filter(el => {
          // Check if it's a valid page element
          return el.classList.contains('pdf-page-container') || 
                 el.closest('.pdf-page-container') !== null ||
                 el.classList.contains('react-pdf__Page') || 
                 el.closest('.react-pdf__Page') !== null;
        });
      
      if (!pageElements.length) {
        return false;
      }
      
      // Get container dimensions
      const containerRect = container.getBoundingClientRect();
      
      // Track which page is most visible
      let mostVisiblePage = 1;
      let highestVisibility = 0;
      
      // Calculate visibility for each page
      pageElements.forEach((pageEl) => {
        // Get the page number from data attribute or infer from position
        let pageNumber = Number(pageEl.getAttribute('data-page-number') || '0');
        
        // If no data-page-number, try to determine from DOM structure
        if (!pageNumber) {
          // Try to find the page index from parent
          const pageContainer = pageEl.closest('.pdf-page-container');
          if (pageContainer) {
            // Get all siblings that are page containers
            const parent = pageContainer.parentElement;
            if (parent) {
              const siblings = Array.from(parent.querySelectorAll('.pdf-page-container'));
              pageNumber = siblings.indexOf(pageContainer) + 1;
            }
          } else if (pageEl.classList.contains('react-pdf__Page')) {
            // Direct page element - try to get the page number from props
            const pageProps = pageEl.getAttribute('data-page-number');
            if (pageProps) {
              pageNumber = Number(pageProps);
            }
          }
        }
        
        // If we still can't determine the page number, skip
        if (!pageNumber) return;
        
        const pageRect = pageEl.getBoundingClientRect();
        
        // If page is not in view at all, skip it
        if (pageRect.bottom < containerRect.top || pageRect.top > containerRect.bottom) {
          return;
        }
        
        // Calculate visible area
        const visibleTop = Math.max(pageRect.top, containerRect.top);
        const visibleBottom = Math.min(pageRect.bottom, containerRect.bottom);
        const visibleHeight = visibleBottom - visibleTop;
        const visibilityRatio = visibleHeight / pageRect.height;
        
        // Check if this page is more visible than previous
        if (visibilityRatio > highestVisibility) {
          highestVisibility = visibilityRatio;
          mostVisiblePage = pageNumber;
        }
      });
      
      if (highestVisibility > 0) {
        // Immediately update the current page if significantly different from current
        // This makes detection faster when scrolling multiple pages
        if (mostVisiblePage !== lastStablePageRef.current && 
            Math.abs(mostVisiblePage - lastStablePageRef.current) > 0) {
          lastStablePageRef.current = mostVisiblePage;
          setCurrentPage(mostVisiblePage);
          setShowPageIndicator(true);
          
          // Reset timeout for hiding indicator
          if (pageIndicatorTimeoutRef.current) {
            clearTimeout(pageIndicatorTimeoutRef.current);
          }
          
          pageIndicatorTimeoutRef.current = setTimeout(() => {
            setShowPageIndicator(false);
          }, 2000);
        }
        
        return true; // Successfully detected page
      } else {
        return false;
      }
    } catch (err) {
      console.error("Error detecting current page:", err);
      return false;
    }
  }, []);

  // Add continuous monitoring for page changes in scroll mode
  useEffect(() => {
    if (viewMode !== 'scroll' || !pdfSource) return;
    
    // Track scroll position to detect when user has stopped scrolling
    let lastScrollTop = 0;
    let scrollStabilityCounter = 0;
    let lastScrollTime = Date.now();
    
    // Periodically check if we need to update page detection
    const intervalId = setInterval(() => {
      const container = document.getElementById('pdf-viewer-scroll-container');
      if (!container) return;
      
      const currentScrollTop = container.scrollTop;
      const now = Date.now();
      const timeSinceLastScroll = now - lastScrollTime;
      
      // If scroll position hasn't changed, increment counter
      if (Math.abs(currentScrollTop - lastScrollTop) < 2) {
        scrollStabilityCounter++;
        
        // If it's been stable for a while or it's been more than 100ms since last scroll
        if (scrollStabilityCounter >= 2 || timeSinceLastScroll > 100) {
          detectCurrentPage();
          scrollStabilityCounter = 0; // Reset after checking
        }
      } else {
        // Still scrolling - update stability tracker
        scrollStabilityCounter = 0;
        lastScrollTop = currentScrollTop;
        lastScrollTime = now;
        
        // Try to detect the page even while scrolling for faster feedback
        if (timeSinceLastScroll > 60) { // Only if not scrolling too rapidly
          detectCurrentPage();
        }
      }
    }, 100); // Run more frequently (was 500ms)
    
    return () => {
      clearInterval(intervalId);
    };
  }, [viewMode, pdfSource, detectCurrentPage]);
  
  // Watch for DOM changes to detect when PDF pages are actually rendered
  useEffect(() => {
    if (!pdfViewerRef.current || viewMode !== 'scroll') return;
    
    // Optimization: Use throttled scroll event for smoother performance
    let lastScrollTime = 0;
    const scrollThrottleMs = 50; // ms between scroll detections
    
    // Listen for all scroll events on the container
    const handleExtraScroll = () => {
      const now = Date.now();
      if (now - lastScrollTime >= scrollThrottleMs) {
        lastScrollTime = now;
        requestAnimationFrame(() => {
          detectCurrentPage();
        });
      }
    };
    
    const scrollContainer = document.getElementById('pdf-viewer-scroll-container');
    if (scrollContainer) {
      scrollContainer.addEventListener('scroll', handleExtraScroll, { passive: true });
    }
    
    window.addEventListener('resize', handleExtraScroll);
    
    return () => {
      if (scrollContainer) {
        scrollContainer.removeEventListener('scroll', handleExtraScroll);
      }
      window.removeEventListener('resize', handleExtraScroll);
    };
  }, [viewMode, detectCurrentPage, pdfViewerRef]);

  // Memoize the PDF viewer to prevent unnecessary re-renders
  const pdfViewer = useMemo(() => {
    if (!pdfSource) return null;
    
    // Use fallback viewer if the main one failed
    if (viewerFailed) {
      console.log("Using PDF fallback viewer due to failure");
      return (
        <PDFFallback 
          url={pdfSource}
          filename={selectedDocument?.name || "document.pdf"}
        />
      );
    }
    
    // Use AutoHighlightPdfViewer for robust PDF.js-based rendering and highlighting
    return (
      <div ref={pdfViewerRef} data-fit-to-width={fitToWidth.toString()}>
        <AutoHighlightPdfViewer
          url={pdfSource}
          highlightSource={
            onHighlightSource
    ? {
        page: onHighlightSource.page,
                  text: onHighlightSource.highlight || onHighlightSource.content || "",
                  color: "rgba(59, 130, 246, 0.3)" // Theme blue color with transparency (changed from purple)
                }
              : undefined
          }
          scale={scale}
          onPageChange={handlePageChange}
          onDocumentLoad={handleDocumentLoad}
          viewMode={viewMode}
          currentPage={currentPage}
          scrollToHighlightKey={scrollToHighlightKey}
        />
      </div>
    );
  }, [
    pdfSource, 
    selectedDocId, 
    onHighlightSource?.page, 
    onHighlightSource?.highlight, 
    onHighlightSource?.content, 
    scale, 
    viewerFailed, 
    selectedDocument?.name, 
    handleDocumentLoad, 
    handlePageChange,
    viewMode,
    currentPage,
    fitToWidth,
    scrollToHighlightKey
  ]);

  if (!pdfSource) {
    return (
      <div className="flex flex-col w-full h-full">
        <div className="flex items-center justify-center h-full">Loading document...</div>
      </div>
    );
  }

  return (
    <div className="flex flex-col w-full h-full overflow-hidden border-l bg-background">
      {/* Responsive Toolbar */}
      <div className="flex flex-wrap items-center justify-between px-3 py-2 border-b bg-background min-h-[48px] shadow-sm">
        {/* Document Selection */}
        <div className="flex items-center flex-1 max-w-[70px] sm:max-w-[100px] md:max-w-[200px]">
          {documents.length > 0 ? (
            <Select value={selectedDocId?.toString()} onValueChange={handleDocumentChange}>
              <SelectTrigger className="h-8 text-xs sm:text-sm bg-transparent hover:bg-accent/50 cursor-pointer w-full border-0 focus:ring-1 focus:ring-offset-0">
                <SelectValue placeholder="Select a document">
                  <div className="truncate">
                    {selectedDocument?.name || "Select document"}
                  </div>
                </SelectValue>
              </SelectTrigger>
              <SelectContent>
                {documents.map((doc) => (
                  <SelectItem key={doc.id} value={doc.id.toString()}>
                    <div className="flex items-center">
                      <span className="mr-2 truncate">{doc.name}</span>
                      <span className="text-xs text-muted-foreground ml-auto">
                        {formatFileSize(doc.size)}
                      </span>
                    </div>
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>
          ) : (
            <span className="text-xs sm:text-sm text-muted-foreground">No documents</span>
          )}
        </div>
        
        {/* Toolbar Buttons */}
        <div className="flex items-center justify-end ml-auto gap-2">
          {viewerFailed && (
            <Button
              variant="ghost"
              size="icon"
              className="h-7 w-7 rounded-md p-0 cursor-pointer hover:bg-accent/50"
              onClick={retryMainViewer}
              title="Try advanced viewer"
            >
              <RefreshCw className="h-4 w-4" />
            </Button>
          )}

          {/* View mode toggle */}
          <Button
            variant="ghost" 
            size="icon"
            className="h-7 w-7 rounded-md p-0 cursor-pointer hover:bg-accent/50"
            onClick={toggleViewMode}
            title={viewMode === 'scroll' ? 'Switch to page mode' : 'Switch to scrolling mode'}
          >
            {viewMode === 'scroll' ? (
              <ScrollText className="h-4 w-4" />
            ) : (
              <FileDown className="h-4 w-4" />
            )}
          </Button>
          
          {/* Fit to width toggle */}
          <Button
            variant="ghost" 
            size="icon"
            className={cn(
              "h-7 w-7 rounded-md p-0 cursor-pointer hover:bg-accent/50",
              fitToWidth && "bg-accent/50"
            )}
            onClick={toggleFitToWidth}
            title={fitToWidth ? 'Custom zoom' : 'Fit to width'}
          >
            <Maximize className="h-4 w-4" />
          </Button>

          {!viewerFailed && (
            <div className="flex items-center p-1.5 border rounded-md bg-card/80 shadow-sm">
              <Button 
                variant="ghost" 
                size="icon"
                className="h-7 w-7 rounded-md p-0 cursor-pointer hover:bg-accent/50"
                onClick={handleZoomOut}
                title="Zoom out"
              >
                <ZoomOut className="h-4 w-4" />
              </Button>
              
              <span className="text-xs font-medium px-2 py-1 min-w-[40px] text-center">
                {Math.round(scale * 100)}%
              </span>
              
              <Button 
                variant="ghost" 
                size="icon"
                className="h-7 w-7 rounded-md p-0 cursor-pointer hover:bg-accent/50"
                onClick={handleZoomIn}
                title="Zoom in"
              >
                <ZoomIn className="h-4 w-4" />
              </Button>
              
              <Button 
                variant="ghost" 
                size="icon"
                className="h-7 w-7 rounded-md p-0 cursor-pointer hover:bg-accent/50"
                onClick={handleResetZoom}
                title="Reset zoom"
              >
                <Maximize className="h-4 w-4" />
              </Button>
            </div>
          )}
        </div>
      </div>
      
      <div 
        className="relative flex-1 overflow-hidden pdf-viewer-box"
        onWheel={handleWheelZoom}
      >
        {/* Ensure mouse wheel always scrolls vertically, even if horizontal scrollbar is present */}
        <div
          className="w-full h-full overflow-auto"
          id="pdf-viewer-scroll-container"
          onError={handleViewerError}
          onScroll={() => {
            // If scrolling, always show the page indicator
            setShowPageIndicator(true);
            
            // Reset timeout for hiding indicator
            if (pageIndicatorTimeoutRef.current) {
              clearTimeout(pageIndicatorTimeoutRef.current);
            }
            
            // Immediately run page detection for faster feedback
            if (viewMode === 'scroll') {
              requestAnimationFrame(detectCurrentPage);
            }
            
            // Schedule hiding indicator
            pageIndicatorTimeoutRef.current = setTimeout(() => {
              setShowPageIndicator(false);
            }, 2000);
          }}
          onWheel={e => {
            // If the user is not holding Ctrl (which is for zoom), always scroll vertically
            if (!e.ctrlKey && e.deltaY !== 0) {
              const target = e.currentTarget;
              // Manually scroll vertically without using preventDefault
              target.scrollTop += e.deltaY;
              // Do NOT use preventDefault in passive listeners
              // e.preventDefault(); <-- This causes the error
            }
            // Let Ctrl+wheel for zoom be handled by handleWheelZoom
          }}
        >
          {pdfViewer}
        </div>

        {/* Page indicator: only show on page/zoom change, fade out after 2s */}
        {!viewerFailed && showPageIndicator && (
          <div 
            className={cn(
              "absolute bottom-4 right-4 px-3 py-1.5 bg-card/90 backdrop-blur-sm border shadow-md rounded-md",
              "text-sm font-medium z-50"
            )}
            style={{ pointerEvents: 'none', transition: 'opacity 0.3s' }}
          >
            <span>Page {lastStablePageRef.current} of {totalPages}</span>
          </div>
        )}
        
        {/* Page navigation buttons - only show in page mode or when specifically interacting */}
        {!viewerFailed && viewMode === 'page' && (
          <>
            <div className="absolute left-3 top-1/2 transform -translate-y-1/2 flex flex-col gap-2 z-[10]">
              <Button
                variant="outline"
                size="icon"
                className="h-10 w-10 rounded-full cursor-pointer bg-card/90 backdrop-blur-lg hover:bg-accent border-2 border-primary shadow-2xl z-[10]"
                style={{ boxShadow: '0 4px 24px 4px rgba(0,0,0,0.35)' }}
                onClick={goToPreviousPage}
                disabled={lastStablePageRef.current <= 1}
              >
                <ChevronLeft className="h-6 w-6" />
              </Button>
            </div>
            <div className="absolute right-3 top-1/2 transform -translate-y-1/2 flex flex-col gap-2 z-[1000]">
              <Button
                variant="outline"
                size="icon"
                className="h-10 w-10 rounded-full cursor-pointer bg-card/90 backdrop-blur-lg hover:bg-accent border-2 border-primary shadow-2xl z-[10]"
                style={{ boxShadow: '0 4px 24px 4px rgba(0,0,0,0.35)' }}
                onClick={goToNextPage}
                disabled={lastStablePageRef.current >= totalPages}
              >
                <ChevronRight className="h-6 w-6" />
              </Button>
            </div>
          </>
        )}
      </div>
    </div>
  );
};
