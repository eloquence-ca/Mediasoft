/**
 * Configuration pour l'agent IA
 * Contient les paramètres pour Google Gemini via LangChain
 */
export const aiConfig = {
  apiKey: process.env.GOOGLE_API_KEY || 'AIzaSyASN6WxKkIKcpe4yeeM_L3W81LA4uBdR4A',
  modelName: process.env.GOOGLE_MODEL || 'gemini-2.5-flash-lite',
  temperature: 0.7, // Contrôle la créativité (0 = déterministe, 1 = créatif)
  maxTokens: 1000, // Nombre maximum de tokens dans la réponse
};

