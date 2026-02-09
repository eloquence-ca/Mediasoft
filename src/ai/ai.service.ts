import { Injectable, Logger } from '@nestjs/common';
import { CustomerService } from '../customer/customer.service';
import { CatalogService } from '../catalog/catalog.service';
import { CatalogMergeService } from '../catalog/catalog-merge.service';
import { CatalogLayerService } from '../catalog/catalog-layer.service';
import { CompanyService } from '../company/company.service';
import { DocumentService } from '../document/document.service';
import { DocumentTypeService } from '../document/document-type.service';
import { UserService } from '../user/user.service';
import { TvaRateService } from '../tva-rate/tva-rate.service';
import { createGrappeTools } from './tools/grappe-tools';
import { SYSTEM_PROMPT } from './prompts/system-prompt';
import { aiConfig } from '../config/ai.config';
import { extractAgentResponse } from './helpers/response-extractor.helper';
import { ChatResponseDto } from './dto/chat-response.dto';
import { z } from 'zod';

/**
 * Type pour l'agent LangChain
 * Représente un agent capable d'invoquer des outils
 */
export type LangChainAgent = {
  invoke: (input: { messages: Array<{ role: string; content: string }> }) => Promise<any>;
  stream?: (input: { messages: Array<{ role: string; content: string }> }) => AsyncIterable<any>;
};

/**
 * Type pour la réponse de l'agent
 */
export type AgentResponse = {
  output?: string;
  messages?: Array<any>;
};

/**
 * Interface pour le cache d'agent
 */
interface CachedAgent {
  agent: LangChainAgent;
  createdAt: Date;
  lastUsedAt: Date;
}

/**
 * Interface pour les métadonnées de requête
 */
interface RequestMetadata {
  userId: string;
  tenantId: string;
  messageLength: number;
  timestamp: Date;
}

/**
 * Rate limit entry
 */
interface RateLimitEntry {
  count: number;
  resetAt: number;
}

/**
 * Service pour l'agent IA
 * Utilise LangChain avec Google Gemini pour répondre aux questions en langage naturel
 */
@Injectable()
export class AiService {
  private readonly logger = new Logger(AiService.name);

  // Cache d'agent par tenant (singleton pattern)
  private agentCache: Map<string, CachedAgent> = new Map();
  
  // Rate limiting par utilisateur
  private rateLimitCache: Map<string, RateLimitEntry> = new Map();
  
  // Configuration rate limiting
  private readonly RATE_LIMIT_MAX_REQUESTS = 10;
  private readonly RATE_LIMIT_WINDOW_MS = 60 * 1000; // 1 minute
  private readonly AGENT_CACHE_TTL_MS = 5 * 60 * 1000; // 5 minutes

  constructor(
    private readonly customerService: CustomerService,
    private readonly catalogService: CatalogService,
    private readonly catalogMergeService: CatalogMergeService,
    private readonly catalogLayerService: CatalogLayerService,
    private readonly companyService: CompanyService,
    private readonly documentService: DocumentService,
    private readonly userService: UserService,
    private readonly tvaRateService: TvaRateService,
    private readonly documentTypeService: DocumentTypeService,
  ) {
    // Nettoyer le cache périodiquement
    this.startCacheCleanup();
  }

  /**
   * Nettoie périodiquement le cache expiré
   */
  private startCacheCleanup(): void {
    setInterval(() => {
      this.cleanupAgentCache();
      this.cleanupRateLimitCache();
    }, 60000); // Chaque minute
  }

  /**
   * Nettoie les agents expirés du cache
   */
  private cleanupAgentCache(): void {
    const now = Date.now();
    let cleaned = 0;
    for (const [key, entry] of this.agentCache.entries()) {
      if (now - entry.lastUsedAt.getTime() > this.AGENT_CACHE_TTL_MS) {
        this.agentCache.delete(key);
        cleaned++;
      }
    }
    if (cleaned > 0) {
      this.logger.log(`Nettoyé ${cleaned} agents expirés du cache`);
    }
  }

  /**
   * Nettoie les entrées rate limiting expirées
   */
  private cleanupRateLimitCache(): void {
    const now = Date.now();
    let cleaned = 0;
    for (const [key, entry] of this.rateLimitCache.entries()) {
      if (now > entry.resetAt) {
        this.rateLimitCache.delete(key);
        cleaned++;
      }
    }
  }

  /**
   * Vérifie et met à jour le rate limiting pour un utilisateur
   */
  private checkRateLimit(userId: string): { allowed: boolean; remaining: number; resetAt: number } {
    const now = Date.now();
    const key = userId;
    const entry = this.rateLimitCache.get(key);

    if (!entry || now > entry.resetAt) {
      // Nouvelle fenêtre de rate limiting
      this.rateLimitCache.set(key, {
        count: 1,
        resetAt: now + this.RATE_LIMIT_WINDOW_MS,
      });
      return {
        allowed: true,
        remaining: this.RATE_LIMIT_MAX_REQUESTS - 1,
        resetAt: now + this.RATE_LIMIT_WINDOW_MS,
      };
    }

    if (entry.count >= this.RATE_LIMIT_MAX_REQUESTS) {
      return {
        allowed: false,
        remaining: 0,
        resetAt: entry.resetAt,
      };
    }

    entry.count++;
    return {
      allowed: true,
      remaining: this.RATE_LIMIT_MAX_REQUESTS - entry.count,
      resetAt: entry.resetAt,
    };
  }

  /**
   * Récupère ou crée l'agent IA (avec cache)
   */
  private async getOrCreateAgent(userId: string, tenantId: string): Promise<LangChainAgent | null> {
    const cacheKey = `${tenantId}`; // L'agent est partagé par tenant

    // Vérifier si un agent existe dans le cache
    const cached = this.agentCache.get(cacheKey);
    if (cached) {
      // Mettre à jour lastUsedAt
      cached.lastUsedAt = new Date();
      this.logger.debug(`Agent trouvé dans le cache pour le tenant ${tenantId}`);
      return cached.agent;
    }

    // Créer un nouvel agent
    this.logger.log(`Création d'un nouvel agent pour le tenant ${tenantId}`);
    const agent = await this.initializeAgent(userId, tenantId);

    if (agent) {
      this.agentCache.set(cacheKey, {
        agent,
        createdAt: new Date(),
        lastUsedAt: new Date(),
      });
      this.logger.log(`Agent ajouté au cache pour le tenant ${tenantId}. Cache size: ${this.agentCache.size}`);
    }

    return agent;
  }

  /**
   * Enregistre les métadonnées de la requête
   */
  private logRequest(
    message: string,
    userId: string,
    tenantId: string,
    processingTime: number,
    success: boolean,
    errorMessage?: string,
  ): void {
    const metadata: RequestMetadata = {
      userId,
      tenantId,
      messageLength: message.length,
      timestamp: new Date(),
    };

    if (success) {
      this.logger.log(
        `[AI Chat] Success - User: ${userId}, Tenant: ${tenantId}, ` +
        `Message length: ${metadata.messageLength} chars, ` +
        `Processing time: ${processingTime}ms`,
      );
    } else {
      this.logger.warn(
        `[AI Chat] Failed - User: ${userId}, Tenant: ${tenantId}, ` +
        `Error: ${errorMessage}, ` +
        `Processing time: ${processingTime}ms`,
      );
    }
  }

  /**
   * Initialise l'agent IA avec LangChain pour un utilisateur spécifique
   */
  private async initializeAgent(userId: string, tenantId: string): Promise<LangChainAgent | null> {
    try {
      // Vérifier que la clé API Google est configurée
      if (!aiConfig.apiKey) {
        this.logger.error(
          'GOOGLE_API_KEY n\'est pas configurée. Veuillez configurer la variable d\'environnement GOOGLE_API_KEY.',
        );
        throw new Error('Configuration error: GOOGLE_API_KEY is required for AI features');
      }

      // Import dynamique pour éviter les erreurs si les dépendances ne sont pas installées
      let ChatGoogleGenerativeAI: new (config: any) => any;
      let createAgent: (config: { model: any; tools: any[]; systemPrompt: string; responseFormat: any }) => LangChainAgent;

      try {
        // @ts-ignore - Import dynamique pour éviter les erreurs TypeScript si les modules ne sont pas installés
        const googleGenaiModule = await import('@langchain/google-genai');
        ChatGoogleGenerativeAI = googleGenaiModule.ChatGoogleGenerativeAI;

        // @ts-ignore - Import dynamique pour éviter les erreurs TypeScript
        const langchainModule = await import('langchain');
        // @ts-ignore
        createAgent = langchainModule.createAgent;
      } catch (importError: any) {
        this.logger.error(
          'Impossible d\'importer les modules LangChain. Vérifiez que les dépendances sont installées.',
          importError?.message || importError,
        );
        return null;
      }

      // Initialiser le modèle Google Gemini
      const model = new ChatGoogleGenerativeAI({
        model: aiConfig.modelName,
        apiKey: aiConfig.apiKey,
        temperature: aiConfig.temperature,
        maxOutputTokens: aiConfig.maxTokens,
      });

      // Créer les outils avec userId et tenantId
      const tools = createGrappeTools(
        this.customerService,
        this.catalogService,
        this.catalogMergeService,
        this.catalogLayerService,
        this.companyService,
        this.documentService,
        this.userService,
        this.tvaRateService,
        this.documentTypeService,
        tenantId,
        userId,
      );

      // Créer l'agent avec la nouvelle API createAgent
      // @ts-ignore
      const agent = createAgent({
        model,
        tools,
        systemPrompt: SYSTEM_PROMPT,
        responseFormat: z.any(),
      });

      return agent;
    } catch (error: any) {
      this.logger.error(
        `Erreur lors de l'initialisation de l'agent IA: ${error?.message || 'Erreur inconnue'}`,
        error?.stack,
      );
      return null;
    }
  }

  /**
   * Méthode principale pour le chat avec l'agent IA
   * Retourne une réponse structurée et typée pour le client
   */
  async chat(
    message: string,
    userId: string,
    tenantId: string,
  ): Promise<ChatResponseDto> {
    const startTime = Date.now();

    try {
      // Validation de base
      if (!message || typeof message !== 'string' || message.trim().length === 0) {
        this.logRequest(message, userId, tenantId, Date.now() - startTime, false, 'Message vide');
        return {
          success: false,
          error: 'Le message ne peut pas être vide',
          timestamp: new Date(),
        };
      }

      // Validation des paramètres
      if (!userId || !tenantId) {
        this.logRequest(message, userId, tenantId, Date.now() - startTime, false, 'Paramètres utilisateur manquants');
        return {
          success: false,
          error: 'Paramètres utilisateur manquants',
          timestamp: new Date(),
        };
      }

      // Vérifier le rate limiting
      const rateLimit = this.checkRateLimit(userId);
      if (!rateLimit.allowed) {
        const resetAt = new Date(rateLimit.resetAt);
        this.logger.warn(`Rate limit atteint pour l'utilisateur ${userId}`);
        this.logRequest(message, userId, tenantId, Date.now() - startTime, false, 'Rate limit atteint');
        return {
          success: false,
          error: `Limite de requêtes atteinte. Veuillez réessayer après ${resetAt.toLocaleTimeString()}.`,
          timestamp: new Date(),
        };
      }

      // Récupérer ou créer l'agent (avec cache)
      const agent = await this.getOrCreateAgent(userId, tenantId);

      if (!agent) {
        this.logRequest(message, userId, tenantId, Date.now() - startTime, false, 'Agent non initialisé');
        return {
          success: false,
          error: 'Agent IA non initialisé. Vérifiez la configuration GOOGLE_API_KEY.',
          timestamp: new Date(),
        };
      }

      // Exécuter l'agent avec le message de l'utilisateur
      // Ajouter un timeout pour éviter les attentes infinies
      const timeoutMs = aiConfig.timeout || 60000;
      const timeoutPromise = new Promise((_, reject) => {
        setTimeout(() => {
          reject(new Error('Timeout: La requête a pris trop de temps. Veuillez réessayer.'));
        }, timeoutMs);
      });

      const agentPromise = agent.invoke({
        messages: [{ role: 'user', content: message.trim() }],
      });

      const response = await Promise.race([agentPromise, timeoutPromise]);

      // Extraire la réponse de manière propre
      const answer = extractAgentResponse(response);

      // Vérifier si une réponse a été extraite
      if (!answer || typeof answer !== 'string' || answer.trim().length === 0) {
        this.logger.warn(
          'Aucune réponse extraite de l\'agent. Structure:',
          JSON.stringify(response, null, 2),
        );
        this.logRequest(message, userId, tenantId, Date.now() - startTime, false, 'Aucune réponse de l\'agent');
        return {
          success: false,
          error: 'Aucune réponse de l\'agent IA. Veuillez réessayer.',
          timestamp: new Date(),
        };
      }

      // Calculer le temps de traitement
      const processingTime = Date.now() - startTime;

      // Enregistrer la requête réussie
      this.logRequest(message, userId, tenantId, processingTime, true);

      // Retourner la réponse structurée
      return {
        success: true,
        answer: answer.trim(),
        timestamp: new Date(),
        metadata: {
          model: aiConfig.modelName,
          processingTime,
          rateLimitRemaining: rateLimit.remaining,
        },
      };
    } catch (error: any) {
      const processingTime = Date.now() - startTime;
      this.logger.error(
        `Erreur lors du chat avec l'agent IA: ${error?.message || 'Erreur inconnue'}`,
        error?.stack,
      );
      this.logRequest(message, userId, tenantId, processingTime, false, error?.message);

      // Gérer les erreurs spécifiques
      let errorMessage = 'Une erreur est survenue lors du traitement de votre demande.';

      const errorMsg = error?.message || '';
      
      if (errorMsg.includes('Timeout') || errorMsg.includes('timeout')) {
        errorMessage = 'La requête a pris trop de temps. Veuillez réessayer avec une question plus simple.';
      } else if (errorMsg.includes('API key') || errorMsg.includes('API_KEY')) {
        errorMessage = 'Erreur de configuration de l\'API. Vérifiez votre clé API.';
      } else if (errorMsg.includes('403') || errorMsg.includes('Forbidden')) {
        errorMessage = 'Clé API invalide ou expirée. Veuillez vérifier votre configuration.';
      } else if (errorMsg.includes('429') || errorMsg.includes('rate limit') || errorMsg.includes('quota')) {
        errorMessage = 'Limite de requêtes API atteinte. Veuillez réessayer plus tard.';
      } else if (errorMsg.includes('network') || errorMsg.includes('ECONNREFUSED') || errorMsg.includes('ENOTFOUND')) {
        errorMessage = 'Erreur de connexion réseau. Vérifiez votre connexion Internet.';
      } else if (errorMsg.includes('ECONNRESET') || errorMsg.includes('ETIMEDOUT')) {
        errorMessage = 'Connexion interrompue. Veuillez réessayer.';
      } else if (errorMsg.includes('500') || errorMsg.includes('Internal Server Error')) {
        errorMessage = 'Erreur serveur. Veuillez réessayer dans quelques instants.';
      } else if (errorMsg) {
        // Nettoyer le message d'erreur pour éviter d'exposer des détails techniques
        errorMessage = errorMsg.length > 200 
          ? errorMsg.substring(0, 200) + '...' 
          : errorMsg;
      }

      return {
        success: false,
        error: errorMessage,
        timestamp: new Date(),
      };
    }
  }
}
