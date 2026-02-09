/**
 * Helper pour extraire la réponse de l'agent LangChain
 * Centralise la logique d'extraction pour un code plus propre
 */

interface LangChainResponse {
  output?: string;
  content?: string;
  messages?: Array<{
    content?: string | Array<any> | object;
    text?: string;
    [key: string]: any;
  }>;
  [key: string]: any;
}

/**
 * Extrait le contenu textuel d'un message LangChain
 */
function extractContentFromMessage(message: any): string {
  if (!message) return '';

  // Cas 1: Contenu direct (string)
  if (typeof message.content === 'string') {
    return message.content;
  }

  // Cas 2: Contenu en tableau
  if (Array.isArray(message.content)) {
    return message.content
      .map((item: any) => {
        if (typeof item === 'string') return item;
        if (item?.text) return item.text;
        if (item?.type === 'text' && item?.text) return item.text;
        return '';
      })
      .filter((text: string) => text.trim().length > 0)
      .join('\n');
  }

  // Cas 3: Contenu en objet
  if (typeof message.content === 'object' && message.content !== null) {
    return (
      message.content.text ||
      message.content.content ||
      JSON.stringify(message.content)
    );
  }

  // Cas 4: Propriété text directe
  if (message.text) {
    return message.text;
  }

  return '';
}

/**
 * Extrait la réponse de l'agent LangChain
 * Gère tous les formats possibles de réponse
 */
export function extractAgentResponse(response: LangChainResponse): string {
  // Méthode 1: Propriété output directe
  if (response.output && typeof response.output === 'string') {
    return response.output;
  }

  // Méthode 2: Propriété content directe
  if (response.content && typeof response.content === 'string') {
    return response.content;
  }

  // Méthode 3: Extraire du dernier message
  if (response.messages && Array.isArray(response.messages) && response.messages.length > 0) {
    // Chercher le dernier message de type AI (réponse de l'agent)
    for (let i = response.messages.length - 1; i >= 0; i--) {
      const message = response.messages[i];
      const content = extractContentFromMessage(message);
      if (content.trim().length > 0) {
        return content;
      }
    }
  }

  // Méthode 4: Chercher dans les propriétés communes
  const possibleKeys = ['answer', 'response', 'text', 'message', 'result'];
  for (const key of possibleKeys) {
    if (response[key] && typeof response[key] === 'string') {
      return response[key];
    }
  }

  // Aucune réponse trouvée
  return '';
}

