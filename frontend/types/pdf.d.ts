/**
 * Type declarations for PDF.js
 */

interface PDFDocumentProxy {
  numPages: number;
  getPage(pageNumber: number): Promise<PDFPageProxy>;
  destroy(): void;
}

interface PDFPageProxy {
  getViewport(options: { scale: number; rotation?: number }): PDFPageViewport;
  render(options: {
    canvasContext: CanvasRenderingContext2D;
    viewport: PDFPageViewport;
  }): PDFRenderTask;
}

interface PDFPageViewport {
  width: number;
  height: number;
}

interface PDFRenderTask {
  promise: Promise<void>;
}

interface PDFLoadingTask {
  promise: Promise<PDFDocumentProxy>;
  destroy?: () => void;
}

interface PDFJSStatic {
  getDocument(url: string): PDFLoadingTask;
}

// Extend Window interface
declare global {
  interface Window {
    pdfjsLib: PDFJSStatic;
  }
}

declare module 'pdfjs-dist/build/pdf.worker.entry' {
  const worker: any;
  export default worker;
}

export {}; 