/**
 * Environment variable types for Generate Audio V2 Function
 */
declare namespace NodeJS {
  interface ProcessEnv {
    /** Mureka API key for audio generation */
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
export interface GenerateAudioRequest {
  /** Song document ID to generate audio for */
  songId: string;
  
  /** Optional: Wait for completion (max 30 seconds) */
  waitForCompletion?: boolean;
}

/**
 * Response from POST / (immediate)
 */
export interface GenerateAudioResponse {
  /** Whether the operation succeeded */
  success: boolean;
  
  /** Song document ID */
  songId?: string;
  
  /** Success/status message */
  message?: string;
  
  /** Mureka task ID for tracking */
  taskId?: string;
  
  /** Current status */
  status?: 'processing' | 'completed' | 'failed';
  
  /** Audio URL if completed */
  audioUrl?: string;
  
  /** Audio duration in seconds */
  duration?: number;
  
  /** Indicates if song already has audio */
  hasAudio?: boolean;
  
  /** Error message if failed */
  error?: string;
}

/**
 * Song status enum values
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
 * Song document schema (partial)
 */
export interface SongDocument {
  /** Document ID */
  $id: string;
  
  /** Song title */
  title: string;
  
  /** Complete lyrics with sections */
  lyrics: string;
  
  /** Brief description for AI music generation */
  songDescription?: string;
  
  /** URL of generated audio */
  audioUrl?: string;
  
  /** Audio duration in seconds */
  audioDuration?: number;
  
  /** Mureka task ID for tracking */
  audioGenerationTaskId?: string;
  
  /** Current processing status */
  status: SongStatus;
  
  /** Error message if generation failed */
  generationError?: string;
  
  /** ISO timestamp when audio generation started */
  audioGenerationStartedAt?: string;
  
  /** ISO timestamp when audio generation completed */
  audioGenerationCompletedAt?: string;
  
  /** Artist/band description for context */
  artistDescription?: string;
  
  /** Reference to band document */
  bandId?: string;
  
  /** Reference to album document */
  albumId?: string;
}

/**
 * Band profile data structure
 */
export interface BandProfile {
  /** Band name */
  bandName: string;
  
  /** Primary music genre */
  primaryGenre: string;
  
  /** Core sound description */
  coreSound: string;
  
  /** Musical influences */
  influences?: string[];
  
  /** AI description of the band */
  aiDescription?: string;
}

/**
 * Band document schema (partial)
 */
export interface BandDocument {
  /** Document ID */
  $id: string;
  
  /** Band name */
  bandName: string;
  
  /** Primary genre */
  primaryGenre: string;
  
  /** JSON string of complete band profile */
  profileData: string | BandProfile;
}

/**
 * Mureka API generation parameters
 */
export interface MurekaGenerationParams {
  /** Song title */
  title: string;
  
  /** Complete lyrics */
  lyrics: string;
  
  /** Song description for AI */
  description: string;
  
  /** Artist/band description */
  artist_description: string;
  
  /** Music genre */
  genre: string;
  
  /** Musical style */
  style: string;
  
  /** Model to use */
  model: 'mureka-v1' | 'mureka-v2';
  
  /** Audio quality */
  quality: 'low' | 'medium' | 'high';
}

/**
 * Mureka API response
 */
export interface MurekaResponse {
  /** Whether generation started successfully */
  success: boolean;
  
  /** Task ID for tracking */
  taskId: string;
  
  /** Current status */
  status: 'processing';
}

/**
 * Mureka status response
 */
export interface MurekaStatusResponse {
  /** Task ID */
  taskId: string;
  
  /** Current status */
  status: 'pending' | 'processing' | 'completed' | 'failed';
  
  /** Progress percentage (0-100) */
  progress: number;
  
  /** Audio URL if completed */
  audioUrl?: string;
  
  /** Audio duration in seconds */
  duration?: number;
  
  /** Error message if failed */
  error?: string;
}

/**
 * Database event trigger payload
 */
export interface DatabaseEventPayload extends SongDocument {
  /** Indicates this is a database event */
  $id: string;
}

/**
 * Function context from Appwrite
 */
export interface FunctionContext {
  req: {
    method: 'GET' | 'POST';
    headers: Record<string, string>;
    bodyJson?: GenerateAudioRequest | DatabaseEventPayload;
  };
  res: {
    json: (data: any, statusCode?: number) => void;
    text: (data: string, statusCode?: number, headers?: Record<string, string>) => void;
  };
  log: (message: string) => void;
  error: (message: string) => void;
}