import { Injectable, Logger } from '@nestjs/common';

/**
 * Métriques pour le monitoring de l'agent IA
 */
export interface AIMetrics {
  totalRequests: number;
  successfulRequests: number;
  failedRequests: number;
  averageResponseTime: number;
  cacheHits: number;
  cacheMisses: number;
  rateLimitHits: number;
  modelUsage: Record<string, number>;
  errorsByType: Record<string, number>;
}

/**
 * Trace pour le debugging
 */
export interface AITrace {
  id: string;
  userId: string;
  tenantId: string;
  timestamp: number;
  duration: number;
  model: string;
  success: boolean;
  inputTokens?: number;
  outputTokens?: number;
  error?: string;
}

/**
 * Service d'observabilité pour l'agent IA
 * Collecte les métriques et traces pour le monitoring
 */
@Injectable()
export class ObservabilityService {
  private readonly logger = new Logger(ObservabilityService.name);
  private metrics: AIMetrics;
  private traces: AITrace[] = [];
  private readonly MAX_TRACES = 1000;
  private startTime: number = Date.now();

  constructor() {
    this.metrics = {
      totalRequests: 0,
      successfulRequests: 0,
      failedRequests: 0,
      averageResponseTime: 0,
      cacheHits: 0,
      cacheMisses: 0,
      rateLimitHits: 0,
      modelUsage: {},
      errorsByType: {},
    };
  }

  /**
   * Enregistre une requête
   */
  recordRequest(
    userId: string,
    tenantId: string,
    duration: number,
    model: string,
    success: boolean,
    inputTokens?: number,
    outputTokens?: number,
    error?: string,
  ): void {
    this.metrics.totalRequests++;

    if (success) {
      this.metrics.successfulRequests++;
    } else {
      this.metrics.failedRequests++;
    }

    // Mettre à jour le temps de réponse moyen
    const total = this.metrics.successfulRequests + this.metrics.failedRequests;
    this.metrics.averageResponseTime =
      (this.metrics.averageResponseTime * (total - 1) + duration) / total;

    // Compter l'utilisation du modèle
    this.metrics.modelUsage[model] = (this.metrics.modelUsage[model] || 0) + 1;

    // Enregistrer l'erreur
    if (error) {
      const errorType = this.getErrorType(error);
      this.metrics.errorsByType[errorType] = (this.metrics.errorsByType[errorType] || 0) + 1;
    }

    // Enregistrer la trace
    const trace: AITrace = {
      id: this.generateTraceId(),
      userId,
      tenantId,
      timestamp: Date.now(),
      duration,
      model,
      success,
      inputTokens,
      outputTokens,
      error,
    };

    this.addTrace(trace);

    // Log détaillé pour les erreurs
    if (!success) {
      this.logger.error(
        `IA Request failed: ${trace.id} | Duration: ${duration}ms | Model: ${model} | Error: ${error}`,
      );
    } else {
      this.logger.debug(
        `IA Request: ${trace.id} | Duration: ${duration}ms | Model: ${model} | Tokens: ${inputTokens}/${outputTokens}`,
      );
    }
  }

  /**
   * Enregistre un cache hit
   */
  recordCacheHit(): void {
    this.metrics.cacheHits++;
  }

  /**
   * Enregistre un cache miss
   */
  recordCacheMiss(): void {
    this.metrics.cacheMisses++;
  }

  /**
   * Enregistre un rate limit hit
   */
  recordRateLimitHit(): void {
    this.metrics.rateLimitHits++;
  }

  /**
   * Génère un ID de trace unique
   */
  private generateTraceId(): string {
    const timestamp = Date.now().toString(36);
    const random = Math.random().toString(36).substring(2, 8);
    return `trace-${timestamp}-${random}`;
  }

  /**
   * Extrait le type d'erreur
   */
  private getErrorType(error: string): string {
    if (error.includes('timeout') || error.includes('Timeout')) return 'TIMEOUT';
    if (error.includes('429') || error.includes('rate limit')) return 'RATE_LIMIT';
    if (error.includes('401') || error.includes('403') || error.includes('API key')) return 'AUTH';
    if (error.includes('404') || error.includes('not found')) return 'NOT_FOUND';
    if (error.includes('500') || error.includes('internal')) return 'SERVER';
    if (error.includes('network') || error.includes('connection')) return 'NETWORK';
    return 'UNKNOWN';
  }

  /**
   * Ajoute une trace
   */
  private addTrace(trace: AITrace): void {
    this.traces.push(trace);

    // Limiter le nombre de traces
    if (this.traces.length > this.MAX_TRACES) {
      this.traces = this.traces.slice(-this.MAX_TRACES);
    }
  }

  /**
   * Récupère toutes les métriques
   */
  getMetrics(): AIMetrics & { uptime: number; cacheHitRate: number; successRate: number } {
    const uptime = Date.now() - this.startTime;
    const cacheHitRate =
      this.metrics.cacheHits + this.metrics.cacheMisses > 0
        ? this.metrics.cacheHits / (this.metrics.cacheHits + this.metrics.cacheMisses)
        : 0;
    const successRate =
      this.metrics.totalRequests > 0
        ? this.metrics.successfulRequests / this.metrics.totalRequests
        : 0;

    return {
      ...this.metrics,
      uptime,
      cacheHitRate: Math.round(cacheHitRate * 100) / 100,
      successRate: Math.round(successRate * 100) / 100,
    };
  }

  /**
   * Récupère les traces récentes
   */
  getRecentTraces(limit?: number): AITrace[] {
    const count = limit || 100;
    return this.traces.slice(-count);
  }

  /**
   * Récupère les traces d'un utilisateur
   */
  getUserTraces(userId: string, limit?: number): AITrace[] {
    const count = limit || 100;
    return this.traces.filter((t) => t.userId === userId).slice(-count);
  }

  /**
   * Récupère les traces d'erreur récentes
   */
  getErrorTraces(limit?: number): AITrace[] {
    const count = limit || 50;
    return this.traces.filter((t) => !t.success).slice(-count);
  }

  /**
   * Réinitialise les métriques
   */
  resetMetrics(): void {
    this.metrics = {
      totalRequests: 0,
      successfulRequests: 0,
      failedRequests: 0,
      averageResponseTime: 0,
      cacheHits: 0,
      cacheMisses: 0,
      rateLimitHits: 0,
      modelUsage: {},
      errorsByType: {},
    };
    this.startTime = Date.now();
    this.logger.log('Métriques réinitialisées');
  }

  /**
   * Exporte les métriques en format Prometheus
   */
  exportPrometheus(): string {
    const metrics = this.getMetrics();
    const lines: string[] = [];

    lines.push(`# Aide IA Metrics`);
    lines.push(`# Generated at ${new Date().toISOString()}`);
    lines.push('');

    lines.push(`# Type: counter`);
    lines.push(`ia_total_requests ${metrics.totalRequests}`);
    lines.push(`ia_successful_requests ${metrics.successfulRequests}`);
    lines.push(`ia_failed_requests ${metrics.failedRequests}`);
    lines.push(`ia_cache_hits ${metrics.cacheHits}`);
    lines.push(`ia_cache_misses ${metrics.cacheMisses}`);
    lines.push(`ia_rate_limit_hits ${metrics.rateLimitHits}`);

    lines.push(`# Type: gauge`);
    lines.push(`ia_average_response_time_ms ${Math.round(metrics.averageResponseTime)}`);
    lines.push(`ia_cache_hit_rate ${metrics.cacheHitRate}`);
    lines.push(`ia_success_rate ${metrics.successRate}`);

    // Modèle usage
    for (const [model, count] of Object.entries(metrics.modelUsage)) {
      lines.push(`ia_model_usage_requests{model="${model}"} ${count}`);
    }

    // Erreurs
    for (const [type, count] of Object.entries(metrics.errorsByType)) {
      lines.push(`ia_errors_total{type="${type}"} ${count}`);
    }

    return lines.join('\n');
  }

  /**
   * Nettoie les traces anciennes
   */
  cleanupTraces(maxAge: number = 86400000): number {
    // 24h par défaut
    const cutoff = Date.now() - maxAge;
    const initialLength = this.traces.length;
    this.traces = this.traces.filter((t) => t.timestamp > cutoff);
    return initialLength - this.traces.length;
  }
}
