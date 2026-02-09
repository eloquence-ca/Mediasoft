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

/**
 * Service pour l'agent IA
 * Utilise LangChain avec Google Gemini pour répondre aux questions en langage naturel
 */
@Injectable()
export class AiService {
  private readonly logger = new Logger(AiService.name);

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
  ) {}

  /**
   * Initialise l'agent IA avec LangChain pour un utilisateur spécifique
   */
  private async initializeAgent(userId: string, tenantId: string): Promise<any> {
    try {
      // Vérifier que la clé API Google est configurée
      if (!aiConfig.apiKey || aiConfig.apiKey === 'your-google-api-key') {
        this.logger.warn(
          'GOOGLE_API_KEY non configurée. L\'agent IA ne fonctionnera pas correctement.',
        );
        return null;
      }

      // Import dynamique pour éviter les erreurs si les dépendances ne sont pas installées
      let ChatGoogleGenerativeAI: any;
      let createAgent: any;

      try {
        // @ts-ignore - Import dynamique pour éviter les erreurs TypeScript si les modules ne sont pas installés
        const googleGenaiModule = await import('@langchain/google-genai');
        ChatGoogleGenerativeAI = googleGenaiModule.ChatGoogleGenerativeAI;

        // @ts-ignore - Import dynamique pour éviter les erreurs TypeScript si les modules ne sont pas installés
        const langchainModule = await import('langchain');
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
      const agent = createAgent({
        model,
        tools,
        systemPrompt: SYSTEM_PROMPT,
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
        return {
          success: false,
          error: 'Le message ne peut pas être vide',
          timestamp: new Date(),
        };
      }

      // Validation des paramètres
      if (!userId || !tenantId) {
        return {
          success: false,
          error: 'Paramètres utilisateur manquants',
          timestamp: new Date(),
        };
      }

      // Initialiser l'agent pour cet utilisateur
      const agent = await this.initializeAgent(userId, tenantId);

      if (!agent) {
        return {
          success: false,
          error: 'Agent IA non initialisé. Vérifiez la configuration GOOGLE_API_KEY.',
          timestamp: new Date(),
        };
      }

      // Exécuter l'agent avec le message de l'utilisateur
      // Ajouter un timeout pour éviter les attentes infinies
      const timeoutPromise = new Promise((_, reject) => {
        setTimeout(() => {
          reject(new Error('Timeout: La requête a pris trop de temps. Veuillez réessayer.'));
        }, 60000); // 60 secondes de timeout
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
        return {
          success: false,
          error: 'Aucune réponse de l\'agent IA. Veuillez réessayer.',
          timestamp: new Date(),
        };
      }

      // Calculer le temps de traitement
      const processingTime = Date.now() - startTime;

      // Retourner la réponse structurée
      return {
        success: true,
        answer: answer.trim(),
        timestamp: new Date(),
        metadata: {
          model: aiConfig.modelName,
          processingTime,
        },
      };
    } catch (error: any) {
      this.logger.error(
        `Erreur lors du chat avec l'agent IA: ${error?.message || 'Erreur inconnue'}`,
        error?.stack,
      );

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
        errorMessage = 'Limite de requêtes atteinte. Veuillez réessayer plus tard.';
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
