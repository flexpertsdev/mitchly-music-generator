/**
 * Environment variable types for Generate Lyrics V2 Function
 */
declare namespace NodeJS {
  interface ProcessEnv {
    /** Anthropic API key for Claude AI */
    ANTHROPIC_API_KEY: string;
    
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
export interface GenerateLyricsRequest {
  /** Song document ID to generate lyrics for */
  songId: string;
}

/**
 * Response from POST /
 */
export interface GenerateLyricsResponse {
  /** Whether the operation succeeded */
  success: boolean;
  
  /** Song document ID */
  songId?: string;
  
  /** Success message */
  message?: string;
  
  /** Preview of generated lyrics (first 100 chars) */
  preview?: string;
  
  /** Indicates if song already has lyrics */
  hasLyrics?: boolean;
  
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
  lyrics?: string;
  
  /** Brief description for AI music generation */
  songDescription?: string;
  
  /** Current processing status */
  status: SongStatus;
  
  /** Error message if generation failed */
  generationError?: string;
  
  /** Track number in album */
  trackNumber?: number;
  
  /** Song theme or description */
  description?: string;
  
  /** AI generation instructions */
  aiInstructions?: string;
  
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
  
  /** Musical influences */
  influences: string[];
  
  /** Core sound description */
  coreSound: string;
  
  /** Lyrical themes */
  lyricalThemes: string[];
  
  /** Vocal style information */
  vocalStyle?: {
    type: string;
    description?: string;
  };
  
  /** Album concept */
  albumConcept?: {
    title: string;
    description: string;
    narrative?: string;
  };
  
  /** Band-specific AI instructions */
  bandAiInstructions?: string;
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
 * Generated lyrics result from AI
 */
export interface GeneratedLyrics {
  /** Brief song description for AI music platforms (<100 chars) */
  songDescription: string;
  
  /** Complete lyrics with section markers */
  lyrics: string;
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
    bodyJson?: GenerateLyricsRequest | DatabaseEventPayload;
  };
  res: {
    json: (data: any, statusCode?: number) => void;
    text: (data: string, statusCode?: number, headers?: Record<string, string>) => void;
  };
  log: (message: string) => void;
  error: (message: string) => void;
}