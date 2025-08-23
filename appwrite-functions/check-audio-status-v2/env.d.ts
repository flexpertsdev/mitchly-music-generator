/**
 * Environment variable types for Check Audio Status V2 Function
 */
declare namespace NodeJS {
  interface ProcessEnv {
    /** Mureka API key for checking status */
    MUREKA_API_KEY: string;
    
    /** Appwrite API key (optional, can be passed via headers) */
    APPWRITE_FUNCTION_API_KEY?: string;
    
    /** Appwrite project ID (auto-injected by Appwrite) */
    APPWRITE_FUNCTION_PROJECT_ID: string;
    
    /** Appwrite API endpoint (defaults to cloud.appwrite.io) */
    APPWRITE_FUNCTION_API_ENDPOINT?: string;
  }
}

/**
 * Request body for POST /
 */
export interface CheckAudioStatusRequest {
  /** Mureka task ID to check status for */
  taskId: string;
  
  /** Optional: Song document ID to auto-update when complete */
  songId?: string;
}

/**
 * Response from POST /
 */
export interface CheckAudioStatusResponse {
  /** Whether the operation succeeded */
  success: boolean;
  
  /** Task ID that was checked */
  taskId?: string;
  
  /** Current status of the task */
  status?: AudioGenerationStatus;
  
  /** Progress percentage (0-100) */
  progress?: number;
  
  /** Audio URL if completed */
  audioUrl?: string | null;
  
  /** Audio duration in seconds if completed */
  duration?: number | null;
  
  /** Error message if failed or request error */
  error?: string | null;
}

/**
 * Audio generation status values
 */
export type AudioGenerationStatus = 
  | 'pending'      // Task is queued
  | 'processing'   // Audio is being generated
  | 'completed'    // Audio generation successful
  | 'failed';      // Generation failed

/**
 * Song status enum values (for database updates)
 */
export type SongStatus = 
  | 'pending'
  | 'generating_lyrics'
  | 'lyrics_complete'
  | 'lyrics_failed'
  | 'generating_audio'
  | 'audio_processing'
  | 'audio_complete'
  | 'audio_failed';

/**
 * Song document schema (partial - only fields we update)
 */
export interface SongDocument {
  /** Document ID */
  $id: string;
  
  /** URL of generated audio */
  audioUrl?: string;
  
  /** Audio duration in seconds */
  audioDuration?: number;
  
  /** Current processing status */
  status: SongStatus;
  
  /** ISO timestamp when audio generation completed */
  audioGenerationCompletedAt?: string;
}

/**
 * Mureka API status response
 */
export interface MurekaStatusResponse {
  /** Task ID */
  task_id?: string;
  
  /** Current status */
  status?: string;
  
  /** Progress percentage */
  progress?: number;
  
  /** Audio URL (various possible field names) */
  audio_url?: string;
  
  /** Result object (alternative response format) */
  result?: {
    audio_url?: string;
    duration?: number;
  };
  
  /** Audio duration */
  duration?: number;
  
  /** Error message */
  error?: string;
}

/**
 * Normalized status response
 */
export interface NormalizedStatus {
  /** Task ID */
  taskId: string;
  
  /** Normalized status */
  status: AudioGenerationStatus;
  
  /** Progress percentage (0-100) */
  progress: number;
  
  /** Audio URL if available */
  audioUrl: string | null;
  
  /** Duration in seconds if available */
  duration: number | null;
  
  /** Error message if failed */
  error: string | null;
}

/**
 * Function context from Appwrite
 */
export interface FunctionContext {
  req: {
    method: 'GET' | 'POST';
    headers: Record<string, string>;
    bodyJson?: CheckAudioStatusRequest;
  };
  res: {
    json: (data: any, statusCode?: number) => void;
    text: (data: string, statusCode?: number, headers?: Record<string, string>) => void;
  };
  log: (message: string) => void;
  error: (message: string) => void;
}

/**
 * Polling configuration
 */
export interface PollingConfig {
  /** Interval between checks in milliseconds */
  interval: number;
  
  /** Maximum number of attempts */
  maxAttempts: number;
  
  /** Total timeout in milliseconds */
  timeout: number;
}

/**
 * Recommended polling intervals based on progress
 */
export const POLLING_INTERVALS: Record<string, number> = {
  INITIAL: 10000,    // 10 seconds for 0-20%
  ACTIVE: 5000,      // 5 seconds for 21-80%
  FINAL: 3000,       // 3 seconds for 81-99%
  DEFAULT: 5000      // Default 5 seconds
};