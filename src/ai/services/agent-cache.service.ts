import { Injectable, Logger, OnModuleDestroy } from '@nestjs/common';
import Redis from 'ioredis';

/**
 * Configuration du cache d'agent
 */
interface AgentCacheConfig {
  ttl: number; // en secondes
  host: string;
  port: number;
  password?: string;
  keyPrefix: string;
}

/**
 * Service de cache pour l'agent IA
 * Utilise Redis pour la persistance et performance
 */
@Injectable()
export class AgentCacheService implements OnModuleDestroy {
  private readonly logger = new Logger(AgentCacheService.name);
  private redis: Redis | null = null;
  private readonly config: AgentCacheConfig = {
    ttl: 600, // 10 minutes
    host: process.env.REDIS_HOST || 'localhost',
    port: Number(process.env.REDIS_PORT) || 6379,
    password: process.env.REDIS_PASSWORD || undefined,
    keyPrefix: 'ai:agent:',
  };

  constructor() {
    this.initRedis();
  }

  /**
   * Initialise la connexion Redis
   */
  private initRedis(): void {
    try {
      this.redis = new Redis({
        host: this.config.host,
        port: this.config.port,
        password: this.config.password || undefined,
        retryStrategy: (times) => {
          const delay = Math.min(times * 100, 3000);
          return delay;
        },
        maxRetriesPerRequest: 3,
        lazyConnect: true,
      });

      this.redis.on('connect', () => {
        this.logger.log(`Connecté à Redis (${this.config.host}:${this.config.port})`);
      });

      this.redis.on('error', (err) => {
        this.logger.warn(`Erreur Redis: ${err.message}. Le cache sera indisponible.`);
      });

      this.redis.connect().catch((err) => {
        this.logger.warn(`Impossible de se connecter à Redis: ${err.message}`);
        this.redis = null;
      });
    } catch (error: any) {
      this.logger.warn(`Redis non disponible: ${error.message}`);
      this.redis = null;
    }
  }

  /**
   * Génère une clé de cache pour un agent
   */
  private getAgentKey(userId: string, tenantId: string): string {
    return `${this.config.keyPrefix}${tenantId}:${userId}`;
  }

  /**
   * Récupère un agent depuis le cache
   */
  async getAgent(userId: string, tenantId: string): Promise<any> {
    const key = this.getAgentKey(userId, tenantId);

    if (!this.redis) {
      this.logger.warn(`Redis non disponible, cache miss pour ${key}`);
      return null;
    }

    try {
      const cached = await this.redis.get(key);
      if (cached) {
        this.logger.debug(`Cache HIT pour ${key}`);
        return JSON.parse(cached);
      }
      this.logger.debug(`Cache MISS pour ${key}`);
    } catch (error: any) {
      this.logger.warn(`Erreur lors de la récupération du cache: ${error.message}`);
    }

    return null;
  }

  /**
   * Met en cache un agent
   */
  async setAgent(userId: string, tenantId: string, agent: any): Promise<void> {
    const key = this.getAgentKey(userId, tenantId);

    if (!this.redis) {
      this.logger.warn(`Redis non disponible, cache ignoré pour ${key}`);
      return;
    }

    try {
      await this.redis.setex(key, this.config.ttl, JSON.stringify(agent));
      this.logger.debug(`Agent mis en cache: ${key} (TTL: ${this.config.ttl}s)`);
    } catch (error: any) {
      this.logger.warn(`Erreur lors de la mise en cache: ${error.message}`);
    }
  }

  /**
   * Invalide le cache d'un agent
   */
  async invalidateAgent(userId: string, tenantId: string): Promise<void> {
    const key = this.getAgentKey(userId, tenantId);

    if (!this.redis) return;

    try {
      await this.redis.del(key);
      this.logger.debug(`Cache invalidé: ${key}`);
    } catch (error: any) {
      this.logger.warn(`Erreur lors de l'invalidation: ${error.message}`);
    }
  }

  /**
   * Invalide tous les agents d'un tenant
   */
  async invalidateTenant(tenantId: string): Promise<number> {
    if (!this.redis) return 0;

    try {
      const pattern = `${this.config.keyPrefix}${tenantId}:*`;
      const keys = await this.redis.keys(pattern);
      
      if (keys.length > 0) {
        await this.redis.del(...keys);
        this.logger.debug(`${keys.length} agents invalidés pour tenant ${tenantId}`);
      }
      
      return keys.length;
    } catch (error: any) {
      this.logger.warn(`Erreur lors de l'invalidation tenant: ${error.message}`);
      return 0;
    }
  }

  /**
   * Retourne les statistiques du cache
   */
  async getStats(): Promise<{ hits: number; misses: number; size: number }> {
    if (!this.redis) {
      return { hits: 0, misses: 0, size: 0 };
    }

    try {
      const pattern = `${this.config.keyPrefix}*`;
      const keys = await this.redis.keys(pattern);
      
      // Info Redis pour les stats de cache
      const info = await this.redis.info('stats');
      const hits = parseInt(info.match(/keyspace_hits:(\d+)/)?.[1] || '0');
      const misses = parseInt(info.match(/keyspace_misses:(\d+)/)?.[1] || '0');

      return {
        hits,
        misses,
        size: keys.length,
      };
    } catch (error: any) {
      this.logger.warn(`Erreur lors des stats: ${error.message}`);
      return { hits: 0, misses: 0, size: 0 };
    }
  }

  /**
   * Vérifie la connexion Redis
   */
  async isHealthy(): Promise<boolean> {
    if (!this.redis) return false;
    
    try {
      const pong = await this.redis.ping();
      return pong === 'PONG';
    } catch {
      return false;
    }
  }

  /**
   * Nettoie les clés expirées
   */
  async cleanup(): Promise<void> {
    // Redis gère automatiquement l'expiration, pas besoin de cleanup manuel
    this.logger.debug('Cleanup Redis: expiration automatique');
  }

  async onModuleDestroy(): Promise<void> {
    if (this.redis) {
      await this.redis.quit();
      this.logger.log('Connexion Redis fermée');
    }
  }
}
