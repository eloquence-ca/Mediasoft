/**
 * Service de Multi-Modèles pour la résilience
 * Permet de basculer entre différents modèles AI (Google, OpenAI, Anthropic, etc.)
 */

export type ModelProvider = 'google' | 'openai' | 'anthropic' | 'azure';

export interface ModelConfig {
  provider: ModelProvider;
  modelName: string;
  temperature: number;
  maxTokens: number;
  apiKey?: string;
  baseUrl?: string;
}

export interface ModelInfo {
  id: string;
  name: string;
  provider: ModelProvider;
  capabilities: string[];
  contextLength: number;
}

export interface ModelHealthStatus {
  provider: ModelProvider;
  healthy: boolean;
  latency?: number;
  error?: string;
}

// Modèles disponibles
export const AVAILABLE_MODELS: ModelInfo[] = [
  {
    id: 'gemini-2.5-flash-lite',
    name: 'Gemini 2.5 Flash Lite',
    provider: 'google',
    capabilities: ['text', 'streaming', 'function-calling'],
    contextLength: 1000000,
  },
  {
    id: 'gemini-2.5-pro',
    name: 'Gemini 2.5 Pro',
    provider: 'google',
    capabilities: ['text', 'streaming', 'function-calling', 'vision'],
    contextLength: 2000000,
  },
  {
    id: 'gpt-4o',
    name: 'GPT-4o',
    provider: 'openai',
    capabilities: ['text', 'streaming', 'function-calling', 'vision'],
    contextLength: 128000,
  },
  {
    id: 'gpt-4o-mini',
    name: 'GPT-4o Mini',
    provider: 'openai',
    capabilities: ['text', 'streaming', 'function-calling'],
    contextLength: 128000,
  },
  {
    id: 'claude-sonnet-4-20250514',
    name: 'Claude Sonnet 4',
    provider: 'anthropic',
    capabilities: ['text', 'streaming', 'function-calling', 'vision'],
    contextLength: 200000,
  },
  {
    id: 'claude-haiku-3-20250514',
    name: 'Claude Haiku 3',
    provider: 'anthropic',
    capabilities: ['text', 'streaming'],
    contextLength: 200000,
  },
];

export class MultiModelService {
  private readonly providers: Map<ModelProvider, ModelConfig> = new Map();
  private currentModel: string;
  private fallbackModels: string[];
  private healthStatus: Map<ModelProvider, ModelHealthStatus> = new Map();

  constructor() {
    // Configuration des providers depuis les variables d'environnement
    this.initializeProviders();
    
    // Modèle courant par défaut
    this.currentModel = process.env.AI_MODEL || 'gemini-2.5-flash-lite';
    
    // Modèles de fallback en cas d'échec
    this.fallbackModels = [
      'gemini-2.5-flash-lite',
      'gpt-4o-mini',
      'claude-haiku-3-20250514',
    ];

    // Démarrer le monitoring de santé
    this.startHealthMonitoring();
  }

  /**
   * Initialise les providers depuis la configuration
   */
  private initializeProviders(): void {
    // Google
    if (process.env.GOOGLE_API_KEY) {
      this.providers.set('google', {
        provider: 'google',
        modelName: process.env.GOOGLE_MODEL || 'gemini-2.5-flash-lite',
        temperature: Number(process.env.AI_TEMPERATURE) || 0.7,
        maxTokens: Number(process.env.AI_MAX_TOKENS) || 1000,
        apiKey: process.env.GOOGLE_API_KEY,
      });
    }

    // OpenAI
    if (process.env.OPENAI_API_KEY) {
      this.providers.set('openai', {
        provider: 'openai',
        modelName: process.env.OPENAI_MODEL || 'gpt-4o-mini',
        temperature: Number(process.env.AI_TEMPERATURE) || 0.7,
        maxTokens: Number(process.env.AI_MAX_TOKENS) || 1000,
        apiKey: process.env.OPENAI_API_KEY,
        baseUrl: process.env.OPENAI_BASE_URL,
      });
    }

    // Anthropic
    if (process.env.ANTHROPIC_API_KEY) {
      this.providers.set('anthropic', {
        provider: 'anthropic',
        modelName: process.env.ANTHROPIC_MODEL || 'claude-haiku-3-20250514',
        temperature: Number(process.env.AI_TEMPERATURE) || 0.7,
        maxTokens: Number(process.env.AI_MAX_TOKENS) || 1000,
        apiKey: process.env.ANTHROPIC_API_KEY,
      });
    }
  }

  /**
   * Récupère la configuration du modèle actuel
   */
  getCurrentModelConfig(): ModelConfig | null {
    const model = this.getModelInfo(this.currentModel);
    if (!model) return null;

    const provider = this.providers.get(model.provider);
    return provider || null;
  }

  /**
   * Récupère les informations d'un modèle
   */
  getModelInfo(modelId: string): ModelInfo | null {
    return AVAILABLE_MODELS.find((m) => m.id === modelId) || null;
  }

  /**
   * Récupère tous les modèles disponibles
   */
  getAvailableModels(): ModelInfo[] {
    return AVAILABLE_MODELS.filter((m) => {
      // Filtrer par provider configuré
      if (!this.providers.has(m.provider)) return false;
      return true;
    });
  }

  /**
   * Bascule vers un modèle spécifique
   */
  switchModel(modelId: string): boolean {
    const model = this.getModelInfo(modelId);
    if (!model) return false;

    const provider = this.providers.get(model.provider);
    if (!provider) {
      console.warn(`Provider ${model.provider} not configured for model ${modelId}`);
      return false;
    }

    this.currentModel = modelId;
    console.log(`Switched to model: ${modelId}`);
    return true;
  }

  /**
   * Bascule vers le modèle de fallback
   */
  async switchToFallback(): Promise<boolean> {
    const currentProvider = this.getModelInfo(this.currentModel)?.provider;

    for (const fallbackModelId of this.fallbackModels) {
      const fallbackModel = this.getModelInfo(fallbackModelId);
      
      // Ne pas retourner au même provider
      if (fallbackModel?.provider === currentProvider) continue;

      // Vérifier la santé du provider
      if (!fallbackModel) continue;
      const health = this.healthStatus.get(fallbackModel.provider);
      if (!health || health.healthy) {
        if (this.switchModel(fallbackModelId)) {
          return true;
        }
      }
    }

    return false;
  }

  /**
   * Exécute avec basculement automatique en cas d'échec
   */
  async executeWithFallback<T>(
    operation: (modelConfig: ModelConfig) => Promise<T>,
    maxRetries: number = 2,
  ): Promise<{ result: T; modelUsed: string }> {
    let lastError: Error | null = null;
    const triedModels: string[] = [];

    for (let attempt = 0; attempt <= maxRetries; attempt++) {
      const modelConfig = this.getCurrentModelConfig();
      
      if (!modelConfig) {
        throw new Error(`No model configuration available`);
      }

      triedModels.push(this.currentModel);

      try {
        const result = await operation(modelConfig);
        return { result, modelUsed: this.currentModel };
      } catch (error) {
        lastError = error instanceof Error ? error : new Error(String(error));
        console.warn(
          `Model ${this.currentModel} failed (attempt ${attempt + 1}):`,
          lastError.message,
        );

        // Marquer le provider comme non sain
        const modelInfo = this.getModelInfo(this.currentModel);
        if (modelInfo) {
          this.healthStatus.set(modelInfo.provider, {
            provider: modelInfo.provider,
            healthy: false,
            error: lastError.message,
          });
        }

        // Tenter de basculer vers un autre modèle
        await this.switchToFallback();
      }
    }

    throw new Error(
      `All models failed after ${triedModels.length} attempts. ` +
      `Tried: ${triedModels.join(', ')}. Last error: ${lastError?.message}`,
    );
  }

  /**
   * Surveille la santé des providers
   */
  private startHealthMonitoring(): void {
    // Vérifier la santé toutes les 5 minutes
    setInterval(() => {
      this.checkAllProvidersHealth();
    }, 5 * 60 * 1000);

    // Première vérification immédiate
    this.checkAllProvidersHealth();
  }

  /**
   * Vérifie la santé de tous les providers configurés
   */
  async checkAllProvidersHealth(): Promise<Map<ModelProvider, ModelHealthStatus>> {
    for (const [provider, config] of this.providers) {
      await this.checkProviderHealth(provider, config);
    }
    return this.healthStatus;
  }

  /**
   * Vérifie la santé d'un provider spécifique
   */
  private async checkProviderHealth(
    provider: ModelProvider,
    config: ModelConfig,
  ): Promise<ModelHealthStatus> {
    const startTime = Date.now();
    let health: ModelHealthStatus;

    try {
      // Test simple de connectivité
      // En production, cela ferait un appel API réel
      await this.pingProvider(provider, config);

      health = {
        provider,
        healthy: true,
        latency: Date.now() - startTime,
      };
    } catch (error) {
      health = {
        provider,
        healthy: false,
        latency: Date.now() - startTime,
        error: error instanceof Error ? error.message : 'Unknown error',
      };
    }

    this.healthStatus.set(provider, health);
    return health;
  }

  /**
   * Teste la connectivité avec un provider
   */
  private async pingProvider(provider: ModelProvider, config: ModelConfig): Promise<void> {
    // Simulation de ping - en production, faire un appel API réel
    return new Promise((resolve, reject) => {
      setTimeout(() => {
        if (config.apiKey) {
          resolve();
        } else {
          reject(new Error(`API key not configured for ${provider}`));
        }
      }, 100);
    });
  }

  /**
   * Récupère le statut de santé des providers
   */
  getHealthStatus(): Map<ModelProvider, ModelHealthStatus> {
    return this.healthStatus;
  }

  /**
   * Récupère le modèle avec le moins de latence
   */
  async getFastestModel(): Promise<string | null> {
    const models = this.getAvailableModels();
    let fastestModel: string | null = null;
    let fastestLatency = Infinity;

    for (const model of models) {
      const health = this.healthStatus.get(model.provider);
      if (health?.healthy && health.latency !== undefined && health.latency < fastestLatency) {
        fastestLatency = health.latency;
        fastestModel = model.id;
      }
    }

    return fastestModel;
  }
}

// Singleton instance
let multiModelInstance: MultiModelService | null = null;

export function getMultiModelService(): MultiModelService {
  if (!multiModelInstance) {
    multiModelInstance = new MultiModelService();
  }
  return multiModelInstance;
}

export default MultiModelService;
