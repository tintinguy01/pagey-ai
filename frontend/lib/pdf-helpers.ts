'use client';

/**
 * PDF Helper Utilities
 * Collection of utility functions for working with PDF files
 */

/**
 * Check if a URL points to a PDF file
 * @param url URL to check
 * @returns boolean indicating if this is a PDF URL
 */
export function isPdfUrl(url: string): boolean {
  if (!url) return false;
  
  // Check for PDF extension or content type
  return url.toLowerCase().endsWith('.pdf') || 
         url.toLowerCase().includes('pdf') ||
         url.startsWith('blob:') || // Assume blob URLs are PDFs in this context
         url.includes('application/pdf');
}

/**
 * Create a blob URL from a PDF URL
 * @param url PDF file URL
 * @returns Promise resolving to a blob URL
 */
export async function createBlobUrl(url: string): Promise<string> {
  try {
    const response = await fetch(url);
    if (!response.ok) {
      throw new Error(`Failed to fetch PDF: ${response.statusText}`);
    }
    
    const blob = await response.blob();
    return URL.createObjectURL(blob);
  } catch (error) {
    console.error('Error creating blob URL:', error);
    // Return the original URL as fallback
    return url;
  }
}

/**
 * Create a URL with proper parameters for PDF.js viewer
 * @param url PDF file URL
 * @returns URL formatted for PDF.js viewer
 */
export function createPdfViewerUrl(url: string): string {
  if (!url) return '';
  
  // If already a blob URL, return as is
  if (url.startsWith('blob:')) {
    return url;
  }
  
  // Otherwise, return the URL directly
  return url;
}

/**
 * Add hash parameters to a PDF URL for controlling the viewer
 * @param url PDF URL
 * @param pageParam Name of the page parameter (default: 'page')
 * @param page Page number (default: 1)
 * @param zoom Zoom level (default: 100)
 * @returns URL with hash parameters
 */
export function createCleanPdfUrl(
  url: string, 
  pageParam: string = 'page', 
  page: number = 1, 
  zoom: number = 100
): string {
  if (!url) return '';
  
  // Strip any existing hash
  const baseUrl = url.split('#')[0];
  
  // Add hash parameters
  const hashParams = [
    `${pageParam}=${page}`,
    'toolbar=0',
    'navpanes=0',
    'statusbar=0',
    'view=Fit',
    `zoom=${zoom}`,
    'pagemode=none'
  ].join('&');
  
  return `${baseUrl}#${hashParams}`;
}

/**
 * Safely creates a download link for a PDF file
 */
export function createPdfDownloadUrl(pdfUrl: string, filename: string): string {
  const url = new URL(pdfUrl);
  
  // Add download attribute with filename
  url.searchParams.append('download', filename);
  
  return url.toString();
}

/**
 * Calculates approximate page count for PDFs where actual page count is unknown
 * This is a fallback for when we can't get the actual page count
 */
export function estimatePageCount(fileSize: number): number {
  // Very rough estimation: avg PDF page ~100KB
  const estimatedPages = Math.ceil(fileSize / 100000);
  return Math.max(1, Math.min(estimatedPages, 1000)); // Between 1-1000 pages
}

/**
 * Generate CSS transform properties for focusing on specific parts of the PDF
 * This is useful for zooming in on particular sections
 */
export function getPdfViewportStyle(options: {
  scale?: number;
  offsetX?: number;
  offsetY?: number;
  fitToPage?: boolean;
} = {}): React.CSSProperties {
  const { 
    scale = 1, 
    offsetX = 0, 
    offsetY = 0,
    fitToPage = true
  } = options;
  
  const transform = scale !== 1 || offsetX !== 0 || offsetY !== 0 
    ? `scale(${scale}) translateX(${offsetX}%) translateY(${offsetY}%)`
    : 'none';
  
  return {
    transform,
    transformOrigin: 'center center',
    width: '100%',
    height: '100%',
    border: 'none',
    overflow: fitToPage ? 'hidden' : 'auto',
    maxHeight: '100%',
    display: 'block',
    backgroundColor: 'transparent'
  };
} 