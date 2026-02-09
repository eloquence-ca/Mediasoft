/**
 * Service de Mémoire de Conversation avec support Redis
 * Gère l'historique des conversations pour maintenir le contexte
 */

import Redis from 'ioredis';

export interface ConversationMessage {
  role: 'user' | 'assistant' | 'system';
  content: string;
  timestamp: number;
  toolCalls?: Array<{
    name: string;
    args: any;
    result?: string;
  }>;
}

export interface Conversation {
  id: string;
  userId: string;
  tenantId: string;
  messages: ConversationMessage[];
  createdAt: number;
  updatedAt: number;
  metadata?: {
    title?: string;
    tags?: string[];
  };
}

export interface ConversationConfig {
  maxMessages: number;
  maxTokens: number;
  ttlHours: number;
  keyPrefix?: string;
}

export interface TrimmedConversationResult {
  trimmed: boolean;
  removedCount: number;
  keptMessages: number;
}

export class ConversationMemoryService {
  private client: Redis;
  private readonly config: Required<ConversationConfig>;
  private readonly keyPrefix: string;

  constructor(config?: Partial<ConversationConfig>) {
    this.client = new Redis({
      host: process.env.REDIS_HOST || 'localhost',
      port: Number(process.env.REDIS_PORT) || 6379,
      password: process.env.REDIS_PASSWORD,
      db: 0,
      retryStrategy: (times: number) => {
        const delay = Math.min(times * 50, 2000);
        return delay;
      },
    });

    this.config = {
      maxMessages: config?.maxMessages || 20,
      maxTokens: config?.maxTokens || 8000,
      ttlHours: config?.ttlHours || 24,
      keyPrefix: config?.keyPrefix || 'ai:conversation:',
    };

    this.keyPrefix = this.config.keyPrefix;

    this.client.on('error', (err) => {
      console.error('Redis ConversationMemory Error:', err);
    });
  }

  /**
   * Génère une clé de conversation
   */
  private getConversationKey(userId: string, tenantId: string, conversationId: string): string {
    return `${this.keyPrefix}${userId}:${tenantId}:${conversationId}`;
  }

  /**
   * Génère une clé pour l'index des conversations d'un utilisateur
   */
  private getUserIndexKey(userId: string, tenantId: string): string {
    return `${this.keyPrefix}index:${userId}:${tenantId}`;
  }

  /**
   * Crée une nouvelle conversation
   */
  async createConversation(
    userId: string,
    tenantId: string,
    title?: string,
  ): Promise<Conversation> {
    const conversation: Conversation = {
      id: this.generateId(),
      userId,
      tenantId,
      messages: [],
      createdAt: Date.now(),
      updatedAt: Date.now(),
      metadata: title ? { title } : undefined,
    };

    const key = this.getConversationKey(userId, tenantId, conversation.id);
    
    await this.client.setex(
      key,
      this.config.ttlHours * 3600,
      JSON.stringify(conversation),
    );

    // Ajouter à l'index utilisateur
    const indexKey = this.getUserIndexKey(userId, tenantId);
    await this.client.zadd(indexKey, conversation.updatedAt, conversation.id);
    await this.client.expire(indexKey, this.config.ttlHours * 3600);

    return conversation;
  }

  /**
   * Récupère une conversation
   */
  async getConversation(
    userId: string,
    tenantId: string,
    conversationId: string,
  ): Promise<Conversation | null> {
    const key = this.getConversationKey(userId, tenantId, conversationId);
    const data = await this.client.get(key);

    if (!data) return null;

    try {
      return JSON.parse(data) as Conversation;
    } catch {
      return null;
    }
  }

  /**
   * Ajoute un message à une conversation
   */
  async addMessage(
    conversationId: string,
    userId: string,
    tenantId: string,
    role: 'user' | 'assistant' | 'system',
    content: string,
    toolCalls?: Array<{ name: string; args: any; result?: string }>,
  ): Promise<ConversationMessage> {
    const conversation = await this.getConversation(userId, tenantId, conversationId);
    
    if (!conversation) {
      throw new Error(`Conversation ${conversationId} not found`);
    }

    const message: ConversationMessage = {
      role,
      content,
      timestamp: Date.now(),
      toolCalls,
    };

    conversation.messages.push(message);
    conversation.updatedAt = Date.now();

    // Limiter la taille de la conversation
    const trimmed = await this.trimConversation(conversation);

    // Sauvegarder
    const key = this.getConversationKey(userId, tenantId, conversationId);
    await this.client.setex(
      key,
      this.config.ttlHours * 3600,
      JSON.stringify(conversation),
    );

    // Mettre à jour l'index
    const indexKey = this.getUserIndexKey(userId, tenantId);
    await this.client.zadd(indexKey, conversation.updatedAt, conversationId);

    return message;
  }

  /**
   * Ajoute un message utilisateur
   */
  async addUserMessage(
    conversationId: string,
    userId: string,
    tenantId: string,
    content: string,
  ): Promise<ConversationMessage> {
    return this.addMessage(conversationId, userId, tenantId, 'user', content);
  }

  /**
   * Ajoute un message assistant
   */
  async addAssistantMessage(
    conversationId: string,
    userId: string,
    tenantId: string,
    content: string,
    toolCalls?: Array<{ name: string; args: any; result?: string }>,
  ): Promise<ConversationMessage> {
    return this.addMessage(conversationId, userId, tenantId, 'assistant', content, toolCalls);
  }

  /**
   * Tronque la conversation si nécessaire
   */
  private async trimConversation(conversation: Conversation): Promise<TrimmedConversationResult> {
    const messages = conversation.messages;
    let trimmed = false;
    let removedCount = 0;

    // Par nombre de messages
    if (messages.length > this.config.maxMessages) {
      const keepCount = Math.floor(this.config.maxMessages * 0.7);
      const toRemove = messages.length - keepCount;

      let removed = 0;
      while (removed < toRemove && messages.length > 1) {
        const firstUserMsg = messages.findIndex((m) => m.role === 'user');
        if (firstUserMsg > 0) {
          messages.splice(firstUserMsg, 1);
          removed++;
        } else {
          break;
        }
      }

      removedCount = removed;
      trimmed = true;
    }

    // Par tokens estimés
    const totalTokens = this.estimateTotalTokens(conversation);
    if (totalTokens > this.config.maxTokens) {
      // Supprimer les messages les plus anciens jusqu'à atteindre la limite
      while (totalTokens - this.estimateMessageTokens(messages[0]) > this.config.maxTokens && messages.length > 1) {
        const firstUserMsg = messages.findIndex((m) => m.role === 'user');
        if (firstUserMsg >= 0) {
          messages.splice(firstUserMsg, 1);
          removedCount++;
        } else {
          break;
        }
      }
      trimmed = true;
    }

    return {
      trimmed,
      removedCount,
      keptMessages: messages.length,
    };
  }

  /**
   * Estime le nombre de tokens pour un message
   */
  private estimateMessageTokens(message: ConversationMessage): number {
    return Math.ceil((message.content.length + JSON.stringify(message.toolCalls || '').length) / 4);
  }

  /**
   * Estime le nombre total de tokens
   */
  private estimateTotalTokens(conversation: Conversation): number {
    return conversation.messages.reduce((total, msg) => {
      return total + this.estimateMessageTokens(msg);
    }, 0);
  }

  /**
   * Formate l'historique pour l'agent IA
   */
  formatHistory(conversation: Conversation): Array<{ role: string; content: string }> {
    return conversation.messages.map((msg) => ({
      role: msg.role,
      content: msg.content,
    }));
  }

  /**
   * Liste les conversations d'un utilisateur
   */
  async listConversations(
    userId: string,
    tenantId: string,
    limit: number = 10,
  ): Promise<Conversation[]> {
    const indexKey = this.getUserIndexKey(userId, tenantId);
    const conversationIds = await this.client.zrevrange(
      indexKey,
      0,
      limit - 1,
    );

    const conversations: Conversation[] = [];
    for (const id of conversationIds) {
      const conversation = await this.getConversation(userId, tenantId, id);
      if (conversation) {
        conversations.push(conversation);
      }
    }

    return conversations;
  }

  /**
   * Supprime une conversation
   */
  async deleteConversation(
    userId: string,
    tenantId: string,
    conversationId: string,
  ): Promise<void> {
    const key = this.getConversationKey(userId, tenantId, conversationId);
    await this.client.del(key);

    // Retirer de l'index
    const indexKey = this.getUserIndexKey(userId, tenantId);
    await this.client.zrem(indexKey, conversationId);
  }

  /**
   * Supprime toutes les conversations d'un utilisateur
   */
  async deleteAllUserConversations(
    userId: string,
    tenantId: string,
  ): Promise<number> {
    const indexKey = this.getUserIndexKey(userId, tenantId);
    const conversationIds = await this.client.zrange(indexKey, 0, -1);

    let deletedCount = 0;
    for (const id of conversationIds) {
      await this.deleteConversation(userId, tenantId, id);
      deletedCount++;
    }

    await this.client.del(indexKey);
    return deletedCount;
  }

  /**
   * Génère un ID unique
   */
  private generateId(): string {
    return `conv_${Date.now()}_${Math.random().toString(36).substring(2, 9)}`;
  }

  /**
   * Ferme la connexion Redis
   */
  async close(): Promise<void> {
    await this.client.quit();
  }
}

// Configuration par défaut
export const defaultConversationConfig: ConversationConfig = {
  maxMessages: 20,
  maxTokens: 8000,
  ttlHours: 24,
  keyPrefix: 'ai:conversation:',
};

// Singleton instance
let conversationMemoryInstance: ConversationMemoryService | null = null;

export function getConversationMemoryService(): ConversationMemoryService {
  if (!conversationMemoryInstance) {
    conversationMemoryInstance = new ConversationMemoryService();
  }
  return conversationMemoryInstance;
}

export default ConversationMemoryService;
