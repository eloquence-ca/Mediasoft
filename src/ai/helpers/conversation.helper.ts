/**
 * Helper pour l'historique de conversation (Conversation Context)
 * Permet de maintenir le contexte entre les requêtes utilisateur
 */

import { Injectable, Inject } from '@nestjs/common';

/**
 * Type d'un message dans l'historique
 */
export interface ConversationMessage {
  role: 'user' | 'assistant' | 'system';
  content: string;
  timestamp: Date;
  toolCalls?: Array<{
    name: string;
    args: any;
    result?: string;
  }>;
}

/**
 * Une conversation
 */
export interface Conversation {
  id: string;
  userId: string;
  tenantId: string;
  messages: ConversationMessage[];
  createdAt: Date;
  updatedAt: Date;
  metadata?: {
    title?: string;
    tags?: string[];
  };
}

/**
 * Options de configuration
 */
export interface ConversationConfig {
  maxMessages?: number;     // Nombre max de messages conservés (défaut: 20)
  maxTokens?: number;      // Limite de tokens approximative (défaut: 8000)
  systemPromptPrefix?: boolean; // Inclure le system prompt (défaut: true)
  ttlHours?: number;       // TTL de la conversation en heures (défaut: 24)
}

/**
 * Résultat de la limitation
 */
export interface TrimmedConversation {
  trimmed: boolean;
  removedCount: number;
  keptMessages: number;
}

/**
 * Valeurs par défaut
 */
const DEFAULT_MAX_MESSAGES = 20;
const DEFAULT_MAX_TOKENS = 8000;
const DEFAULT_TTL_HOURS = 24;

/**
 * Store interface pour persister les conversations
 */
export interface ConversationStore {
  get(userId: string, tenantId: string, conversationId: string): Promise<Conversation | null>;
  save(conversation: Conversation): Promise<void>;
  delete(userId: string, tenantId: string, conversationId: string): Promise<void>;
  list(userId: string, tenantId: string): Promise<Conversation[]>;
}

/**
 * Implémentation In-Memory (pour développement/test)
 * À remplacer par Redis ou BDD en production
 */
@Injectable()
export class InMemoryConversationStore implements ConversationStore {
  private conversations: Map<string, Conversation> = new Map();

  async get(userId: string, tenantId: string, conversationId: string): Promise<Conversation | null> {
    const key = this.getKey(userId, tenantId, conversationId);
    return this.conversations.get(key) || null;
  }

  async save(conversation: Conversation): Promise<void> {
    const key = this.getKey(conversation.userId, conversation.tenantId, conversation.id);
    this.conversations.set(key, conversation);
  }

  async delete(userId: string, tenantId: string, conversationId: string): Promise<void> {
    const key = this.getKey(userId, tenantId, conversationId);
    this.conversations.delete(key);
  }

  async list(userId: string, tenantId: string): Promise<Conversation[]> {
    const prefix = `${userId}:${tenantId}:`;
    const result: Conversation[] = [];
    
    for (const [key, conversation] of this.conversations.entries()) {
      if (key.startsWith(prefix)) {
        result.push(conversation);
      }
    }
    
    return result.sort((a, b) => 
      new Date(b.updatedAt).getTime() - new Date(a.updatedAt).getTime()
    );
  }

  private getKey(userId: string, tenantId: string, conversationId: string): string {
    return `${userId}:${tenantId}:${conversationId}`;
  }
}

/**
 * Service de gestion des conversations
 */
@Injectable()
export class ConversationService {
  private store: ConversationStore;
  private config: Required<ConversationConfig>;

  constructor(
    store?: ConversationStore,
    config?: ConversationConfig,
  ) {
    this.store = store || new InMemoryConversationStore();
    this.config = {
      maxMessages: config?.maxMessages ?? DEFAULT_MAX_MESSAGES,
      maxTokens: config?.maxTokens ?? DEFAULT_MAX_TOKENS,
      systemPromptPrefix: config?.systemPromptPrefix ?? true,
      ttlHours: config?.ttlHours ?? DEFAULT_TTL_HOURS,
    };
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
      createdAt: new Date(),
      updatedAt: new Date(),
      metadata: title ? { title } : undefined,
    };

    await this.store.save(conversation);
    return conversation;
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
    const conversation = await this.getConversation(conversationId, userId, tenantId);
    
    const message: ConversationMessage = {
      role: 'user',
      content,
      timestamp: new Date(),
    };

    conversation.messages.push(message);
    conversation.updatedAt = new Date();

    // Limiter la taille si nécessaire
    await this.trimConversation(conversation);

    await this.store.save(conversation);
    return message;
  }

  /**
   * Ajoute un message de l'assistant
   */
  async addAssistantMessage(
    conversationId: string,
    userId: string,
    tenantId: string,
    content: string,
    toolCalls?: Array<{ name: string; args: any; result?: string }>,
  ): Promise<ConversationMessage> {
    const conversation = await this.getConversation(conversationId, userId, tenantId);
    
    const message: ConversationMessage = {
      role: 'assistant',
      content,
      timestamp: new Date(),
      toolCalls,
    };

    conversation.messages.push(message);
    conversation.updatedAt = new Date();

    await this.store.save(conversation);
    return message;
  }

  /**
   * Récupère une conversation
   */
  async getConversation(
    conversationId: string,
    userId: string,
    tenantId: string,
  ): Promise<Conversation> {
    const conversation = await this.store.get(userId, tenantId, conversationId);
    
    if (!conversation) {
      throw new Error(`Conversation ${conversationId} non trouvée`);
    }

    return conversation;
  }

  /**
   * Formate l'historique pour l'agent IA
   */
  formatHistory(conversation: Conversation): Array<{ role: string; content: string }> {
    const result: Array<{ role: string; content: string }> = [];

    // Ajouter le system prompt au début si configuré
    if (this.config.systemPromptPrefix && conversation.messages.length === 0) {
      // Le system prompt sera ajouté par l'agent lui-même
    }

    // Ajouter les messages
    for (const msg of conversation.messages) {
      result.push({
        role: msg.role,
        content: msg.content,
      });
    }

    return result;
  }

  /**
   * Tronque la conversation si nécessaire
   */
  private async trimConversation(conversation: Conversation): Promise<TrimmedConversation> {
    const messages = conversation.messages;
    let trimmed = false;
    let removedCount = 0;

    // Par nombre de messages
    if (messages.length > this.config.maxMessages) {
      const keepCount = Math.floor(this.config.maxMessages * 0.7); // Garder les 70% les plus récents
      const toRemove = messages.length - keepCount;
      
      // Supprimer les messages les plus anciens (en gardant system si présent)
      let removed = 0;
      while (removed < toRemove && messages.length > 1) {
        const firstUserMsg = messages.findIndex(m => m.role === 'user');
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

    return {
      trimmed,
      removedCount,
      keptMessages: messages.length,
    };
  }

  /**
   * Liste les conversations d'un utilisateur
   */
  async listConversations(
    userId: string,
    tenantId: string,
  ): Promise<Conversation[]> {
    return this.store.list(userId, tenantId);
  }

  /**
   * Supprime une conversation
   */
  async deleteConversation(
    conversationId: string,
    userId: string,
    tenantId: string,
  ): Promise<void> {
    await this.store.delete(userId, tenantId, conversationId);
  }

  /**
   * Génère un ID unique
   */
  private generateId(): string {
    return `conv_${Date.now()}_${Math.random().toString(36).substring(2, 9)}`;
  }

  /**
   * Estime le nombre de tokens (approximatif)
   */
  static estimateTokens(text: string): number {
    // Approximation: 1 token ≈ 4 caractères en moyenne pour le français
    return Math.ceil(text.length / 4);
  }

  /**
   * Formate pour le system prompt avec contexte
   */
  static buildSystemContext(
    conversationHistory: Array<{ role: string; content: string }>,
    systemPrompt: string,
  ): string {
    const contextLines: string[] = [
      systemPrompt,
      '',
      '=== HISTORIQUE DE LA CONVERSATION ===',
    ];

    for (const msg of conversationHistory.slice(-10)) { // Derniers 10 messages
      contextLines.push(`[${msg.role.toUpperCase()}]: ${msg.content.substring(0, 500)}`);
    }

    contextLines.push('=== FIN DE L\'HISTORIQUE ===');

    return contextLines.join('\n');
  }
}
