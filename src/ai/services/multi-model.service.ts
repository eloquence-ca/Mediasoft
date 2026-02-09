import { Injectable, Logger } from '@nestjs/common';
import { aiConfig } from '../../config/ai.config';

/**
 * Configuration d'un modèle IA
 */
export interface ModelConfig {
  name: string;
  provider: 'google' | 'openai' | 'anthropic';
  displayName: string;
  maxTokens: number;
  temperature: number;
  costPer1kTokens: number;
  capabilities: string[];
  fallback?: string;
  enabled: boolean;
}

/**
 * Stratégie de fallback
 */
export enum FallbackStrategy {
  SEQUENTIAL = 'sequential', // Essayer dans l'ordre jusqu'à成功
  FASTEST = 'fastest', // Essayer tous en parallèle, prendre le plus rapide
  CHEAPEST = 'cheapest', // Essayer le moins cher d'abord
}

/**
 * Service de gestion multi-modèles pour l'agent IA
 * Permet de basculer entre différents modèles en cas d'échec
 */
@Injectable()
export class MultiModelService {
  private readonly logger = new Logger(MultiModelService.name);
  private models: Map<string, ModelConfig>;
  private activeModel: string;

  constructor() {
    this.models = new Map();
    this.activeModel = aiConfig.modelName || 'gemini-2.5-flash-lite';
    this.initializeModels();
  }

  /**
   * Initialise les modèles disponibles
   */
  private initializeModels(): void {
    // Modèles Google (actuels)
    this.registerModel({
      name: 'gemini-2.5-flash-lite',
      provider: 'google',
      displayName: 'Gemini 2.5 Flash Lite',
      maxTokens: 64000,
      temperature: 0.7,
      costPer1kTokens: 0.0001,
      capabilities: ['chat', 'reasoning', 'tools'],
      enabled: true,
    });

    this.registerModel({
      name: 'gemini-2.5-flash',
      provider: 'google',
      displayName: 'Gemini 2.5 Flash',
      maxTokens: 1048576,
      temperature: 0.7,
      costPer1kTokens: 0.00015,
      capabilities: ['chat', 'reasoning', 'tools', 'vision'],
      fallback: 'gemini-2.5-flash-lite',
      enabled: true,
    });

    this.registerModel({
      name: 'gemini-2.5-pro',
      provider: 'google',
      displayName: 'Gemini 2.5 Pro',
      maxTokens: 2097152,
      temperature: 0.7,
      costPer1kTokens: 0.001,
      capabilities: ['chat', 'reasoning', 'tools', 'vision', 'code'],
      fallback: 'gemini-2.5-flash',
      enabled: true,
    });

    // OpenAI models (fallback options)
    this.registerModel({
      name: 'gpt-4o-mini',
      provider: 'openai',
      displayName: 'GPT-4o Mini',
      maxTokens: 128000,
      temperature: 0.7,
      costPer1kTokens: 0.00015,
      capabilities: ['chat', 'reasoning', 'tools', 'vision'],
      fallback: 'gemini-2.5-flash-lite',
      enabled: false,
    });

    this.registerModel({
      name: 'gpt-4o',
      provider: 'openai',
      displayName: 'GPT-4o',
      maxTokens: 128000,
      temperature: 0.7,
      costPer1kTokens: 0.0025,
      capabilities: ['chat', 'reasoning', 'tools', 'vision', 'code'],
      fallback: 'gpt-4o-mini',
      enabled: false,
    });

    // Anthropic models (fallback options)
    this.registerModel({
      name: 'claude-sonnet-4-20250514',
      provider: 'anthropic',
      displayName: 'Claude Sonnet 4',
      maxTokens: 200000,
      temperature: 0.7,
      costPer1kTokens: 0.003,
      capabilities: ['chat', 'reasoning', 'tools', 'vision', 'code'],
      fallback: 'gemini-2.5-flash',
      enabled: false,
    });

    this.logger.log(`${this.models.size} modèles IA enregistrés`);
  }

  /**
   * Enregistre un modèle
   */
  registerModel(config: ModelConfig): void {
    this.models.set(config.name, config);
  }

  /**
   * Récupère la configuration d'un modèle
   */
  getModel(name?: string): ModelConfig | null {
    const modelName = name || this.activeModel;
    return this.models.get(modelName) || null;
  }

  /**
   * Récupère le modèle actif
   */
  getActiveModel(): ModelConfig {
    return this.getModel(this.activeModel) || this.getModel('gemini-2.5-flash-lite')!;
  }

  /**
   * Définit le modèle actif
   */
  setActiveModel(name: string): boolean {
    const model = this.models.get(name);
    if (model && model.enabled) {
      this.activeModel = name;
      this.logger.log(`Modèle actif: ${model.displayName}`);
      return true;
    }
    return false;
  }

  /**
   * Récupère la liste des modèles disponibles
   */
  getAvailableModels(): ModelConfig[] {
    return Array.from(this.models.values()).filter((m) => m.enabled);
  }

  /**
   * Récupère tous les modèles
   */
  getAllModels(): ModelConfig[] {
    return Array.from(this.models.values());
  }

  /**
   * Désactive un modèle
   */
  disableModel(name: string): boolean {
    const model = this.models.get(name);
    if (model) {
      model.enabled = false;
      return true;
    }
    return false;
  }

  /**
   * Active un modèle
   */
  enableModel(name: string): boolean {
    const model = this.models.get(name);
    if (model) {
      model.enabled = true;
      return true;
    }
    return false;
  }

  /**
   * Récupère la chaîne de fallback pour un modèle
   */
  getFallbackChain(modelName: string): string[] {
    const chain: string[] = [];
    let current = modelName;

    while (current) {
      const model = this.models.get(current);
      if (!model || !model.enabled) break;

      chain.push(current);

      if (model.fallback && model.fallback !== current) {
        current = model.fallback;
      } else {
        break;
      }
    }

    return chain;
  }

  /**
   * Exécute avec stratégie de fallback
   */
  async executeWithFallback<T>(
    executor: (modelName: string) => Promise<T>,
    strategy: FallbackStrategy = FallbackStrategy.SEQUENTIAL,
    preferredModel?: string,
  ): Promise<{ result: T; modelUsed: string; attempts: number }> {
    const availableModels = this.getAvailableModels();

    if (availableModels.length === 0) {
      throw new Error('Aucun modèle IA disponible');
    }

    // Trier selon la stratégie
    let sortedModels: ModelConfig[];

    switch (strategy) {
      case FallbackStrategy.CHEAPEST:
        sortedModels = availableModels.sort((a, b) => a.costPer1kTokens - b.costPer1kTokens);
        break;
      case FallbackStrategy.FASTEST:
        // Pas de métriques de vitesse, utiliser l'ordre par défaut
        sortedModels = availableModels;
        break;
      case FallbackStrategy.SEQUENTIAL:
      default:
        // Utiliser le modèle préféré ou l'actif
        if (preferredModel) {
          const preferred = availableModels.find((m) => m.name === preferredModel);
          sortedModels = preferred
            ? [preferred, ...availableModels.filter((m) => m.name !== preferredModel)]
            : availableModels;
        } else {
          sortedModels = availableModels;
        }
        break;
    }

    let lastError: Error | null = null;

    for (const model of sortedModels) {
      try {
        this.logger.debug(`Tentative avec ${model.displayName}`);
        const result = await executor(model.name);
        return { result, modelUsed: model.name, attempts: sortedModels.indexOf(model) + 1 };
      } catch (error) {
        lastError = error as Error;
        this.logger.warn(
          `${model.displayName} a échoué: ${error instanceof Error ? error.message : 'Erreur inconnue'}`,
        );
        continue;
      }
    }

    throw lastError || new Error('Tous les modèles ont échoué');
  }

  /**
   * Calcule le coût estimé pour un modèle
   */
  estimateCost(modelName: string, inputTokens: number, outputTokens: number): number {
    const model = this.getModel(modelName);
    if (!model) return 0;

    const inputCost = (inputTokens / 1000) * model.costPer1kTokens;
    const outputCost = (outputTokens / 1000) * model.costPer1kTokens;

    return inputCost + outputCost;
  }

  /**
   * Met à jour la configuration d'un modèle
   */
  updateModelConfig(
    name: string,
    updates: Partial<ModelConfig>,
  ): boolean {
    const model = this.models.get(name);
    if (model) {
      Object.assign(model, updates);
      return true;
    }
    return false;
  }

  /**
   * Export de la configuration
   */
  exportConfig(): Record<string, ModelConfig> {
    return Object.fromEntries(this.models);
  }
}
