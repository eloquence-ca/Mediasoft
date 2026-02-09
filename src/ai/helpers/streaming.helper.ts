/**
 * Helper pour le streaming des réponses IA
 * Version simplifiée sans dépendances Node.js
 */

import { retry } from "rxjs";
import { string } from "zod";

/**
 * Événements SSE possibles
 */
export enum SSEEventType {
  START = 'start',
  TOKEN = 'token',
  TOOL_CALL = 'tool_call',
  TOOL_RESULT = 'tool_result',
  COMPLETE = 'complete',
  ERROR = 'error',
}

/**
 * Données d'événement
 */
export interface SSEData {
  event: SSEEventType;
  data: any;
  timestamp: Date;
}

/**
 * Configuration du streaming
 */
export interface StreamingConfig {
  chunkDelay?: number;  // Délai entre les chunks en ms (défaut: 50)
}

/**
 * Valeurs par défaut
 */
const DEFAULT_CHUNK_DELAY = 50; // ms
const DEFAULT_RETRY_MS = 3000;

/**
 * Formate les données en format SSE string
 */
export function formatSSE(event: SSEEventType, data: any, id?: string): string {
  const lines: string[] = [];
  if (id) lines.push(`id: ${id}`);
  lines.push(`event: ${event}`);
  lines.push(`data: ${JSON.stringify(data)}`);
  return lines.join('\n') + '\n\n';
}

/**
 * Headers SSE standards
 */
export function getSSEHeaders(): Record<string, string> {
  return {
    'Content-Type': 'text/event-stream',
    'Cache-Control': 'no-cache',
    'Connection': 'keep-alive',
    'X-Accel-Buffering': 'no',
  };
}

/**
 * Handler pour gérer le streaming d'une réponse agent
 */
export class StreamingHandler {
  private chunks: string[] = [];
  private toolsCalled: Array<{ name: string; args: any }> = [];
  private startTime: number;
  private config: StreamingConfig;

  constructor(config: StreamingConfig = {}) {
    this.startTime = Date.now();
    this.config = {
      chunkDelay: config.chunkDelay ?? DEFAULT_CHUNK_DELAY,
    };
  }

  /**
   * Ajoute un token à la réponse
   */
  addToken(token: string): void {
    this.chunks.push(token);
  }

  /**
   * Enregistre un appel d'outil
   */
  addToolCall(toolName: string, args: any): void {
    this.toolsCalled.push({ name: toolName, args });
  }

  /**
   * Formate un événement
   */
  formatEvent(event: SSEEventType, data: any): SSEData {
    return {
      event,
      data,
      timestamp: new Date(),
    };
  }

  /**
   * Génère les événements de streaming
   */
  async *generateEvents(): AsyncGenerator<SSEData> {
    // Événement de début
    yield this.formatEvent(SSEEventType.START, {
      message: 'Début de la génération',
      toolsCount: this.toolsCalled.length,
    });

    // Événements pour chaque outil appelé
    for (const tool of this.toolsCalled) {
      yield this.formatEvent(SSEEventType.TOOL_CALL, {
        tool: tool.name,
        args: tool.args,
      });
    }

    // Émettre les tokens en chunks
    const fullResponse = this.chunks.join('');
    
    // Émettre en chunks de ~50 caractères
    const chunkSize = 50;
    for (let i = 0; i < fullResponse.length; i += chunkSize) {
      const chunk = fullResponse.slice(i, i + chunkSize);
      yield this.formatEvent(SSEEventType.TOKEN, {
        chunk,
        progress: Math.min(100, ((i + chunkSize) / fullResponse.length) * 100),
      });
      
      // Délai contrôlé
      await new Promise((resolve) => setTimeout(resolve, this.config.chunkDelay));
    }

    // Événement de fin
    const totalTime = Date.now() - this.startTime;
    yield this.formatEvent(SSEEventType.COMPLETE, {
      fullResponse,
      totalTime,
      toolsUsed: this.toolsCalled.map((t) => t.name),
    });
  }

  /**
   * Convertit les événements en format SSE string
   */
  async *generateSSEStrings(): AsyncGenerator<string> {
    let eventId = 0;
    for await (const event of this.generateEvents()) {
      yield formatSSE(event.event, event.data, String(++eventId));
    }
  }

  /**
   * Retourne la réponse complète
   */
  getFullResponse(): string {
    return this.chunks.join('');
  }

  /**
   * Retourne les outils utilisés
   */
  getToolsUsed(): string[] {
    return this.toolsCalled.map((t) => t.name);
  }

  /**
   * Retourne le temps total de génération
   */
  getTotalTime(): number {
    return Date.now() - this.startTime;
  }
}

/**
 * Interface pour l'agent avec support streaming
 */
export interface StreamingAgent {
  stream?: (input: any) => AsyncIterable<any>;
  invoke?: (input: any) => Promise<any>;
}

/**
 * Crée un handler pour streamer une réponse agent
 */
export async function createStreamingHandler(
  agent: StreamingAgent,
  message: string,
  config: StreamingConfig = {},
): Promise<StreamingHandler> {
  const handler = new StreamingHandler(config);

  try {
    if (agent.stream) {
      // Mode streaming
      const response = agent.stream({
        messages: [{ role: 'user', content: message }],
      });

      // Parser la réponse
      for await (const chunk of response) {
        const content = chunk?.content || chunk?.text || chunk?.output || JSON.stringify(chunk);
        if (content) {
          handler.addToken(content);
        }

        // Enregistrer les outils
        if (chunk?.tool_calls) {
          for (const toolCall of chunk.tool_calls) {
            handler.addToolCall(toolCall.name, toolCall.args);
          }
        }
      }
    } else if (agent.invoke) {
      // Mode classique (fallback)
      const result = await agent.invoke({
        messages: [{ role: 'user', content: message }],
      });
      
      // Extraire la réponse
      const content = result?.output || result?.content || JSON.stringify(result);
      if (content) {
        handler.addToken(content);
      }
    }
  } catch (error) {
    console.error('Erreur lors du streaming:', error);
  }

  return handler;
}

/**
 * Utilitaires SSE pour le contrôleur
 */
export const SSEUtils = {
  /**
   * Headers à ajouter à la réponse SSE
   */
  headers: {
    'Content-Type': 'text/event-stream',
    'Cache-Control': 'no-cache',
    'Connection': 'keep-alive',
    'X-Accel-Buffering': 'no',
  },

  /**
   * Formate un événement SSE
   */
  event(event: SSEEventType, data: any): string {
    return formatSSE(event, data);
  },

  /**
   * Formate un heartbeat (commentaire)
   */
  comment(message: string): string {
    return `: ${message}\n\n`;
  },

  /**
   * Formate le retry
   */
  retry(ms: number = DEFAULT_RETRY_MS): string {
    return `retry: ${ms}\n\n`;
  },
};
