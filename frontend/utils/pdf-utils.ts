/**
 * Simplified utils for frontend PDF handling
 * Note: Complex PDF parsing will be handled by the backend
 */

/**
 * Interface for PDF page content
 */
export interface PDFPageContent {
  pageNumber: number;
  text: string;
  title?: string;
}

/**
 * Interface for extracted PDF data
 */
export interface ExtractedPDFData {
  totalPages: number;
  extractedText: string;
  pageContents: PDFPageContent[];
}

/**
 * Estimate the number of pages in a PDF without fully parsing it
 * This is a fallback when full extraction isn't needed
 * @param fileSize Size of the PDF file in bytes
 * @returns Estimated number of pages
 */
export function estimatePDFPages(fileSize: number): number {
  // Very rough estimation based on average PDF page size
  // On average, a text-only PDF page is around 30-50KB
  const averagePageSizeBytes = 40000;
  return Math.max(1, Math.ceil(fileSize / averagePageSizeBytes));
}

/**
 * Create a data URL for a PDF file for preview
 * @param file PDF file
 * @returns Promise with data URL string
 */
export async function createPDFPreviewUrl(file: File): Promise<string> {
  return new Promise((resolve, reject) => {
    const reader = new FileReader();
    reader.onload = () => resolve(reader.result as string);
    reader.onerror = reject;
    reader.readAsDataURL(file);
  });
}

/**
 * Placeholder for extractPDFData that will be moved to the backend
 * This is just a temporary function that mimics the interface
 */
export async function extractPDFData(file: File): Promise<ExtractedPDFData> {
  // This is a stub function that just returns estimated data
  // In the real implementation, this would call a backend API
  console.warn('Using stub PDF extraction function - actual extraction will be done by backend');
  
  const estimatedPages = estimatePDFPages(file.size);
  
  return {
    totalPages: estimatedPages,
    extractedText: `[Text extraction moved to backend for ${file.name}]`,
    pageContents: Array.from({ length: estimatedPages }, (_, i) => ({
      pageNumber: i + 1,
      text: `[Content for page ${i + 1} will be extracted by backend]`,
      title: i === 0 ? file.name : undefined
    }))
  };
} 