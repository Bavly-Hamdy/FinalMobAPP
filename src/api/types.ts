
/**
 * Type definitions for Gemini API integration
 */

export interface GeminiApiConfig {
  apiKey: string;
  baseUrl: string;
  model: string;
}

export interface GeminiGenerationConfig {
  temperature?: number;
  topK?: number;
  topP?: number;
  maxOutputTokens?: number;
}

export interface GeminiPart {
  text: string;
}

export interface GeminiContent {
  parts: GeminiPart[];
}

export interface GeminiRequest {
  contents: GeminiContent[];
  generationConfig?: GeminiGenerationConfig;
}

export interface GeminiCandidate {
  content: GeminiContent;
  finishReason: string;
  index?: number;
  safetyRatings?: Array<{
    category: string;
    probability: string;
  }>;
}

export interface GeminiResponse {
  candidates: GeminiCandidate[];
  promptFeedback?: {
    safetyRatings?: Array<{
      category: string;
      probability: string;
    }>;
  };
}

export interface CacheEntry {
  response: string;
  timestamp: number;
}

export interface CacheStats {
  size: number;
  entries: Array<{
    query: string;
    timestamp?: number;
  }>;
}

export interface LanguageSegment {
  text: string;
  isArabic: boolean;
}

export type GeminiErrorType = 
  | 'NETWORK_ERROR'
  | 'API_KEY_MISSING'
  | 'RATE_LIMIT_EXCEEDED'
  | 'INVALID_REQUEST'
  | 'SERVER_ERROR'
  | 'UNKNOWN_ERROR';

export class GeminiError extends Error {
  public readonly type: GeminiErrorType;
  public readonly statusCode?: number;
  
  constructor(message: string, type: GeminiErrorType, statusCode?: number) {
    super(message);
    this.name = 'GeminiError';
    this.type = type;
    this.statusCode = statusCode;
  }
}
