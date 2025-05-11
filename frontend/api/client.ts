/**
 * API client for the PDFChat backend
 */

import { config } from '../config';

// Set API base URL from config
const API_BASE_URL = config.api.baseUrl;

// Default fetch options to handle CORS and redirects
const DEFAULT_FETCH_OPTIONS: RequestInit = {
  credentials: 'include',
  redirect: 'follow',
  headers: {
    'Content-Type': 'application/json',
    'Accept': 'application/json',
  }
};

// Types from the backend
export interface PageContent {
  page_number: number;
  text: string;
  title?: string;
}

export interface ExtractedPDFData {
  total_pages: number;
  extracted_text: string;
  page_contents: PageContent[];
}

export interface Source {
  file: string; // PDF file name
  page: number;
  /**
   * The actual highlighted text from the PDF (can be multiple lines/paragraphs).
   * This should NOT be the PDF name.
   */
  highlight: string;
  line_start?: number;
  line_end?: number;
  content?: string;
}

export interface Message {
  id: number;
  chat_id: number;
  content: string;
  role: string;
  timestamp: string;
  sources: Source[];
}

export interface Document {
  id: number;
  chat_id: number;
  name: string;
  size: number;
  pages: number;
  upload_date: string;
  user_id: string;
  content_type?: string;
  file_url?: string;
}

export interface Chat {
  id: number;
  title: string;
  user_id: string;
  document_count: number;
  message_count: number;
  is_archived: boolean;
  last_active: string;
  preview: string;
  created_at: string;
}

export interface ChatDetail extends Chat {
  documents: Document[];
  messages: Message[];
}

export interface ChatRequest {
  message: string;
  chat_id: number;
}

export interface ChatResponse {
  id: number;
  content: string;
  role: string;
  sources?: Source[];
}

// Define Analytics types
export interface AnalyticsData {
  overview: {
    total_chats: number;
    total_pdfs: number;
    active_time_minutes: number;
    messages_sent: number;
    messages_received: number;
  };
  daily_usage: {
    dates: string[];
    minutes: number[];
    chats: number[];
    pdfs: number[];
    messages: number[];
  };
}

// API Client Functions

// Helper for better error handling
async function handleApiResponse<T>(response: Response, errorPrefix: string): Promise<T> {
  if (!response.ok) {
    let errorMsg = `${errorPrefix}: ${response.status} ${response.statusText}`;
    try {
      // Try to get the detailed error message from response
      const errorData = await response.json();
      if (errorData.detail) {
        errorMsg += ` - ${errorData.detail}`;
      }
    } catch (e) {
      // If response isn't JSON, continue with basic error
      console.error("Error parsing error response:", e);
    }
    throw new Error(errorMsg);
  }
  return response.json();
}

// Chats
export async function getChats(userId: string, includeArchived?: boolean): Promise<Chat[]> {
  try {
    let url = `${API_BASE_URL}/api/chats?user_id=${encodeURIComponent(userId)}`;
    if (includeArchived) url += "&include_archived=true";
    
    console.log('Fetching chats from URL:', url);
    const response = await fetch(url, DEFAULT_FETCH_OPTIONS);
    return handleApiResponse(response, "Failed to fetch chats");
  } catch (error) {
    console.error("Error fetching chats:", error);
    throw error;
  }
}

export async function createChat(title: string, userId: string): Promise<Chat> {
  try {
    console.log(`Creating chat "${title}" for user ${userId}`);
    const response = await fetch(`${API_BASE_URL}/api/chats`, {
      method: 'POST',
      ...DEFAULT_FETCH_OPTIONS,
      body: JSON.stringify({ title, user_id: userId }),
    });
    
    return handleApiResponse(response, "Failed to create chat");
  } catch (error) {
    console.error("Error creating chat:", error);
    throw error;
  }
}

export async function getChat(chatId: number): Promise<ChatDetail> {
  try {
    console.log(`Fetching chat ${chatId}`);
    const response = await fetch(`${API_BASE_URL}/api/chats/${chatId}`, DEFAULT_FETCH_OPTIONS);
    return handleApiResponse(response, "Failed to fetch chat");
  } catch (error) {
    console.error(`Error fetching chat ${chatId}:`, error);
    throw error;
  }
}

export async function updateChat(chatId: number, title?: string, isArchived?: boolean): Promise<Chat> {
  const body: Record<string, string | boolean> = {};
  if (title !== undefined) body.title = title;
  if (isArchived !== undefined) body.is_archived = isArchived;
  const response = await fetch(`${API_BASE_URL}/api/chats/${chatId}`, {
    method: 'PUT',
    ...DEFAULT_FETCH_OPTIONS,
    body: JSON.stringify(body),
  });
  if (!response.ok) {
    throw new Error(`Failed to update chat: ${response.statusText}`);
  }
  return response.json();
}

export async function deleteChat(chatId: number): Promise<void> {
  const response = await fetch(`${API_BASE_URL}/api/chats/${chatId}`, {
    method: 'DELETE',
    ...DEFAULT_FETCH_OPTIONS,
  });
  
  if (!response.ok) {
    throw new Error(`Failed to delete chat: ${response.statusText}`);
  }
}

// Documents
export async function getDocuments(chatId?: number, userId?: string): Promise<Document[]> {
  const params = new URLSearchParams();
  if (chatId) params.append('chat_id', String(chatId));
  if (userId) params.append('user_id', userId);
  
  const response = await fetch(`${API_BASE_URL}/api/documents?${params.toString()}`, DEFAULT_FETCH_OPTIONS);
  if (!response.ok) {
    throw new Error(`Failed to fetch documents: ${response.statusText}`);
  }
  return response.json();
}

export async function uploadDocument(file: File, chatId: number, userId: string): Promise<Document> {
  // NOTE: After calling this, always refetch documents for the chat to ensure the UI is up to date.
  try {
    const formData = new FormData();
    formData.append('file', file);
    formData.append('chat_id', chatId.toString());
    formData.append('user_id', userId);
    
    // For file uploads, we need to omit the Content-Type header
    // as the browser will set it automatically with the boundary
    const { headers, ...restOptions } = DEFAULT_FETCH_OPTIONS;
    // Use Object.fromEntries to rebuild headers without Content-Type
    const headerEntries = Object.entries(headers || {})
      .filter(([key]) => key.toLowerCase() !== 'content-type');
    const filteredHeaders = Object.fromEntries(headerEntries);
    
    const response = await fetch(`${API_BASE_URL}/api/documents`, {
      method: 'POST',
      ...restOptions,
      headers: filteredHeaders,
      body: formData,
    });
    
    return handleApiResponse(response, "Failed to upload document");
  } catch (error) {
    console.error("Error uploading document:", error);
    throw error;
  }
}

export async function getDocument(documentId: number): Promise<Document> {
  const response = await fetch(`${API_BASE_URL}/api/documents/${documentId}`, DEFAULT_FETCH_OPTIONS);
  if (!response.ok) {
    throw new Error(`Failed to fetch document: ${response.statusText}`);
  }
  return response.json();
}

export async function deleteDocument(documentId: number): Promise<void> {
  const response = await fetch(`${API_BASE_URL}/api/documents/${documentId}`, {
    method: 'DELETE',
    ...DEFAULT_FETCH_OPTIONS,
  });
  
  if (!response.ok) {
    throw new Error(`Failed to delete document: ${response.statusText}`);
  }
}

// Messages
export async function getMessages(chatId: number): Promise<Message[]> {
  const response = await fetch(`${API_BASE_URL}/api/messages?chat_id=${chatId}`, DEFAULT_FETCH_OPTIONS);
  if (!response.ok) {
    throw new Error(`Failed to fetch messages: ${response.statusText}`);
  }
  return response.json();
}

export async function sendMessage(chatId: number, content: string): Promise<Message> {
  // NOTE: After calling this, always refetch messages for the chat to ensure the UI is up to date.
  const response = await fetch(`${API_BASE_URL}/api/messages`, {
    method: 'POST',
    ...DEFAULT_FETCH_OPTIONS,
    body: JSON.stringify({
      chat_id: chatId,
      content: content,
      role: 'user'
    }),
  });
  
  if (!response.ok) {
    throw new Error(`Failed to send message: ${response.statusText}`);
  }
  
  return response.json();
}

// Chat with AI
export async function chatWithAI(chatId: number, message: string): Promise<ChatResponse> {
  try {
    console.log(`Sending message to AI for chat ${chatId}`);
    const response = await fetch(`${API_BASE_URL}/api/chats/${chatId}/conversation`, {
      method: 'POST',
      ...DEFAULT_FETCH_OPTIONS,
      body: JSON.stringify({
        chat_id: chatId,
        message: message
      }),
    });
    
    return handleApiResponse(response, "Failed to chat with AI");
  } catch (error) {
    console.error("Error chatting with AI:", error);
    throw error;
  }
}

// PDF Extraction
export async function extractPDFData(file: File): Promise<ExtractedPDFData> {
  try {
    const formData = new FormData();
    formData.append('file', file);
    
    // For file uploads, we need to omit the Content-Type header
    const { headers, ...restOptions } = DEFAULT_FETCH_OPTIONS;
    // Use Object.fromEntries to rebuild headers without Content-Type
    const headerEntries = Object.entries(headers || {})
      .filter(([key]) => key.toLowerCase() !== 'content-type');
    const filteredHeaders = Object.fromEntries(headerEntries);
    
    const response = await fetch(`${API_BASE_URL}/api/extract-pdf`, {
      method: 'POST',
      ...restOptions,
      headers: filteredHeaders,
      body: formData,
    });
    
    return handleApiResponse(response, "Failed to extract PDF data");
  } catch (error) {
    console.error("Error extracting PDF data:", error);
    throw error;
  }
}

// Analytics
export async function getUserAnalytics(userId: string): Promise<AnalyticsData> {
  try {
    console.log(`Getting analytics for user ${userId}`);
    const response = await fetch(`${API_BASE_URL}/api/analytics/${encodeURIComponent(userId)}`, DEFAULT_FETCH_OPTIONS);
    return handleApiResponse(response, "Failed to get user analytics");
  } catch (error) {
    console.error("Error getting user analytics:", error);
    throw error;
  }
} 