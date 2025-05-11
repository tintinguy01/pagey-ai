import { useCallback, useEffect, useRef, useState } from 'react';

export function usePdfPageTracking({
  numPages,
  pdfLoaded,
  viewMode,
  onPageChange,
  currentPage,
}: {
  numPages: number | null;
  pdfLoaded: boolean;
  viewMode: 'scroll' | 'page';
  onPageChange?: (page: number) => void;
  currentPage?: number;
}) {
  // Page tracking refs
  const pageRefs = useRef<(HTMLDivElement | null)[]>([]);
  const intersectionObserverRef = useRef<IntersectionObserver | null>(null);
  const pageVisibilityDebounceRef = useRef<NodeJS.Timeout | null>(null);
  const stableVisiblePageRef = useRef<number>(1);
  const [singlePageMode, setSinglePageMode] = useState<number>(1);
  
  // Update intersection observer to be accurate and handle view modes
  useEffect(() => {
    if (!pageRefs.current.length || !pdfLoaded) return;
    
    // Cleanup previous observer
    if (intersectionObserverRef.current) {
      intersectionObserverRef.current.disconnect();
    }
    
    try {
      // Create an intersection observer
      intersectionObserverRef.current = new IntersectionObserver(
        (entries) => {
          // Find the most visible page
          const visibleEntries = entries.filter(entry => entry.isIntersecting);
          if (visibleEntries.length > 0) {
            // Sort by visibility ratio - higher ratio means more visible
            visibleEntries.sort((a, b) => b.intersectionRatio - a.intersectionRatio);
            const mostVisibleEntry = visibleEntries[0];
            
            // Get the page number from the element's data attribute
            const pageNumber = parseInt(
              mostVisibleEntry.target.getAttribute('data-page-number') || '1',
              10
            );
            
            // Only update visible page if it's significantly different in visibility
            // or if it's been stable for a while
            if (mostVisibleEntry.intersectionRatio > 0.5 || 
                Math.abs(mostVisibleEntry.intersectionRatio - 0.5) < 0.1) {
              
              // Clear any existing debounce
              if (pageVisibilityDebounceRef.current) {
                clearTimeout(pageVisibilityDebounceRef.current);
              }
              
              // Use a debounce to ensure the page is actually stable in view
              pageVisibilityDebounceRef.current = setTimeout(() => {
                if (pageNumber !== stableVisiblePageRef.current) {
                  stableVisiblePageRef.current = pageNumber;
                  
                  // In page mode, also update the current single page
                  if (viewMode === 'page') {
                    setSinglePageMode(pageNumber);
                  }
                  
                  // Notify parent about page change only for stable changes
                  if (onPageChange) {
                    onPageChange(pageNumber);
                  }
                }
              }, 150); // Short debounce to ensure stability without lag
            }
          }
        }, 
        { 
          root: null,
          // More threshold points gives us better accuracy in determining page visibility
          threshold: [0.1, 0.2, 0.3, 0.4, 0.5, 0.6, 0.7, 0.8, 0.9]
        }
      );
      
      // Observe all page refs
      pageRefs.current.forEach((pageRef, index) => {
        if (pageRef) {
          pageRef.setAttribute('data-page-number', (index + 1).toString());
          intersectionObserverRef.current!.observe(pageRef);
        }
      });
    } catch (error) {
      console.error("Error setting up intersection observer:", error);
    }
    
    return () => {
      if (intersectionObserverRef.current) {
        intersectionObserverRef.current.disconnect();
      }
      if (pageVisibilityDebounceRef.current) {
        clearTimeout(pageVisibilityDebounceRef.current);
      }
    };
  }, [numPages, pdfLoaded, onPageChange, viewMode]);

  // Effect to handle page mode changes
  useEffect(() => {
    if (viewMode === 'page' && numPages && pdfLoaded) {
      // When switching to page mode, scroll to the current page
      const pageIndex = stableVisiblePageRef.current - 1;
      if (pageRefs.current[pageIndex]) {
        pageRefs.current[pageIndex]?.scrollIntoView({ behavior: "smooth", block: "start" });
      }
    }
  }, [viewMode, numPages, pdfLoaded]);

  // Add an effect to handle direct page changes in single page mode
  useEffect(() => {
    if (viewMode === 'page' && pdfLoaded) {
      // Force re-render when page changes in single page mode
      pageRefs.current = Array(numPages || 0).fill(null);
    }
  }, [singlePageMode, viewMode, pdfLoaded, numPages]);

  // Add an effect to handle external page changes
  useEffect(() => {
    if (currentPage && viewMode === 'page' && pdfLoaded && numPages && currentPage <= numPages) {
      setSinglePageMode(currentPage);
      stableVisiblePageRef.current = currentPage;
    }
  }, [currentPage, viewMode, pdfLoaded, numPages]);

  // Handle navigation to previous and next pages
  const goToNextPage = useCallback(() => {
    if (viewMode === 'page' && singlePageMode < (numPages || 1)) {
      const newPage = singlePageMode + 1;
      setSinglePageMode(newPage);
      stableVisiblePageRef.current = newPage;
      
      // Ensure we notify parent of the change
      if (onPageChange) {
        onPageChange(newPage);
      }
    }
  }, [viewMode, singlePageMode, numPages, onPageChange]);

  const goToPreviousPage = useCallback(() => {
    if (viewMode === 'page' && singlePageMode > 1) {
      const newPage = singlePageMode - 1;
      setSinglePageMode(newPage);
      stableVisiblePageRef.current = newPage;
      
      // Ensure we notify parent of the change
      if (onPageChange) {
        onPageChange(newPage);
      }
    }
  }, [viewMode, singlePageMode, onPageChange]);

  return {
    pageRefs,
    stableVisiblePageRef,
    singlePageMode,
    setSinglePageMode,
    goToNextPage,
    goToPreviousPage
  };
} 