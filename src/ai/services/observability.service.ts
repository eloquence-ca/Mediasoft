/**
 * Service d'Observabilité pour l'IA
 * Gère les métriques, logs structurés et tracing
 */

export interface Metric {
  name: string;
  value: number;
  tags?: Record<string, string>;
  timestamp?: number;
}

export interface LogEntry {
  level: 'debug' | 'info' | 'warn' | 'error';
  message: string;
  timestamp: number;
  context?: Record<string, any>;
  userId?: string;
  tenantId?: string;
  requestId?: string;
}

export interface TraceSpan {
  id: string;
  parentId?: string;
  name: string;
  startTime: number;
  endTime?: number;
  duration?: number;
  tags?: Record<string, string>;
  status?: 'ok' | 'error';
  error?: string;
}

export interface ObservabilityConfig {
  serviceName?: string;
  environment?: string;
  enableMetrics?: boolean;
  enableTracing?: boolean;
  enableLogging?: boolean;
}

export class ObservabilityService {
  private readonly serviceName: string;
  private readonly environment: string;
  private readonly metrics: Map<string, Metric[]> = new Map();
  private readonly traces: Map<string, TraceSpan> = new Map();
  private currentSpan: TraceSpan | null = null;
  private requestIdCounter: number = 0;

  constructor(config?: ObservabilityConfig) {
    this.serviceName = config?.serviceName || 'ai-agent';
    this.environment = config?.environment || process.env.NODE_ENV || 'development';
  }

  /**
   * Génère un ID de requête unique
   */
  generateRequestId(): string {
    return `req_${Date.now()}_${++this.requestIdCounter}_${Math.random().toString(36).substring(2, 9)}`;
  }

  /**
   * Enregistre une métrique
   */
  recordMetric(name: string, value: number, tags?: Record<string, string>): void {
    const key = this.getMetricKey(name, tags);
    
    if (!this.metrics.has(key)) {
      this.metrics.set(key, []);
    }
    
    const metricEntry: Metric = {
      value,
      timestamp: Date.now(),
      name,
      tags,
    };
    
    this.metrics.get(key)!.push(metricEntry);

    // Log en debug
    this.log('debug', `Metric recorded: ${name}=${value}`, { tags });
  }

  /**
   * Génère une clé unique pour la métrique
   */
  private getMetricKey(name: string, tags?: Record<string, string>): string {
    if (!tags) return name;
    const tagString = Object.entries(tags)
      .sort(([a], [b]) => a.localeCompare(b))
      .map(([k, v]) => `${k}=${v}`)
      .join(',');
    return `${name}[${tagString}]`;
  }

  /**
   * Récupère les statistiques d'une métrique
   */
  getMetricStats(name: string, tags?: Record<string, string>): {
    count: number;
    sum: number;
    avg: number;
    min: number;
    max: number;
    p50: number;
    p95: number;
    p99: number;
  } | null {
    const key = this.getMetricKey(name, tags);
    const values = this.metrics.get(key);

    if (!values || values.length === 0) return null;

    const numericValues = values.map((v) => v.value).sort((a, b) => a - b);

    const count = numericValues.length;
    const sum = numericValues.reduce((a, b) => a + b, 0);

    return {
      count,
      sum,
      avg: sum / count,
      min: numericValues[0],
      max: numericValues[count - 1],
      p50: this.percentile(numericValues, 50),
      p95: this.percentile(numericValues, 95),
      p99: this.percentile(numericValues, 99),
    };
  }

  /**
   * Calcule un percentile
   */
  private percentile(sortedValues: number[], p: number): number {
    if (sortedValues.length === 0) return 0;
    const index = Math.ceil((p / 100) * sortedValues.length) - 1;
    return sortedValues[Math.max(0, Math.min(index, sortedValues.length - 1))];
  }

  /**
   * Démarre un span de tracing
   */
  startSpan(name: string, parentId?: string, tags?: Record<string, string>): string {
    const spanId = this.generateRequestId();
    const span: TraceSpan = {
      id: spanId,
      parentId,
      name,
      startTime: Date.now(),
      tags,
    };

    this.traces.set(spanId, span);
    this.currentSpan = span;

    return spanId;
  }

  /**
   * Termine un span de tracing
   */
  endSpan(spanId?: string, status?: 'ok' | 'error', error?: string): void {
    const id = spanId || this.currentSpan?.id;
    if (!id) return;
    
    const span = this.traces.get(id);
    
    if (span) {
      span.endTime = Date.now();
      span.duration = span.endTime - span.startTime;
      span.status = status || 'ok';
      span.error = error;
    }
  }

  /**
   * Crée un span enfant
   */
  createChildSpan(name: string, tags?: Record<string, string>): string {
    return this.startSpan(name, this.currentSpan?.id, tags);
  }

  /**
   * Obtient le span actuel
   */
  getCurrentSpan(): TraceSpan | null {
    return this.currentSpan;
  }

  /**
   * Obtient tous les spans d'une trace
   */
  getTraceSpans(traceId: string): TraceSpan[] {
    return Array.from(this.traces.values()).filter(
      (span) => span.id === traceId || span.parentId === traceId,
    );
  }

  /**
   * Enregistre un log structuré
   */
  log(
    level: LogEntry['level'],
    message: string,
    context?: Record<string, any>,
    metadata?: { userId?: string; tenantId?: string; requestId?: string },
  ): void {
    const entry: LogEntry = {
      level,
      message,
      timestamp: Date.now(),
      context,
      userId: metadata?.userId,
      tenantId: metadata?.tenantId,
      requestId: metadata?.requestId || this.currentSpan?.id,
    };

    // Formater selon le niveau
    const logLine = JSON.stringify({
      timestamp: new Date(entry.timestamp).toISOString(),
      level: entry.level.toUpperCase(),
      service: this.serviceName,
      environment: this.environment,
      message: entry.message,
      ...(entry.userId && { userId: entry.userId }),
      ...(entry.tenantId && { tenantId: entry.tenantId }),
      ...(entry.requestId && { requestId: entry.requestId }),
      ...(entry.context && { context: entry.context }),
    });

    switch (level) {
      case 'error':
        console.error(logLine);
        break;
      case 'warn':
        console.warn(logLine);
        break;
      case 'debug':
        if (this.environment === 'development') {
          console.debug(logLine);
        }
        break;
      default:
        console.log(logLine);
    }
  }

  /**
   * Métriques prédefinies pour l'IA
   */
  recordChatRequest(userId: string, tenantId: string, processingTime: number, success: boolean): void {
    this.recordMetric('ai.chat.request.count', 1, { success: String(success), tenantId });
    this.recordMetric('ai.chat.request.duration', processingTime, { success: String(success), tenantId });
  }

  recordRateLimitHit(userId: string): void {
    this.recordMetric('ai.rate_limit.hit', 1, { userId });
  }

  recordCacheHit(cacheType: string): void {
    this.recordMetric('ai.cache.hit', 1, { cacheType, hit: 'true' });
  }

  recordCacheMiss(cacheType: string): void {
    this.recordMetric('ai.cache.hit', 1, { cacheType, hit: 'false' });
  }

  recordModelSwitch(modelId: string): void {
    this.recordMetric('ai.model.switch', 1, { modelId });
  }

  recordToolCall(toolName: string, duration: number, success: boolean): void {
    this.recordMetric('ai.tool.call.count', 1, { tool: toolName, success: String(success) });
    this.recordMetric('ai.tool.call.duration', duration, { tool: toolName });
  }

  /**
   * Récupère les statistiques d'utilisation
   */
  getUsageStats(): {
    totalRequests: number;
    successfulRequests: number;
    failedRequests: number;
    avgProcessingTime: number;
    cacheHitRate: number;
    rateLimitHits: number;
    modelSwitches: number;
  } {
    const requestStats = this.getMetricStats('ai.chat.request.duration');
    const rateLimitStats = this.getMetricStats('ai.rate_limit.hit');
    const modelSwitchStats = this.getMetricStats('ai.model.switch');
    
    const cacheHitStats = this.getMetricStats('ai.cache.hit', { hit: 'true' });
    const cacheMissStats = this.getMetricStats('ai.cache.hit', { hit: 'false' });

    const successKey = this.getMetricKey('ai.chat.request.duration', { success: 'true' });
    const failKey = this.getMetricKey('ai.chat.request.duration', { success: 'false' });
    
    const successCount = this.metrics.get(successKey)?.length || 0;
    const failCount = this.metrics.get(failKey)?.length || 0;

    const totalCache = (cacheHitStats?.count || 0) + (cacheMissStats?.count || 0);
    const cacheHitRate = totalCache > 0 ? ((cacheHitStats?.count || 0) / totalCache) * 100 : 0;

    return {
      totalRequests: successCount + failCount,
      successfulRequests: successCount,
      failedRequests: failCount,
      avgProcessingTime: requestStats?.avg || 0,
      cacheHitRate,
      rateLimitHits: rateLimitStats?.count || 0,
      modelSwitches: modelSwitchStats?.count || 0,
    };
  }

  /**
   * Nettoie les données anciennes
   */
  cleanup(maxAgeMs: number = 3600000): number {
    const cutoff = Date.now() - maxAgeMs;
    let cleaned = 0;

    // Nettoyer les métriques
    for (const [key, values] of this.metrics.entries()) {
      const validValues = values.filter((v) => (v.timestamp || 0) > cutoff);
      if (validValues.length !== values.length) {
        if (validValues.length > 0) {
          this.metrics.set(key, validValues);
        } else {
          this.metrics.delete(key);
        }
        cleaned++;
      }
    }

    // Nettoyer les traces
    for (const [id, span] of this.traces.entries()) {
      if (span.startTime < cutoff) {
        this.traces.delete(id);
        cleaned++;
      }
    }

    return cleaned;
  }

  /**
   * Export au format Prometheus
   */
  exportPrometheusMetrics(): string {
    const lines: string[] = [];

    for (const [key, values] of this.metrics.entries()) {
      if (values.length === 0) continue;
      
      const sum = values.reduce((acc, v) => acc + v.value, 0);
      const last = values[values.length - 1].value;
      const count = values.length;
      
      const metricName = key.replace(/[^a-zA-Z0-9:]/g, '_');
      
      lines.push(`# HELP ${metricName} AI metric`);
      lines.push(`# TYPE ${metricName} gauge`);
      lines.push(`${metricName} ${last}`);
      lines.push(`${metricName}_sum ${sum}`);
      lines.push(`${metricName}_count ${count}`);
    }

    return lines.join('\n');
  }
}

// Singleton instance
let observabilityInstance: ObservabilityService | null = null;

export function getObservabilityService(config?: ObservabilityConfig): ObservabilityService {
  if (!observabilityInstance) {
    observabilityInstance = new ObservabilityService(config);
  }
  return observabilityInstance;
}

export default ObservabilityService;
