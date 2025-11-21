/**
 * Environment validation utilities
 */

// Required environment variables for the voice assistant
export const REQUIRED_ENV_VARS = {
  LIVEKIT_URL: 'NEXT_PUBLIC_LIVEKIT_URL',
  ASSISTANT_ENABLED: 'NEXT_PUBLIC_ASSISTANT_ENABLED',
  SUPABASE_URL: 'NEXT_PUBLIC_SUPABASE_URL',
  SUPABASE_ANON_KEY: 'NEXT_PUBLIC_SUPABASE_ANON_KEY',
};

// Server-side environment variables
export const SERVER_ENV_VARS = {
  LIVEKIT_API_KEY: 'LIVEKIT_API_KEY',
  LIVEKIT_API_SECRET: 'LIVEKIT_API_SECRET',
  GROQ_API_KEY: 'GROQ_API_KEY',
  DEEPGRAM_API_KEY: 'DEEPGRAM_API_KEY',
  OPENAI_API_KEY: 'OPENAI_API_KEY',
};

/**
 * Validate client-side environment variables
 * @returns {Object} - { isValid: boolean, missingVars: string[] }
 */
export function validateClientEnv() {
  if (typeof window === 'undefined') {
    return { isValid: true, missingVars: [] }; // Skip validation on server
  }

  // For client-side validation, we need to check if the variables are properly exposed
  const envVars = {
    NEXT_PUBLIC_LIVEKIT_URL: process.env.NEXT_PUBLIC_LIVEKIT_URL,
    NEXT_PUBLIC_ASSISTANT_ENABLED: process.env.NEXT_PUBLIC_ASSISTANT_ENABLED,
    NEXT_PUBLIC_SUPABASE_URL: process.env.NEXT_PUBLIC_SUPABASE_URL,
    NEXT_PUBLIC_SUPABASE_ANON_KEY: process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY,
  };

  const missingVars = Object.entries(envVars)
    .filter(([key, value]) => !value || value.trim() === '')
    .map(([key]) => key);

  return {
    isValid: missingVars.length === 0,
    missingVars,
  };
}

/**
 * Validate server-side environment variables
 * @returns {Object} - { isValid: boolean, missingVars: string[] }
 */
export function validateServerEnv() {
  const missingVars = Object.values(SERVER_ENV_VARS).filter(
    varName => !process.env[varName]
  );

  return {
    isValid: missingVars.length === 0,
    missingVars,
  };
}

/**
 * Get environment variables with fallback values
 */
export function getEnvVars() {
  return {
    livekitUrl: process.env.NEXT_PUBLIC_LIVEKIT_URL || '',
    assistantEnabled: process.env.NEXT_PUBLIC_ASSISTANT_ENABLED === 'true',
    supabaseUrl: process.env.NEXT_PUBLIC_SUPABASE_URL || '',
    supabaseAnonKey: process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY || '',
  };
}

/**
 * Check if voice assistant is properly configured
 */
export function isVoiceAssistantConfigured() {
  const validation = validateClientEnv();
  const env = getEnvVars();

  return validation.isValid && env.assistantEnabled && env.livekitUrl;
}