/**
 * Environment variable type definitions for get-spotify-dna function
 */

declare global {
  namespace NodeJS {
    interface ProcessEnv {
      // Required
      ANTHROPIC_API_KEY: string;
      
      // Optional
      FAL_API_KEY?: string;
      SPOTIFY_CLIENT_ID?: string;
      SPOTIFY_CLIENT_SECRET?: string;
      
      // Database configuration (optional with defaults)
      APPWRITE_DATABASE_ID?: string;
      USER_PROFILES_COLLECTION?: string;
      BAND_CONCEPTS_COLLECTION?: string;
      
      // Auto-injected by Appwrite
      APPWRITE_FUNCTION_API_ENDPOINT: string;
      APPWRITE_FUNCTION_PROJECT_ID: string;
      APPWRITE_FUNCTION_ID: string;
      APPWRITE_FUNCTION_API_KEY?: string;
      APPWRITE_FUNCTION_JWT?: string;
      APPWRITE_FUNCTION_TRIGGER?: string;
      APPWRITE_FUNCTION_DATA?: string;
      APPWRITE_FUNCTION_USER_ID?: string;
      APPWRITE_FUNCTION_EVENT?: string;
      APPWRITE_FUNCTION_EVENT_DATA?: string;
      APPWRITE_FUNCTION_RUNTIME_NAME?: string;
      APPWRITE_FUNCTION_RUNTIME_VERSION?: string;
      APPWRITE_FUNCTION_PATH?: string;
      APPWRITE_FUNCTION_HEADERS?: string;
    }
  }
}

export {};