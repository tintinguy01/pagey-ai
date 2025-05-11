import { useCallback, useEffect, useRef, useState } from 'react';
import { Highlight, SourceHighlight, SpanElement } from '../types/pdf-types';

export function usePdfHighlights({
  highlightSource,
  numPages,
  pdfLoaded,
  pageRefs,
  viewMode,
  scrollToHighlightKey,
  setSinglePageMode,
  stableVisiblePageRef,
  onPageChange,
  setOnPageRenderedCallback
}: {
  highlightSource: SourceHighlight | null | undefined;
  numPages: number | null;
  pdfLoaded: boolean;
  pageRefs: React.MutableRefObject<(HTMLDivElement | null)[]>;
  viewMode: 'scroll' | 'page';
  scrollToHighlightKey?: number;
  setSinglePageMode: (page: number) => void;
  stableVisiblePageRef: React.MutableRefObject<number>;
  onPageChange?: (page: number) => void;
  setOnPageRenderedCallback?: (cb: (pageNumber: number) => void) => void;
}) {
  const [highlights, setHighlights] = useState<Highlight[]>([]);
  const highlightsRef = useRef<Highlight[]>([]);
  const lastScrollKeyRef = useRef<number | null>(null);
  const scrolledForHighlightsRef = useRef<boolean>(false);
  const handledScrollKeysRef = useRef<Set<number>>(new Set());
  const lastHighlightSource = useRef<SourceHighlight | null | undefined>(null);
  const highlightTimeoutRef = useRef<NodeJS.Timeout | null>(null);
  const lastHighlightSourceForPageRef = useRef<SourceHighlight | null>(null);
  
  // Store last page mode to detect changes
  const lastPageModeRef = useRef<number>(1);

  // Track last scrolled-to highlight in scroll mode
  const lastScrolledHighlightRef = useRef<string | null>(null);

  useEffect(() => {
    highlightsRef.current = highlights;
  }, [highlights]);

  // Clear highlights when highlightSource becomes null or undefined
  useEffect(() => {
    if (!highlightSource) {
      setHighlights([]);
    }
  }, [highlightSource]);

  // Function to find text in the PDF page
  const findTextInPage = useCallback((pageDiv: HTMLDivElement, highlightSource: SourceHighlight, pageIndex: number) => {
    if (!pageDiv) return;
    
    const textLayer = pageDiv.querySelector('.react-pdf__Page__textContent');
    if (!textLayer) {
      // Retry after a short delay if text layer isn't ready
      if (highlightTimeoutRef.current) {
        clearTimeout(highlightTimeoutRef.current);
      }
      highlightTimeoutRef.current = setTimeout(() => {
        findTextInPage(pageDiv, highlightSource, pageIndex);
      }, 500);
      return;
    }
    
    try {
      const normalizedSearchText = highlightSource.text.replace(/\s+/g, ' ').toLowerCase().trim();
      const textSpans = Array.from(textLayer.querySelectorAll('span')) as HTMLSpanElement[];
      let bestMatch: { span: HTMLSpanElement | null; score: number; text: string } = { span: null, score: 0, text: '' };
      const matchingSpans: HTMLSpanElement[] = [];
      let currentMatchText = '';
      const currentMatchSpans: HTMLSpanElement[] = [];
      
      for (const span of textSpans) {
        if (!span.textContent) continue;
        const spanText = span.textContent.replace(/\s+/g, ' ').toLowerCase().trim();
        currentMatchSpans.push(span);
        currentMatchText += ' ' + spanText;
        currentMatchText = currentMatchText.trim();
        if (currentMatchText.includes(normalizedSearchText)) {
          matchingSpans.push(...currentMatchSpans);
          break;
        }
        while (currentMatchSpans.length > 1 && currentMatchText.length > normalizedSearchText.length * 2) {
          const removedSpan = currentMatchSpans.shift();
          if (removedSpan && removedSpan.textContent) {
            const removedText = removedSpan.textContent.replace(/\s+/g, ' ').toLowerCase().trim();
            currentMatchText = currentMatchText.replace(removedText, '').trim();
          }
        }
      }
      
      const defaultHighlightColor = 'rgba(59, 130, 246, 0.3)';
      
      if (matchingSpans.length > 0) {
        let minLeft = Infinity, minTop = Infinity, maxRight = -Infinity, maxBottom = -Infinity;
        const spanElementsData: SpanElement[] = matchingSpans.map(span => {
          const rect = span.getBoundingClientRect();
          minLeft = Math.min(minLeft, rect.left);
          minTop = Math.min(minTop, rect.top);
          maxRight = Math.max(maxRight, rect.right);
          maxBottom = Math.max(maxBottom, rect.bottom);
          return {
            element: null,
            originalText: span.textContent || '',
            originalRect: {
              top: rect.top,
              left: rect.left,
              bottom: rect.bottom,
              right: rect.right,
              width: rect.width,
              height: rect.height,
            },
          };
        });
        
        const pageRect = pageDiv.getBoundingClientRect();
        const newHighlight = {
          page: highlightSource.page,
          rect: new DOMRect(
            minLeft - pageRect.left,
            minTop - pageRect.top,
            maxRight - minLeft,
            maxBottom - minTop
          ),
          color: highlightSource.color || defaultHighlightColor,
          spanElements: spanElementsData,
        };
        const current = highlightsRef.current[0];
        if (
          current &&
          current.page === newHighlight.page &&
          current.rect.x === newHighlight.rect.x &&
          current.rect.y === newHighlight.rect.y &&
          current.rect.width === newHighlight.rect.width &&
          current.rect.height === newHighlight.rect.height &&
          current.spanElements.length === newHighlight.spanElements.length &&
          current.spanElements.every((el, i) => el.originalText === newHighlight.spanElements[i].originalText)
        ) {
          // No need to update
          return;
        }
        setHighlights([newHighlight]);
        return;
      }
      
      // Try to find any spans containing the search text
      for (const span of textSpans) {
        if (!span.textContent) continue;
        const normalizedSpanText = span.textContent.replace(/\s+/g, ' ').toLowerCase().trim();
        if (normalizedSpanText.includes(normalizedSearchText)) {
          const foundRect = span.getBoundingClientRect();
          const pageRect = pageDiv.getBoundingClientRect();
          const newHighlight = {
            page: highlightSource.page,
            rect: new DOMRect(
              foundRect.left - pageRect.left,
              foundRect.top - pageRect.top,
              foundRect.width,
              foundRect.height
            ),
            color: highlightSource.color || defaultHighlightColor,
            spanElements: [{
              element: null,
              originalText: span.textContent || '',
              originalRect: {
                top: foundRect.top,
                left: foundRect.left,
                bottom: foundRect.bottom,
                right: foundRect.right,
                width: foundRect.width,
                height: foundRect.height,
              },
            }],
          };
          const current = highlightsRef.current[0];
          if (
            current &&
            current.page === newHighlight.page &&
            current.rect.x === newHighlight.rect.x &&
            current.rect.y === newHighlight.rect.y &&
            current.rect.width === newHighlight.rect.width &&
            current.rect.height === newHighlight.rect.height &&
            current.spanElements.length === newHighlight.spanElements.length &&
            current.spanElements.every((el, i) => el.originalText === newHighlight.spanElements[i].originalText)
          ) {
            // No need to update
            return;
          }
          setHighlights([newHighlight]);
          return;
        }
        
        // Try to find partial matches
        let maxLength = 0;
        let maxCommonSubstring = '';
        for (let i = 0; i < normalizedSearchText.length; i++) {
          for (let j = i + 1; j <= normalizedSearchText.length; j++) {
            const substr = normalizedSearchText.substring(i, j);
            if (substr.length > 3 && normalizedSpanText.includes(substr)) {
              if (substr.length > maxLength) {
                maxLength = substr.length;
                maxCommonSubstring = substr;
              }
            }
          }
        }
        
        const score = maxLength > 0 ? (maxLength / Math.max(normalizedSearchText.length, normalizedSpanText.length)) * 100 : 0;
        if (score > bestMatch.score) {
          bestMatch = { span, score, text: maxCommonSubstring };
        }
      }
      
      // Use the best partial match if we found one with a good score
      if (bestMatch.score > 30 && bestMatch.span) {
        const foundRect = bestMatch.span.getBoundingClientRect();
        const pageRect = pageDiv.getBoundingClientRect();
        const newHighlight = {
          page: highlightSource.page,
          rect: new DOMRect(
            foundRect.left - pageRect.left,
            foundRect.top - pageRect.top,
            foundRect.width,
            foundRect.height
          ),
          color: highlightSource.color || defaultHighlightColor,
          spanElements: [{
            element: null,
            originalText: bestMatch.span.textContent || '',
            originalRect: {
              top: foundRect.top,
              left: foundRect.left,
              bottom: foundRect.bottom,
              right: foundRect.right,
              width: foundRect.width,
              height: foundRect.height,
            },
          }],
        };
        const current = highlightsRef.current[0];
        if (
          current &&
          current.page === newHighlight.page &&
          current.rect.x === newHighlight.rect.x &&
          current.rect.y === newHighlight.rect.y &&
          current.rect.width === newHighlight.rect.width &&
          current.rect.height === newHighlight.rect.height &&
          current.spanElements.length === newHighlight.spanElements.length &&
          current.spanElements.every((el, i) => el.originalText === newHighlight.spanElements[i].originalText)
        ) {
          // No need to update
          return;
        }
        setHighlights([newHighlight]);
      } else {
        setHighlights([]);
      }
    } catch (error) {
      console.error("Error finding text in page:", error);
      setHighlights([]);
    }
  }, []);

  // Dedicated effect for highlight finding in scroll mode (no scrolling)
  useEffect(() => {
    if (viewMode !== 'scroll' || !highlightSource || !highlightSource.text || !highlightSource.page || !numPages || !pdfLoaded) {
      return;
    }
    
    // Skip if the page is beyond the document
    if (highlightSource.page > numPages) {
      return;
    }
    
    // Skip if we already have a highlight for this text on this page
    if (highlights.length > 0 && 
        highlights[0].page === highlightSource.page && 
        highlights[0].spanElements.some(el => el.originalText.includes(highlightSource.text))) {
      return;
    }
    
    const pageIndex = highlightSource.page - 1;
    const pageDiv = pageRefs.current[pageIndex];
    
    if (!pageDiv) {
      return;
    }
    
    // Find highlight in scroll mode with fast polling for text layer
    const textLayer = pageDiv.querySelector('.react-pdf__Page__textContent');
    if (textLayer) {
      findTextInPage(pageDiv, highlightSource, pageIndex);
    } else {
      // Poll for the text layer if not present yet
      const start = Date.now();
      const poll = () => {
        const textLayerNow = pageDiv.querySelector('.react-pdf__Page__textContent');
        if (textLayerNow) {
          findTextInPage(pageDiv, highlightSource, pageIndex);
          return;
        }
        if (Date.now() - start < 1000) {
          setTimeout(poll, 50);
        }
      };
      poll();
    }
  }, [viewMode, highlightSource, numPages, pdfLoaded, pageRefs, findTextInPage]);

  // Highlight finding logic, improved for page mode
  useEffect(() => {
    // Only run this effect in page mode
    if (viewMode !== 'page') {
      return;
    }
    
    if (!highlightSource || !highlightSource.text || !highlightSource.page || !numPages || !pdfLoaded) {
      return;
    }
    
    // Skip if the page is beyond the document
    if (highlightSource.page > numPages) {
      return;
    }
    
    // Store the current highlight source for reference
    lastHighlightSource.current = highlightSource;
    
    // Check if we already have a highlight for this text on this page
    if (highlights.length > 0 && 
        highlights[0].page === highlightSource.page && 
        highlights[0].spanElements.some(el => el.originalText.includes(highlightSource.text))) {
      return;
    }
    
    const pageIndex = highlightSource.page - 1;
    const pageDiv = pageRefs.current[pageIndex];
    
    // If we're in page mode, ensure we show the correct page
    if (
      (lastHighlightSourceForPageRef.current?.page !== highlightSource.page ||
       lastHighlightSourceForPageRef.current?.text !== highlightSource.text)
    ) {
      console.log('[usePdfHighlights] Setting single page mode to', highlightSource.page);
      setSinglePageMode(highlightSource.page);
      stableVisiblePageRef.current = highlightSource.page;
      lastHighlightSourceForPageRef.current = highlightSource;
      if (onPageChange) {
        onPageChange(highlightSource.page);
      }
      // Use fast polling to detect when the new page's text layer is available
      const pollForTextLayer = () => {
        const start = Date.now();
        const poll = () => {
          const updatedPageDiv = pageRefs.current[pageIndex];
          if (updatedPageDiv) {
            const textLayer = updatedPageDiv.querySelector('.react-pdf__Page__textContent');
            if (textLayer) {
              console.log('[usePdfHighlights] Poll: found text layer, running findTextInPage', highlightSource.page);
              findTextInPage(updatedPageDiv, highlightSource, pageIndex);
              return;
            }
          }
          if (Date.now() - start < 1000) {
            setTimeout(poll, 50);
          }
        };
        poll();
      };
      pollForTextLayer();
      return;
    } else if (viewMode === 'page') {
      // If already on the correct page, just try to find the highlight instantly
      const updatedPageDiv = pageRefs.current[pageIndex];
      // Only run if highlights are empty or do not match the current highlightSource
      if (
        updatedPageDiv &&
        (
          highlights.length === 0 ||
          highlights[0].page !== highlightSource.page ||
          !highlights[0].spanElements.some(el => el.originalText.includes(highlightSource.text))
        )
      ) {
        console.log('[usePdfHighlights] Already on correct page, running findTextInPage', highlightSource.page);
        findTextInPage(updatedPageDiv, highlightSource, pageIndex);
      }
      return;
    }
    
    if (!pageDiv) {
      // Try again later if the page isn't loaded yet
      if (highlightTimeoutRef.current) {
        clearTimeout(highlightTimeoutRef.current);
      }
      
      highlightTimeoutRef.current = setTimeout(() => {
        // Check if the highlight source is still the same
        if (lastHighlightSource.current === highlightSource) {
          const updatedPageDiv = pageRefs.current[pageIndex];
          if (updatedPageDiv) {
            console.log('[usePdfHighlights] Running findTextInPage after waiting for pageDiv', highlightSource.page);
            findTextInPage(updatedPageDiv, highlightSource, pageIndex);
          } else {
            console.log('[usePdfHighlights] Page div still not ready after waiting for page', highlightSource.page);
          }
        }
      }, 1000);
      
      return;
    }
    
    // Clear any existing timeout
    if (highlightTimeoutRef.current) {
      clearTimeout(highlightTimeoutRef.current);
    }
    
    // Set a delay for finding text to ensure PDF has rendered completely (page mode only)
    highlightTimeoutRef.current = setTimeout(() => {
      if (pageDiv) {
        console.log('[usePdfHighlights] Running findTextInPage after pageDiv ready (page mode)', highlightSource.page);
        findTextInPage(pageDiv, highlightSource, pageIndex);
      }
    }, 800);
    
    return () => {
      if (highlightTimeoutRef.current) {
        clearTimeout(highlightTimeoutRef.current);
      }
    };
  }, [highlightSource, numPages, pdfLoaded, viewMode, pageRefs, stableVisiblePageRef, setSinglePageMode, findTextInPage]);

  // Effect to recalculate highlights when the page mode changes
  useEffect(() => {
    if (viewMode === 'page' && lastPageModeRef.current !== stableVisiblePageRef.current) {
      lastPageModeRef.current = stableVisiblePageRef.current;
      
      // If we have a highlight on the current page, recalculate its position
      if (highlights.length > 0 && highlights[0].page === stableVisiblePageRef.current) {
        // Wait for the page to fully render before recalculating the highlight
        if (highlightTimeoutRef.current) {
          clearTimeout(highlightTimeoutRef.current);
        }
        
        highlightTimeoutRef.current = setTimeout(() => {
          const pageIndex = stableVisiblePageRef.current - 1;
          const pageDiv = pageRefs.current[pageIndex];
          
          if (pageDiv && lastHighlightSource.current) {
            findTextInPage(pageDiv, lastHighlightSource.current, pageIndex);
          }
        }, 800);
      }
      // If we have a highlight but not on the current page, clear it to avoid confusion
      else if (highlights.length > 0 && highlights[0].page !== stableVisiblePageRef.current) {
        setHighlights([]);
      }
    }
  }, [viewMode, stableVisiblePageRef, pageRefs, highlights, findTextInPage]);

  // Add a useEffect to clear highlights when changing pages in page mode if highlight is not on the new page
  useEffect(() => {
    if (viewMode === 'page' && highlights.length > 0) {
      // If we have highlights but they're not on the current page, clear them
      const highlightPage = highlights[0]?.page;
      if (highlightPage !== stableVisiblePageRef.current) {
        setHighlights([]);
      }
    }
  }, [viewMode, stableVisiblePageRef.current, highlights]);

  // Modify scrollToHighlight function to improve page mode behavior
  const scrollToHighlight = useCallback(() => {
    if (!scrollToHighlightKey) return false;
    if (!highlights.length) return false;
    if (handledScrollKeysRef.current.has(scrollToHighlightKey)) {
      return false;
    }
    
    const highlight = highlights[0];
    const pageDiv = pageRefs.current[highlight.page - 1];
    
    if (!pageDiv) return false;
    
    lastScrollKeyRef.current = scrollToHighlightKey;
    scrolledForHighlightsRef.current = true;
    handledScrollKeysRef.current.add(scrollToHighlightKey);
    
    if (viewMode === 'page') {
      // In page mode, first ensure we're on the right page
      // Set this synchronously to avoid race conditions
      stableVisiblePageRef.current = highlight.page;
      setSinglePageMode(highlight.page);
      
      // Set up a mutation observer to watch for the highlight to appear
      const observer = new MutationObserver(() => {
        const highlightDiv = pageDiv.querySelector('.pdf-highlight-overlay');
        if (highlightDiv) {
          // When the highlight appears, scroll to it smoothly
          highlightDiv.scrollIntoView({ behavior: 'smooth', block: 'center' });
          observer.disconnect();
        }
      });
      
      // Observe changes to the page container to detect when highlights are added
      observer.observe(pageDiv, { childList: true, subtree: true });
      
      // Also set a timeout as a fallback to ensure we eventually scroll
      setTimeout(() => {
        observer.disconnect();
        const highlightDiv = pageDiv.querySelector('.pdf-highlight-overlay');
        if (highlightDiv) {
          highlightDiv.scrollIntoView({ behavior: 'smooth', block: 'center' });
        } else {
          // If no highlight was found, at least scroll to the page
          pageDiv.scrollIntoView({ behavior: 'smooth', block: 'center' });
        }
      }, 1500); // Increased timeout for better reliability
    } else {
      // In scroll mode, just scroll to the page containing the highlight
      pageDiv.scrollIntoView({ behavior: 'smooth', block: 'center' });
    }
    
    return true;
  }, [highlights, pageRefs, scrollToHighlightKey, setSinglePageMode, viewMode, stableVisiblePageRef]);

  // Effect to handle scrolling when scrollToHighlightKey changes
  useEffect(() => {
    if (!scrollToHighlightKey) return;
    if (handledScrollKeysRef.current.has(scrollToHighlightKey)) {
      return;
    }
    
    if (highlights.length > 0) {
      scrollToHighlight();
    } else {
      scrolledForHighlightsRef.current = false;
    }
  }, [scrollToHighlightKey, scrollToHighlight, highlights]);

  // Effect to handle scrolling when highlights change (if we're waiting for them)
  useEffect(() => {
    if (!scrollToHighlightKey) return;
    if (handledScrollKeysRef.current.has(scrollToHighlightKey)) {
      return;
    }
    
    if (highlights.length > 0 && !scrolledForHighlightsRef.current) {
      scrollToHighlight();
    }
  }, [highlights, scrollToHighlightKey, scrollToHighlight]);

  // Register a callback for when the correct page is rendered
  useEffect(() => {
    if (!setOnPageRenderedCallback) return;
    setOnPageRenderedCallback((pageNumber: number) => {
      // Only run if the page matches the highlightSource
      if (
        viewMode === 'page' &&
        highlightSource &&
        pageNumber === highlightSource.page
      ) {
        const pageIndex = pageNumber - 1;
        const updatedPageDiv = pageRefs.current[pageIndex];
        if (updatedPageDiv) {
          findTextInPage(updatedPageDiv, highlightSource, pageIndex);
        }
      }
    });
  }, [setOnPageRenderedCallback, viewMode, highlightSource, pageRefs, findTextInPage]);

  // Dedicated effect for auto-scroll in scroll mode (runs ONLY when highlightSource changes)
  useEffect(() => {
    if (viewMode !== 'scroll' || !highlightSource || !highlightSource.text || !highlightSource.page || !numPages || !pdfLoaded) {
      return;
    }
    
    // Only scroll if highlightSource is new
    const highlightKey = `${highlightSource.page}-${highlightSource.text}`;
    if (lastScrolledHighlightRef.current === highlightKey) {
      return;
    }
    
    const pageIndex = highlightSource.page - 1;
    const pageDiv = pageRefs.current[pageIndex];
    if (!pageDiv) {
      return;
    }
    
    // Schedule the scroll with a short delay to ensure highlight is calculated first
    setTimeout(() => {
      pageDiv.scrollIntoView({ behavior: 'smooth', block: 'center' });
      if (onPageChange) {
        onPageChange(highlightSource.page);
      }
      lastScrolledHighlightRef.current = highlightKey;
    }, 100);
  }, [highlightSource, viewMode, numPages, pdfLoaded, pageRefs, onPageChange]);

  // Cleanup on unmount
  useEffect(() => {
    return () => {
      if (highlightTimeoutRef.current) {
        clearTimeout(highlightTimeoutRef.current);
      }
    };
  }, []);

  return {
    highlights,
    setHighlights,
  };
} 