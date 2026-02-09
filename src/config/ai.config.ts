/**
 * Configuration pour l'agent IA
 * Contient les paramètres pour Google Gemini via LangChain
 */
export const aiConfig = {
  apiKey: process.env.GOOGLE_API_KEY || '', // La clé API DOIT être configurée via GOOGLE_API_KEY
  modelName: process.env.GOOGLE_MODEL || 'gemini-2.5-flash-lite',
  temperature: Number(process.env.AI_TEMPERATURE) || 0.7,
  maxTokens: Number(process.env.AI_MAX_TOKENS) || 1000,
  timeout: Number(process.env.AI_TIMEOUT_MS) || 60000,
};
