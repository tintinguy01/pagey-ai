/**
 * Application configuration
 */

export const config = {
  // API configuration
  api: {
    baseUrl: process.env.NEXT_PUBLIC_API_URL || 'http://localhost:8000',
  },
  
  // Feature flags
  features: {
    enableAI: true,
    enableFilePreviews: true,
  },
  
  // Limits
  limits: {
    maxFileSize: 50 * 1024 * 1024, // 50MB
    maxFilesPerChat: 10,
  }
}; 