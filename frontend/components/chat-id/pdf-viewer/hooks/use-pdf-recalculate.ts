import { useCallback, useEffect, useRef } from 'react';
import { Highlight } from '../types/pdf-types';

export function usePdfRecalculate({
  highlights,
  highlightVisible,
  pageRefs,
  containerRef,
  zoom,
  viewMode,
  singlePageMode
}: {
  highlights: Highlight[];
  highlightVisible: boolean;
  pageRefs: React.MutableRefObject<(HTMLDivElement | null)[]>;
  containerRef: React.RefObject<HTMLDivElement>;
  zoom: number;
  viewMode: 'scroll' | 'page';
  singlePageMode: number;
}) {
  // Store previous page mode to detect changes
  const prevPageModeRef = useRef<number>(singlePageMode);
  const recalculateTimeoutRef = useRef<NodeJS.Timeout | null>(null);
  
  // Function to recalculate highlight positions
  const recalculateHighlightPositions = useCallback(() => {
    if (!highlightVisible || highlights.length === 0) return;
    
    // Create updated highlights with recalculated positions
    const updatedHighlights = highlights.map(highlight => {
      // Skip if no span elements
      if (!highlight.spanElements || highlight.spanElements.length === 0) {
        return highlight;
      }
      
      try {
        // Find the page container for this highlight
        const pageContainer = pageRefs.current[highlight.page - 1];
        if (!pageContainer) return highlight;
        
        // Find the text layer in the page
        const textLayer = pageContainer.querySelector('.react-pdf__Page__textContent');
        if (!textLayer) return highlight;
        
        // Calculate span positions
        let minLeft = Infinity;
        let minTop = Infinity;
        let maxRight = -Infinity;
        let maxBottom = -Infinity;
        let validSpansFound = false;
        
        // Find all text spans in the page
        const spans = Array.from(textLayer.querySelectorAll('span')) as HTMLSpanElement[];
        
        // Check each original span information and find matching spans in the current DOM
        highlight.spanElements.forEach(({ originalText }) => {
          // Skip if no original text
          if (!originalText) return;
          
          // Try to find the text element with matching content
          for (const span of spans) {
            if (span.textContent?.trim() === originalText.trim()) {
              // Get the current span position relative to the page
              const currentRect = span.getBoundingClientRect();
              
              if (currentRect.width > 0 && currentRect.height > 0) {
                minLeft = Math.min(minLeft, currentRect.left);
                minTop = Math.min(minTop, currentRect.top);
                maxRight = Math.max(maxRight, currentRect.right);
                maxBottom = Math.max(maxBottom, currentRect.bottom);
                validSpansFound = true;
              }
              break;
            }
          }
        });
        
        // If we found valid spans, update the rectangle
        if (validSpansFound) {
          // Get the PDF page element - use a more specific selector for page mode
          const pdfPage = viewMode === 'page' 
            ? pageContainer.querySelector('.react-pdf__Page')
            : pageContainer.querySelector('.react-pdf__Page');
            
          if (!pdfPage) return highlight;
          
          // Get current page dimensions
          const pageRect = pdfPage.getBoundingClientRect();
          
          // Create a new highlight with updated rectangle positions
          const newHighlight: Highlight = {
            ...highlight,
            rect: new DOMRect(
              minLeft - pageRect.left,
              minTop - pageRect.top,
              maxRight - minLeft,
              maxBottom - minTop
            ),
            // Keep the same span elements data but ensure no DOM references
            spanElements: highlight.spanElements.map(span => ({
              ...span,
              element: null // Ensure no DOM references are stored
            }))
          };
          
          return newHighlight;
        }
      } catch (err) {
        console.error("Error recalculating highlight position:", err);
      }
      
      // Return original highlight if update failed
      return {
        ...highlight,
        spanElements: highlight.spanElements.map(span => ({
          ...span,
          element: null // Ensure no DOM references are stored
        }))
      };
    });
    
    return updatedHighlights;
  }, [highlights, highlightVisible, pageRefs, viewMode]);

  // Effect to recalculate highlights on scroll and zoom changes
  useEffect(() => {
    if (!highlights.length || !highlightVisible) return;
    
    // Set up listeners to recalculate when needed
    const handleRecalculate = () => {
      if (recalculateTimeoutRef.current) {
        clearTimeout(recalculateTimeoutRef.current);
      }
      
      // Use requestAnimationFrame for smooth performance
      recalculateTimeoutRef.current = setTimeout(() => {
        requestAnimationFrame(recalculateHighlightPositions);
      }, 100);
    };
    
    // Listen for scroll events
    const container = document.getElementById('pdf-viewer-scroll-container');
    if (container) {
      container.addEventListener('scroll', handleRecalculate, { passive: true });
    }
    
    // Listen for resize (which might happen during zoom)
    window.addEventListener('resize', handleRecalculate);
    
    // Set up mutation observer to watch for PDF content changes
    const observer = new MutationObserver(() => {
      handleRecalculate();
    });
    
    // Observe the PDF container for changes
    if (containerRef.current) {
      observer.observe(containerRef.current, { 
        childList: true, 
        subtree: true,
        attributes: true,
        attributeFilter: ['style', 'class']
      });
    }
    
    return () => {
      if (container) {
        container.removeEventListener('scroll', handleRecalculate);
      }
      window.removeEventListener('resize', handleRecalculate);
      observer.disconnect();
      
      if (recalculateTimeoutRef.current) {
        clearTimeout(recalculateTimeoutRef.current);
      }
    };
  }, [highlights, highlightVisible, recalculateHighlightPositions, containerRef]);
  
  // Special effect for page mode changes
  useEffect(() => {
    if (viewMode === 'page' && highlights.length > 0 && highlightVisible) {
      // Check if the page has changed
      if (prevPageModeRef.current !== singlePageMode) {
        prevPageModeRef.current = singlePageMode;
        
        // Add a delay to allow the new page to render before recalculating
        if (recalculateTimeoutRef.current) {
          clearTimeout(recalculateTimeoutRef.current);
        }
        
        recalculateTimeoutRef.current = setTimeout(() => {
          requestAnimationFrame(recalculateHighlightPositions);
        }, 300);
      }
    }
  }, [singlePageMode, viewMode, highlights, highlightVisible, recalculateHighlightPositions]);
  
  // Add effect for zoom changes
  useEffect(() => {
    // Recalculate on zoom changes after a small delay
    if (highlights.length > 0 && highlightVisible) {
      if (recalculateTimeoutRef.current) {
        clearTimeout(recalculateTimeoutRef.current);
      }
      
      recalculateTimeoutRef.current = setTimeout(() => {
        recalculateHighlightPositions();
      }, 100);
    }
    
    return () => {
      if (recalculateTimeoutRef.current) {
        clearTimeout(recalculateTimeoutRef.current);
      }
    };
  }, [zoom, recalculateHighlightPositions, highlights, highlightVisible]);

  return {
    recalculateHighlightPositions,
  };
} 