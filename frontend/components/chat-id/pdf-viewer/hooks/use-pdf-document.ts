import { useCallback, useEffect, useRef, useState } from 'react';

export function usePdfDocument({
  url,
  onDocumentLoad,
}: {
  url: string;
  onDocumentLoad?: (numPages: number) => void;
}) {
  const [numPages, setNumPages] = useState<number | null>(null);
  const [isLoading, setIsLoading] = useState<boolean>(true);
  const [error, setError] = useState<string | null>(null);
  const [pdfLoaded, setPdfLoaded] = useState<boolean>(false);
  const [loadingTimeout, setLoadingTimeout] = useState<boolean>(false);
  
  // Refs for document loading state
  const initialRenderDone = useRef<boolean>(false);
  const documentLoadedRef = useRef<boolean>(false);
  const urlRef = useRef<string>(url);
  const loadingTimeoutRef = useRef<NodeJS.Timeout | null>(null);
  
  // Set loading timeout to prevent infinite loading
  useEffect(() => {
    if (isLoading && !loadingTimeout) {
      loadingTimeoutRef.current = setTimeout(() => {
        setLoadingTimeout(true);
      }, 10000); // 10 seconds timeout
    }
    
    return () => {
      if (loadingTimeoutRef.current) {
        clearTimeout(loadingTimeoutRef.current);
      }
    };
  }, [isLoading, loadingTimeout]);
  
  // Reset state when URL changes
  useEffect(() => {
    if (urlRef.current !== url) {
      urlRef.current = url;
      setNumPages(null);
      setIsLoading(true);
      setError(null);
      setPdfLoaded(false);
      initialRenderDone.current = false;
      documentLoadedRef.current = false;
    }
  }, [url]);
  
  // Document load handlers
  const handleDocumentLoadSuccess = useCallback(({ numPages: loadedPages }: { numPages: number }) => {
    // Prevent double loading which could cause the infinite loading loop
    if (documentLoadedRef.current) return;
    
    documentLoadedRef.current = true;
    setNumPages(loadedPages);
    setIsLoading(false);
    setError(null);
    setPdfLoaded(true);
    setLoadingTimeout(false);
    initialRenderDone.current = true;
    
    // Notify parent component
    if (onDocumentLoad) {
      onDocumentLoad(loadedPages);
    }
  }, [onDocumentLoad]);

  const handleDocumentLoadError = useCallback((err: Error) => {
    setIsLoading(false);
    setError(`Failed to load PDF: ${err.message}`);
    setPdfLoaded(false);
    setLoadingTimeout(false);
  }, []);
  
  return {
    numPages,
    isLoading,
    error,
    pdfLoaded,
    loadingTimeout,
    initialRenderDone,
    documentLoadedRef,
    urlRef,
    handleDocumentLoadSuccess,
    handleDocumentLoadError
  };
} 