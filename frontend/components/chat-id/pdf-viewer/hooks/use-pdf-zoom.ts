import { useCallback, useEffect, useState } from 'react';

export function usePdfZoom({
  initialScale = 1.0,
  containerRef,
}: {
  initialScale?: number;
  containerRef: React.RefObject<HTMLDivElement>;
}) {
  // Internal scale state to handle fit-to-width
  const [internalScale, setInternalScale] = useState<number>(initialScale);
  const [renderScale] = useState<number>(1);  // Base render scale always 1
  
  // Add state to track zoom value for direct manipulation 
  const [zoom, setZoom] = useState(initialScale);
  
  // Width state based on container size
  const [containerWidth, setContainerWidth] = useState<number>(800);

  // Update internal scale when prop changes
  useEffect(() => {
    setInternalScale(initialScale);
  }, [initialScale]);
  
  // Calculate width based on container size
  const updateContainerWidth = useCallback(() => {
    if (containerRef.current) {
      // Set width to container width minus padding
      const width = containerRef.current.clientWidth - 40;
      setContainerWidth(width > 400 ? width : 800);
    }
  }, [containerRef]);
  
  useEffect(() => {
    // Initial update
    updateContainerWidth();
    
    // Update on resize with more frequent checks
    const resizeObserver = new ResizeObserver(() => {
      updateContainerWidth();
    });
    
    if (containerRef.current) {
      resizeObserver.observe(containerRef.current);
    }
    
    return () => {
      resizeObserver.disconnect();
    };
  }, [updateContainerWidth]);
  
  // Calculate fit-to-width scale
  const calculateFitToWidth = useCallback(() => {
    if (!containerRef.current) return internalScale;
    
    // Get the container width with some padding
    const containerWidth = containerRef.current.clientWidth - 40; // 20px padding on each side
    
    // Calculate scale to fit the PDF within the container width
    // This assumes a standard 8.5x11 PDF at 72 DPI which is roughly 612 points wide
    const standardPdfWidth = 612;
    return containerWidth / standardPdfWidth;
  }, [internalScale, containerRef]);
  
  // Update zoom when scale changes
  useEffect(() => {
    setZoom(internalScale);
  }, [internalScale]);
  
  // Apply fit-to-width
  const applyFitToWidth = useCallback(() => {
    const fitScale = calculateFitToWidth();
    setInternalScale(fitScale);
    return fitScale;
  }, [calculateFitToWidth]);
  
  // Handle zoom in/out operations
  const zoomIn = useCallback(() => {
    setInternalScale(prevScale => Math.min(3.0, prevScale + 0.1));
  }, []);
  
  const zoomOut = useCallback(() => {
    setInternalScale(prevScale => Math.max(0.5, prevScale - 0.1));
  }, []);
  
  return {
    internalScale,
    setInternalScale,
    renderScale,
    zoom,
    containerWidth,
    calculateFitToWidth,
    applyFitToWidth,
    zoomIn,
    zoomOut
  };
} 