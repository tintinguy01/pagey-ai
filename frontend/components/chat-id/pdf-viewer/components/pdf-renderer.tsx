'use client';

import React, { useMemo } from 'react';
import { Page } from 'react-pdf';
import { Highlight } from '../types/pdf-types';

interface PdfRendererProps {
  numPages: number | null;
  pdfLoaded: boolean;
  pageRefs: React.MutableRefObject<(HTMLDivElement | null)[]>;
  viewMode: 'scroll' | 'page';
  singlePageMode: number;
  containerWidth: number;
  highlights: Highlight[];
  highlightVisible: boolean;
  urlRef: React.MutableRefObject<string>;
  zoom: number;
  handleScroll: (e: React.UIEvent<HTMLDivElement>) => void;
  onPageRendered?: (pageNumber: number) => void;
}

export function PdfRenderer({
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
  onPageRendered
}: PdfRendererProps) {
  
  // Calculate page width based on settings
  const isZoomed = zoom !== 1;
  const pageWidth = isZoomed ? containerWidth * zoom : containerWidth;
  
  // Render PDF pages based on view mode
  const renderPages = useMemo(() => {
    if (!numPages || !pdfLoaded) return null;
    
    // Single page mode - Fixed approach without Date.now()
    if (viewMode === 'page') {
      const index = singlePageMode - 1;
      
      // Filter highlights for the current page
      const pageHighlights = highlightVisible ? highlights.filter(h => h.page === singlePageMode) : [];
      
      // Create a stable but unique key that changes only when page or URL changes
      const pageKey = `page_${singlePageMode}_${urlRef.current}_${zoom}`;
      
      return (
        <div
          key={pageKey}
          className="pdf-page-container relative"
          ref={el => { pageRefs.current[index] = el; }}
          data-page-number={singlePageMode}
          style={{ 
            display: 'flex', 
            justifyContent: 'center', 
            margin: '0 auto 12px auto', 
            width: '100%',
            position: 'relative'
          }}
          tabIndex={0}
        >
          <div className="relative" style={{ width: pageWidth }}>
            {/* Since we're rendering inside useMemo, explicitly force the pageNumber */}
            <Page
              key={pageKey}
              pageNumber={singlePageMode}
              width={pageWidth}
              scale={1}
              renderTextLayer={true}
              renderAnnotationLayer={true}
              canvasBackground="white"
              error={<div className="text-red-500 p-4">Error loading page {singlePageMode}</div>}
              className="shadow-md high-quality-page"
              loading={<div className="flex items-center justify-center w-full h-32">
                <div className="h-6 w-6 border-2 border-t-primary border-primary/30 rounded-full animate-spin"></div>
              </div>}
              onRenderSuccess={() => onPageRendered?.(singlePageMode)}
            />
            
            {/* Highlight overlay container */}
            <div className="absolute top-0 left-0 w-full h-full" style={{ pointerEvents: 'none' }}>
              {pageHighlights.map((h, i) => (
                <div
                  key={`highlight-${i}-${singlePageMode}`}
                  className="pdf-highlight-overlay"
                  style={{
                    position: 'absolute',
                    left: `${h.rect.left}px`,
                    top: `${h.rect.top}px`,
                    width: `${h.rect.width}px`,
                    height: `${h.rect.height}px`,
                    background: h.color || 'rgba(59, 130, 246, 0.3)',
                    pointerEvents: 'none',
                    zIndex: 10,
                    borderRadius: '1px',
                    mixBlendMode: 'multiply',
                  }}
                  data-highlight-id={i}
                  data-scale={zoom}
                />
              ))}
            </div>
          </div>
        </div>
      );
    }
    
    // Scroll mode (keeping this part the same)
    return (
      <div
        className="pdf-pages-scroll-container pdf-scroll-element w-full border-b border-muted"
        style={{ 
          overflowX: 'auto', 
          overflowY: 'auto', 
          display: 'flex', 
          flexDirection: 'column',
          alignItems: 'center',
          height: '100%',
          width: '100%',
        }}
        onScroll={handleScroll}
        tabIndex={0}
        data-testid="pdf-scroll-container"
      >
        <div style={{ 
          minWidth: pageWidth,
          width: pageWidth,
          maxWidth: 'none', // allow to expand beyond parent
          display: 'flex',
          flexDirection: 'column',
          alignItems: 'center',
          overflow: 'visible',
        }}>
          {Array.from(new Array(numPages), (el, index) => {
            // Filter highlights for this page
            const pageHighlights = highlightVisible ? highlights.filter(h => h.page === index + 1) : [];
            
            return (
              <div
                key={`page_${index + 1}`}
                className="pdf-page-container"
                ref={el => { pageRefs.current[index] = el; }}
                data-page-number={index + 1}
                style={{ 
                  display: 'flex', 
                  justifyContent: 'center',
                  margin: '0 auto 12px auto',
                  position: 'relative', // Ensure position is relative for absolute highlights
                }}
              >
                <div className="relative" style={{ width: pageWidth }}>
                  <Page
                    key={`page_${index + 1}_${urlRef.current}_${zoom}`}
                    pageNumber={index + 1}
                    width={pageWidth}
                    scale={1}
                    renderTextLayer={true}
                    renderAnnotationLayer={true}
                    canvasBackground="white"
                    error={<div className="text-red-500 p-4">Error loading page {index + 1}</div>}
                    className="shadow-md high-quality-page"
                    loading={<div className="flex items-center justify-center w-full h-32"><div className="h-6 w-6 border-2 border-t-primary border-primary/30 rounded-full animate-spin"></div></div>}
                  />
                  
                  {/* Highlight overlay container */}
                  <div className="absolute top-0 left-0 w-full h-full" style={{ pointerEvents: 'none' }}>
                    {pageHighlights.map((h, i) => (
                      <div
                        key={i}
                        className="pdf-highlight-overlay"
                        style={{
                          position: 'absolute',
                          left: `${h.rect.left}px`,
                          top: `${h.rect.top}px`,
                          width: `${h.rect.width}px`,
                          height: `${h.rect.height}px`,
                          background: h.color || 'rgba(59, 130, 246, 0.3)', // Blue theme color with transparency
                          pointerEvents: 'none',
                          zIndex: 10,
                          borderRadius: '1px',
                          mixBlendMode: 'multiply',
                        }}
                        data-highlight-id={i}
                        data-scale={zoom}
                      />
                    ))}
                  </div>
                </div>
              </div>
            );
          })}
        </div>
      </div>
    );
  }, [
    numPages, 
    pdfLoaded, 
    viewMode, 
    singlePageMode, // Ensure singlePageMode is in deps array 
    pageWidth, 
    zoom, 
    pageRefs, 
    handleScroll, 
    highlights, 
    highlightVisible, 
    urlRef, 
    containerWidth
  ]);

  // Use the same key approach but without the React.Fragment and without Date.now()
  if (viewMode === 'page') {
    // This forces a remount whenever singlePageMode changes, without continuous re-renders
    const wrapperKey = `page-wrapper-${singlePageMode}-${urlRef.current}`;
    return <div key={wrapperKey}>{renderPages}</div>;
  }
  
  return renderPages;
} 