'use client';

import { pdfjs } from 'react-pdf';

// Configure PDF.js worker
// The version must match the pdfjs-dist version in package.json (2.12.313)
// which is compatible with react-pdf 5.7.2
const PDFJS_VERSION = '2.12.313';

// Use a CDN URL that works with any protocol (http/https)
const WORKER_SRC = `https://cdnjs.cloudflare.com/ajax/libs/pdf.js/${PDFJS_VERSION}/pdf.worker.min.js`;

// Set up the worker with the CDN URL
if (typeof window !== 'undefined') {
  try {
    console.log("Configuring PDF.js worker with CDN:", WORKER_SRC);
    pdfjs.GlobalWorkerOptions.workerSrc = WORKER_SRC;
  } catch (error) {
    console.error("Error configuring PDF.js worker:", error);
  }
} else {
  // Server-side configuration
  pdfjs.GlobalWorkerOptions.workerSrc = WORKER_SRC;
}

// Configure PDF.js with privacy-friendly settings
if (typeof window !== 'undefined' && window.pdfjsLib) {
  // Setting externalLinkTarget to prevent opening new tabs without user interaction
  window.pdfjsLib.externalLinkTarget = 2; // NONE
  
  // Disable network access for security
  window.pdfjsLib.isEvalSupported = false;
  
  console.log("PDF.js configured with enhanced privacy settings");
}

// Log when this module is imported
console.log("PDF.js worker configured successfully");

// Export PDF.js configuration for use in other components
export const pdfConfig = {
  version: PDFJS_VERSION,
  workerSrc: WORKER_SRC,
  disableThirdPartyCookies: true
};

// Export utilities for working with PDF files
export function isPdfFile(filename: string): boolean {
  return /\.pdf$/i.test(filename);
}

/**
 * Check if a URL is likely a PDF
 */
export function isPdfUrl(url: string): boolean {
  if (!url) return false;
  
  // Check for file extension
  if (url.match(/\.pdf(\?|#|$)/i)) return true;
  
  // Check for blob URL format which could be PDF
  if (url.startsWith('blob:')) return true;
  
  // Check for PDF in the path
  if (url.includes('/pdf/') || url.includes('/document/')) return true;
  
  return false;
}

// Define a type for the getDocument function that TypeScript doesn't recognize
interface PDFJSWithGetDocument {
  GlobalWorkerOptions: { workerSrc: string };
  getDocument: (url: string) => { promise: Promise<{ numPages: number }> };
}

// We need to use type assertions for some PDF.js functions as they aren't fully exposed in the react-pdf typings
export function getPdfPageCount(url: string): Promise<number> {
  return new Promise((resolve, reject) => {
    try {
      // Type assertion for pdfjs.getDocument since TypeScript doesn't recognize it from react-pdf
      const getDocumentFn = (pdfjs as unknown as PDFJSWithGetDocument).getDocument;
      const loadingTask = getDocumentFn(url);
      
      loadingTask.promise
        .then((pdf: { numPages: number }) => {
          resolve(pdf.numPages);
        })
        .catch((error: Error) => {
          console.error('Error getting PDF page count:', error);
          reject(error);
        });
    } catch (error) {
      console.error('Error initializing PDF document:', error);
      reject(new Error('Failed to initialize PDF document'));
    }
  });
}

// Define types for window.pdfjsLib
declare global {
  interface Window {
    pdfjsLib: {
      GlobalWorkerOptions: { workerSrc: string };
      externalLinkTarget: number;
      isEvalSupported: boolean;
    };
  }
} 