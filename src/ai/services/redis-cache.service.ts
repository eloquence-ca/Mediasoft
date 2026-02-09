/**
 * Configuration Redis pour le cache distribué
 * Utilise ioredis pour la gestion du cache
 */

import Redis from 'ioredis';

export interface RedisConfig {
  host: string;
  port: number;
  password?: string;
  db?: number;
  keyPrefix?: string;
}

export interface CacheEntry<T> {
  data: T;
  expiresAt: number;
}

export class RedisCacheService {
  private client: Redis;
  private readonly defaultTTL: number;
  private readonly keyPrefix: string;

  constructor(config?: Partial<RedisConfig>) {
    this.client = new Redis({
      host: config?.host || process.env.REDIS_HOST || 'localhost',
      port: config?.port || Number(process.env.REDIS_PORT) || 6379,
      password: config?.password || process.env.REDIS_PASSWORD,
      db: config?.db || 0,
      retryStrategy: (times: number) => {
        const delay = Math.min(times * 50, 2000);
        return delay;
      },
      maxRetriesPerRequest: 3,
    });

    this.defaultTTL = 5 * 60 * 1000; // 5 minutes
    this.keyPrefix = config?.keyPrefix || 'ai:cache:';

    this.client.on('error', (err) => {
      console.error('Redis Client Error:', err);
    });

    this.client.on('connect', () => {
      console.log('Redis Client Connected');
    });
  }

  /**
   * Génère une clé avec le préfixe
   */
  private getKey(key: string): string {
    return `${this.keyPrefix}${key}`;
  }

  /**
   * Récupère une valeur du cache
   */
  async get<T>(key: string): Promise<T | null> {
    try {
      const value = await this.client.get(this.getKey(key));
      if (!value) return null;

      const entry: CacheEntry<T> = JSON.parse(value);
      
      // Vérifier si l'entrée est expirée
      if (Date.now() > entry.expiresAt) {
        await this.delete(key);
        return null;
      }

      return entry.data;
    } catch (error) {
      console.error('Cache get error:', error);
      return null;
    }
  }

  /**
   * Définit une valeur dans le cache
   */
  async set<T>(key: string, data: T, ttlMs?: number): Promise<void> {
    try {
      const entry: CacheEntry<T> = {
        data,
        expiresAt: Date.now() + (ttlMs || this.defaultTTL),
      };

      await this.client.setex(
        this.getKey(key),
        Math.floor((ttlMs || this.defaultTTL) / 1000),
        JSON.stringify(entry),
      );
    } catch (error) {
      console.error('Cache set error:', error);
    }
  }

  /**
   * Supprime une entrée du cache
   */
  async delete(key: string): Promise<void> {
    try {
      await this.client.del(this.getKey(key));
    } catch (error) {
      console.error('Cache delete error:', error);
    }
  }

  /**
   * Vérifie si une clé existe
   */
  async exists(key: string): Promise<boolean> {
    try {
      return (await this.client.exists(this.getKey(key))) === 1;
    } catch (error) {
      console.error('Cache exists error:', error);
      return false;
    }
  }

  /**
   * Nettoie toutes les entrées expirées (cleanup manuel)
   */
  async cleanup(): Promise<number> {
    try {
      let cursor = '0';
      let deletedCount = 0;

      do {
        const [newCursor, keys] = await this.client.scan(
          cursor,
          'MATCH',
          `${this.keyPrefix}*`,
          'COUNT',
          100,
        );
        cursor = newCursor;

        for (const key of keys) {
          const value = await this.client.get(key);
          if (value) {
            try {
              const entry = JSON.parse(value);
              if (Date.now() > entry.expiresAt) {
                await this.client.del(key);
                deletedCount++;
              }
            } catch {
              // Clé mal formatée, supprimer
              await this.client.del(key);
              deletedCount++;
            }
          }
        }
      } while (cursor !== '0');

      return deletedCount;
    } catch (error) {
      console.error('Cache cleanup error:', error);
      return 0;
    }
  }

  /**
   * Ferme la connexion Redis
   */
  async close(): Promise<void> {
    await this.client.quit();
  }

  /**
   * Obtenir les statistiques du cache
   */
  async getStats(): Promise<{ size: number; hits: number; misses: number }> {
    try {
      let cursor = '0';
      let size = 0;

      do {
        const [newCursor, keys] = await this.client.scan(
          cursor,
          'MATCH',
          `${this.keyPrefix}*`,
          'COUNT',
          100,
        );
        cursor = newCursor;
        size += keys.length;
      } while (cursor !== '0');

      return {
        size,
        hits: 0,
        misses: 0,
      };
    } catch (error) {
      console.error('Cache stats error:', error);
      return { size: 0, hits: 0, misses: 0 };
    }
  }
}

// Singleton instance
let redisCacheInstance: RedisCacheService | null = null;

export function getRedisCacheService(): RedisCacheService {
  if (!redisCacheInstance) {
    redisCacheInstance = new RedisCacheService();
  }
  return redisCacheInstance;
}

export default RedisCacheService;
