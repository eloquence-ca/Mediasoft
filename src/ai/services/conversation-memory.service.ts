import { Injectable, Logger, OnModuleDestroy } from '@nestjs/common';
import Redis from 'ioredis';

/**
 * Interface pour un message de conversation
 */
export interface ConversationMessage {
  role: 'user' | 'assistant' | 'system';
  content: string;
  timestamp: number;
}

/**
 * Configuration de la mémoire de conversation
 */
export interface MemoryConfig {
  maxMessages: number; // Nombre max de messages à conserver
  maxTokens: number; // Limite de tokens (approximatif)
  sessionTimeout: number; // Timeout de session en secondes
}

/**
 * Service de gestion de la mémoire de conversation
 * Permet de maintenir le contexte entre les échanges utilisateur-IA
 */
@Injectable()
export class ConversationMemoryService implements OnModuleDestroy {
  private readonly logger = new Logger(ConversationMemoryService.name);
  private redis: Redis | null = null;
  private readonly MEMORY_PREFIX = 'ai:memory:';
  private readonly DEFAULT_CONFIG: MemoryConfig = {
    maxMessages: 20,
    maxTokens: 8000,
    sessionTimeout: 3600, // 1 heure
  };

  // Fallback store pour quand Redis n'est pas disponible
  private fallbackStore = new Map<string, ConversationMessage[]>();

  constructor() {
    this.initRedis();
  }

  private initRedis(): void {
    const redisHost = process.env.REDIS_HOST || 'localhost';
    const redisPort = Number(process.env.REDIS_PORT) || 6379;
    const redisPassword = process.env.REDIS_PASSWORD || undefined;

    try {
      this.redis = new Redis({
        host: redisHost,
        port: redisPort,
        password: redisPassword,
        lazyConnect: true,
      });

      this.redis.on('error', () => {
        this.redis = null;
      });

      this.redis.connect().catch(() => {
        this.redis = null;
      });
    } catch {
      this.redis = null;
    }
  }

  /**
   * Génère la clé de session pour un utilisateur
   */
  private getSessionKey(userId: string, tenantId: string, sessionId?: string): string {
    const session = sessionId || 'default';
    return `${this.MEMORY_PREFIX}${tenantId}:${userId}:${session}`;
  }

  /**
   * Récupère l'historique de conversation
   */
  async getHistory(
    userId: string,
    tenantId: string,
    sessionId?: string,
  ): Promise<ConversationMessage[]> {
    const key = this.getSessionKey(userId, tenantId, sessionId);

    try {
      if (this.redis) {
        const data = await this.redis.get(key);
        if (data) {
          return JSON.parse(data);
        }
      } else {
        // Fallback mémoire
        const messages = this.fallbackStore.get(key);
        if (messages) {
          return messages;
        }
      }
    } catch (error) {
      this.logger.warn('Erreur lors de la récupération de l\'historique', error.message);
    }

    return [];
  }

  /**
   * Ajoute un message à l'historique
   */
  async addMessage(
    userId: string,
    tenantId: string,
    message: Omit<ConversationMessage, 'timestamp'>,
    sessionId?: string,
    config?: Partial<MemoryConfig>,
  ): Promise<ConversationMessage> {
    const fullConfig = { ...this.DEFAULT_CONFIG, ...config };
    const key = this.getSessionKey(userId, tenantId, sessionId);
    const timestamp = Date.now();

    const newMessage: ConversationMessage = {
      ...message,
      timestamp,
    };

    try {
      let messages = await this.getHistory(userId, tenantId, sessionId);

      // Ajouter le nouveau message
      messages.push(newMessage);

      // Compter les tokens approximativement (1 mot ≈ 1.3 token)
      const estimatedTokens = this.estimateTokens(messages);

      // Tronquer si nécessaire
      while (
        messages.length > fullConfig.maxMessages ||
        estimatedTokens > fullConfig.maxTokens
      ) {
        // Supprimer les messages les plus anciens (garder le system prompt)
        const firstNonSystem = messages.findIndex((m) => m.role !== 'system');
        if (firstNonSystem > 0) {
          messages = messages.slice(firstNonSystem);
        } else if (messages.length > 1) {
          messages = messages.slice(1);
        } else {
          break;
        }
      }

      // Sauvegarder avec TTL
      if (this.redis) {
        await this.redis.setex(
          key,
          fullConfig.sessionTimeout,
          JSON.stringify(messages),
        );
      } else {
        this.fallbackStore.set(key, messages);
      }

      this.logger.debug(`${messages.length} messages en mémoire pour ${key}`);
      return newMessage;
    } catch (error) {
      this.logger.warn('Erreur lors de l\'ajout du message', error.message);
      return newMessage;
    }
  }

  /**
   * Formate l'historique pour l'agent IA
   */
  async getMessagesForAgent(
    userId: string,
    tenantId: string,
    sessionId?: string,
    systemPrompt?: string,
  ): Promise<{ messages: Array<{ role: string; content: string }> }> {
    const history = await this.getHistory(userId, tenantId, sessionId);

    const messages: Array<{ role: string; content: string }> = [];

    // Ajouter le system prompt en premier si fourni
    if (systemPrompt) {
      messages.push({ role: 'system', content: systemPrompt });
    }

    // Ajouter l'historique
    for (const msg of history) {
      messages.push({ role: msg.role, content: msg.content });
    }

    return { messages };
  }

  /**
   * Efface l'historique de conversation
   */
  async clearHistory(userId: string, tenantId: string, sessionId?: string): Promise<void> {
    const key = this.getSessionKey(userId, tenantId, sessionId);

    try {
      if (this.redis) {
        await this.redis.del(key);
      } else {
        this.fallbackStore.delete(key);
      }
      this.logger.debug(`Mémoire effacée pour ${key}`);
    } catch (error) {
      this.logger.warn('Erreur lors de l\'effacement de la mémoire', error.message);
    }
  }

  /**
   * Efface toutes les sessions d'un utilisateur
   */
  async clearAllUserSessions(userId: string, tenantId: string): Promise<void> {
    const pattern = `${this.MEMORY_PREFIX}${tenantId}:${userId}:*`;

    try {
      if (this.redis) {
        const keys = await this.redis.keys(pattern);
        if (keys.length > 0) {
          await this.redis.del(...keys);
        }
      } else {
        // Nettoyer le fallback store
        for (const key of this.fallbackStore.keys()) {
          if (key.startsWith(`${this.MEMORY_PREFIX}${tenantId}:${userId}:`)) {
            this.fallbackStore.delete(key);
          }
        }
      }
    } catch (error) {
      this.logger.warn('Erreur lors de l\'effacement des sessions', error.message);
    }
  }

  /**
   * Met à jour la configuration de mémoire
   */
  async updateConfig(
    userId: string,
    tenantId: string,
    config: Partial<MemoryConfig>,
    sessionId?: string,
  ): Promise<void> {
    const key = this.getSessionKey(userId, tenantId, sessionId);
    const sessionTimeout = config.sessionTimeout || this.DEFAULT_CONFIG.sessionTimeout;

    try {
      if (this.redis) {
        await this.redis.expire(key, sessionTimeout);
      } else {
        const messages = this.fallbackStore.get(key);
        if (messages) {
          this.fallbackStore.set(key, messages);
        }
      }
    } catch (error) {
      this.logger.warn('Erreur lors de la mise à jour de la config', error.message);
    }
  }

  /**
   * Estimate token count (approximation)
   */
  private estimateTokens(messages: ConversationMessage[]): number {
    const totalWords = messages.reduce((sum, msg) => {
      return sum + msg.content.split(/\s+/).length;
    }, 0);
    return Math.ceil(totalWords * 0.75); // Approximation
  }

  /**
   * Nettoyage des sessions expirées
   */
  async cleanup(): Promise<number> {
    let cleaned = 0;

    try {
      if (this.redis) {
        const pattern = `${this.MEMORY_PREFIX}*`;
        const keys = await this.redis.keys(pattern);

        for (const key of keys) {
          const ttl = await this.redis.ttl(key);
          if (ttl <= 0) {
            await this.redis.del(key);
            cleaned++;
          }
        }
      }
    } catch (error) {
      this.logger.warn('Erreur lors du cleanup', error.message);
    }

    return cleaned;
  }

  async onModuleDestroy(): Promise<void> {
    if (this.redis) {
      await this.redis.quit();
    }
  }
}
