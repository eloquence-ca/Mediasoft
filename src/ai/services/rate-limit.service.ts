import { Injectable, Logger, HttpException, HttpStatus } from '@nestjs/common';
import Redis from 'ioredis';

/**
 * Service de rate limiting pour l'API IA
 * Utilise Redis pour le comptage des requêtes par utilisateur
 */
@Injectable()
export class RateLimitService {
  private readonly logger = new Logger(RateLimitService.name);
  private redis: Redis | null = null;

  // Configuration par défaut
  private readonly DEFAULT_LIMIT = 50; // requêtes
  private readonly DEFAULT_WINDOW = 3600; // 1 heure en secondes
  private readonly WINDOW_PREFIX = 'ai:ratelimit:';

  constructor() {
    this.initRedis();
  }

  private initRedis(): void {
    const redisHost = process.env.REDIS_HOST || 'localhost';
    const redisPort = Number(process.env.REDIS_PORT) || 6379;
    const redisPassword = process.env.REDIS_PASSWORD || undefined;

    try {
      this.redis = new Redis({
        host: redisHost,
        port: redisPort,
        password: redisPassword,
        lazyConnect: true,
      });

      this.redis.on('error', () => {
        this.redis = null;
      });

      this.redis.connect().catch(() => {
        this.redis = null;
      });
    } catch {
      this.redis = null;
    }
  }

  /**
   * Vérifie si l'utilisateur a dépassé le rate limit
   * @param userId ID de l'utilisateur
   * @param tenantId ID du tenant
   * @param customLimit Nombre de requêtes autorisées (optionnel)
   * @param customWindow Fenêtre de temps en secondes (optionnel)
   * @returns { allowed: boolean, remaining: number, resetAt: number }
   */
  async checkRateLimit(
    userId: string,
    tenantId: string,
    customLimit?: number,
    customWindow?: number,
  ): Promise<{ allowed: boolean; remaining: number; resetAt: number }> {
    const limit = customLimit || this.DEFAULT_LIMIT;
    const window = customWindow || this.DEFAULT_WINDOW;
    const key = `${this.WINDOW_PREFIX}${tenantId}:${userId}`;

    // Fallback simple en mémoire si Redis non disponible
    if (!this.redis) {
      return this.fallbackCheck(userId, limit, window);
    }

    try {
      const now = Math.floor(Date.now() / 1000);
      const resetAt = now + window;

      // Utiliser MULTI pour atomicité
      const pipeline = this.redis.multi();
      pipeline.incr(key);
      pipeline.expire(key, window);
      const results = await pipeline.exec();

      const count = results?.[0]?.[1] as number || 1;
      const remaining = Math.max(0, limit - count);
      const allowed = count <= limit;

      if (!allowed) {
        this.logger.warn(`Rate limit dépassé pour ${key}: ${count}/${limit}`);
      }

      return { allowed, remaining, resetAt };
    } catch (error) {
      this.logger.warn('Erreur rate limit Redis, fallback', error.message);
      return this.fallbackCheck(userId, limit, window);
    }
  }

  /**
   * Vérification fallback en mémoire
   */
  private fallbackCheck(
    userId: string,
    limit: number,
    window: number,
  ): { allowed: boolean; remaining: number; resetAt: number } {
    const now = Date.now();
    const resetAt = now + window * 1000;

    // Utiliser un Map simple pour le fallback
    const key = `fallback:${userId}`;
    const record = RateLimitService.fallbackStore.get(key);

    if (!record || now > record.resetAt) {
      RateLimitService.fallbackStore.set(key, { count: 1, resetAt });
      return { allowed: true, remaining: limit - 1, resetAt };
    }

    if (record.count >= limit) {
      return { allowed: false, remaining: 0, resetAt: record.resetAt };
    }

    record.count++;
    return { allowed: true, remaining: limit - record.count, resetAt };
  }

  private static fallbackStore = new Map<string, { count: number; resetAt: number }>();

  /**
   * Réserve une requête (décrémente le compteur)
   * Utile pour les requêtes coûteuses
   */
  async reserveRequest(
    userId: string,
    tenantId: string,
  ): Promise<{ allowed: boolean; remaining: number; cost?: number }> {
    const result = await this.checkRateLimit(userId, tenantId);

    if (!result.allowed) {
      throw new HttpException(
        {
          statusCode: HttpStatus.TOO_MANY_REQUESTS,
          message: 'Limite de requêtes atteinte. Veuillez réessayer plus tard.',
          retryAfter: Math.ceil((result.resetAt - Date.now()) / 1000),
        },
        HttpStatus.TOO_MANY_REQUESTS,
      );
    }

    return {
      allowed: true,
      remaining: result.remaining,
      cost: 1,
    };
  }

  /**
   * Retourne la configuration du rate limit pour un utilisateur
   */
  async getConfig(userId: string, tenantId: string): Promise<{
    limit: number;
    window: number;
    remaining: number;
    resetAt: number;
  }> {
    const limit = this.DEFAULT_LIMIT;
    const window = this.DEFAULT_WINDOW;
    const { remaining, resetAt } = await this.checkRateLimit(userId, tenantId);

    return { limit, window, remaining, resetAt };
  }

  /**
   * Réinitialise le rate limit d'un utilisateur (admin only)
   */
  async resetLimit(userId: string, tenantId: string): Promise<void> {
    const key = `${this.WINDOW_PREFIX}${tenantId}:${userId}`;

    if (this.redis) {
      await this.redis.del(key);
    } else {
      RateLimitService.fallbackStore.delete(`fallback:${userId}`);
    }

    this.logger.log(`Rate limit réinitialisé pour ${key}`);
  }
}
