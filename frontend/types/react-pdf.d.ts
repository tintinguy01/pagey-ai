declare module 'react-pdf' {
  import { ComponentType, ReactNode } from 'react';

  export interface PDFOptions {
    cMapUrl?: string;
    cMapPacked?: boolean;
    standardFontDataUrl?: string;
    canvasBackground?: string;
    renderInteractiveForms?: boolean;
    enableXfa?: boolean;
    [key: string]: unknown;
  }

  export const Document: ComponentType<{
    file: string | { url: string } | { data: Uint8Array };
    onLoadSuccess?: (pdf: { numPages: number }) => void;
    onLoadError?: (error: Error) => void;
    loading?: ReactNode;
    error?: ReactNode;
    options?: PDFOptions;
    externalLinkTarget?: string;
    children?: ReactNode;
  }>;

  export const Page: ComponentType<{
    pageNumber: number;
    width?: number;
    height?: number;
    scale?: number;
    renderTextLayer?: boolean;
    renderAnnotationLayer?: boolean;
    canvasBackground?: string;
    error?: ReactNode;
    loading?: ReactNode;
    className?: string;
  }>;

  export const pdfjs: {
    GlobalWorkerOptions: {
      workerSrc: string;
    };
    version: string;
  };
} 