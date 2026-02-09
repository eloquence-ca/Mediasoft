/**
 * Service de Rate Limiting avec support Redis
 * Implémente le sliding window algorithm pour une limitation précise
 */

import Redis from 'ioredis';

export interface RateLimitConfig {
  maxRequests: number;
  windowMs: number;
  keyPrefix?: string;
}

export interface RateLimitResult {
  allowed: boolean;
  remaining: number;
  resetAt: number;
  retryAfter?: number;
}

export interface RateLimitEntry {
  count: number;
  windowStart: number;
}

export class RateLimiterService {
  private client: Redis;
  private readonly config: RateLimitConfig;
  private readonly keyPrefix: string;

  constructor(config?: Partial<RateLimitConfig>) {
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
      maxRequests: config?.maxRequests || 10,
      windowMs: config?.windowMs || 60 * 1000,
      keyPrefix: config?.keyPrefix || 'ai:ratelimit:',
    };

    this.keyPrefix = this.config.keyPrefix || 'ai:ratelimit:';

    this.client.on('error', (err) => {
      console.error('Redis RateLimiter Error:', err);
    });
  }

  /**
   * Génère une clé avec le préfixe
   */
  private getKey(key: string): string {
    return `${this.keyPrefix}${key}`;
  }

  /**
   * Vérifie et consomme un quota de rate limiting
   * Utilise un sliding window counter pour une meilleure précision
   */
  async checkRateLimit(key: string): Promise<RateLimitResult> {
    const now = Date.now();
    const windowStart = now - this.config.windowMs;
    const redisKey = this.getKey(key);

    try {
      // Utiliser Lua script pour atomicité
      const luaScript = `
        local key = KEYS[1]
        local now = tonumber(ARGV[1])
        local windowStart = tonumber(ARGV[2])
        local maxRequests = tonumber(ARGV[3])
        local windowMs = tonumber(ARGV[4])

        -- Supprimer les entrées expirées
        redis.call('ZREMRANGEBYSCORE', key, '-inf', windowStart)

        -- Compter les requêtes actuelles
        local currentCount = redis.call('ZCARD', key)

        if currentCount >= maxRequests then
          -- Rate limit atteint, retourner le temps restant
          local oldest = redis.call('ZRANGE', key, 0, 0, 'WITHSCORES')
          local resetAt = #oldest > 0 and (tonumber(oldest[2]) + windowMs) or (now + windowMs)
          return {0, currentCount, resetAt, math.floor((resetAt - now) / 1000)}
        end

        -- Ajouter la nouvelle requête
        redis.call('ZADD', key, now, now .. ':' .. math.random())
        
        -- Définir l'expiration
        redis.call('EXPIRE', key, math.ceil(windowMs / 1000) + 1)

        local resetAt = now + windowMs
        return {1, currentCount + 1, resetAt, maxRequests - currentCount - 1}
      `;

      const result = await this.client.eval(
        luaScript,
        1,
        redisKey,
        now.toString(),
        windowStart.toString(),
        this.config.maxRequests.toString(),
        this.config.windowMs.toString(),
      ) as number[];

      const [allowed, count, resetAt, remaining] = result;

      return {
        allowed: allowed === 1,
        remaining: Math.max(0, remaining),
        resetAt,
        retryAfter: allowed === 0 ? Math.ceil((resetAt - now) / 1000) : undefined,
      };
    } catch (error) {
      console.error('Rate limit check error:', error);
      // En cas d'erreur Redis, autoriser la requête (fail-open)
      return {
        allowed: true,
        remaining: this.config.maxRequests,
        resetAt: now + this.config.windowMs,
      };
    }
  }

  /**
   * Vérifie simplement si une clé est limitée (sans consommer de quota)
   */
  async isLimited(key: string): Promise<boolean> {
    const result = await this.checkRateLimit(key);
    return !result.allowed;
  }

  /**
   * Récupère les statistiques de rate limiting pour une clé
   */
  async getRateLimitStatus(key: string): Promise<RateLimitResult> {
    return this.checkRateLimit(key);
  }

  /**
   * Réinitialise le rate limit pour une clé (admin only)
   */
  async resetRateLimit(key: string): Promise<void> {
    try {
      await this.client.del(this.getKey(key));
    } catch (error) {
      console.error('Rate limit reset error:', error);
    }
  }

  /**
   * Ferme la connexion Redis
   */
  async close(): Promise<void> {
    await this.client.quit();
  }
}

// Configuration par défaut
export const defaultRateLimitConfig: RateLimitConfig = {
  maxRequests: 10,
  windowMs: 60 * 1000, // 1 minute
  keyPrefix: 'ai:ratelimit:',
};

// Singleton instance
let rateLimiterInstance: RateLimiterService | null = null;

export function getRateLimiterService(): RateLimiterService {
  if (!rateLimiterInstance) {
    rateLimiterInstance = new RateLimiterService();
  }
  return rateLimiterInstance;
}

export default RateLimiterService;
