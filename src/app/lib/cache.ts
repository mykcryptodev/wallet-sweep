import redis from './redis';

export interface CacheOptions {
  ttl?: number; // Time to live in seconds
  namespace?: string; // Optional namespace for cache keys
}

/**
 * Generate a cache key with optional namespace
 */
export function generateCacheKey(key: string, namespace?: string): string {
  return namespace ? `${namespace}:${key}` : key;
}

/**
 * Get data from cache or fetch fresh data if cache miss
 * @param key Cache key
 * @param fetcher Function to fetch fresh data
 * @param options Cache options
 */
export async function getOrSetCache<T>(
  key: string,
  fetcher: () => Promise<T>,
  options: CacheOptions = {}
): Promise<T> {
  const { ttl = 3600, namespace } = options; // Default TTL: 1 hour
  const cacheKey = generateCacheKey(key, namespace);

  try {
    // Try to get from cache
    const cached = await redis.get(cacheKey);
    if (cached) {
      console.log(`Cache hit for key: ${cacheKey}`);
      return cached as T;
    }

    console.log(`Cache miss for key: ${cacheKey}`);
    // Fetch fresh data
    const freshData = await fetcher();

    // Store in cache
    if (ttl > 0) {
      await redis.set(cacheKey, freshData, { ex: ttl });
      console.log(`Cached data for key: ${cacheKey} with TTL: ${ttl}s`);
    } else {
      await redis.set(cacheKey, freshData);
      console.log(`Cached data for key: ${cacheKey} without expiration`);
    }

    return freshData;
  } catch (error) {
    console.error(`Cache error for key ${cacheKey}:`, error);
    // If Redis fails, fallback to fetcher
    return fetcher();
  }
}

/**
 * Get data from cache
 */
export async function getFromCache<T>(
  key: string,
  namespace?: string
): Promise<T | null> {
  const cacheKey = generateCacheKey(key, namespace);

  try {
    const cached = await redis.get(cacheKey);
    return cached as T;
  } catch (error) {
    console.error(`Error getting from cache for key ${cacheKey}:`, error);
    return null;
  }
}

/**
 * Set data in cache
 */
export async function setCache<T>(
  key: string,
  data: T,
  options: CacheOptions = {}
): Promise<boolean> {
  const { ttl = 3600, namespace } = options;
  const cacheKey = generateCacheKey(key, namespace);

  try {
    if (ttl > 0) {
      await redis.set(cacheKey, data, { ex: ttl });
    } else {
      await redis.set(cacheKey, data);
    }
    console.log(`Set cache for key: ${cacheKey}`);
    return true;
  } catch (error) {
    console.error(`Error setting cache for key ${cacheKey}:`, error);
    return false;
  }
}

/**
 * Invalidate a single cache entry
 */
export async function invalidateCache(
  key: string,
  namespace?: string
): Promise<boolean> {
  const cacheKey = generateCacheKey(key, namespace);

  try {
    const result = await redis.del(cacheKey);
    console.log(`Invalidated cache for key: ${cacheKey}`);
    return result === 1;
  } catch (error) {
    console.error(`Error invalidating cache for key ${cacheKey}:`, error);
    return false;
  }
}

/**
 * Invalidate multiple cache entries
 */
export async function invalidateMultiple(
  keys: string[],
  namespace?: string
): Promise<number> {
  if (keys.length === 0) return 0;

  const cacheKeys = keys.map(key => generateCacheKey(key, namespace));

  try {
    const pipeline = redis.pipeline();
    cacheKeys.forEach(key => pipeline.del(key));
    const results = await pipeline.exec();
    
    const deletedCount = results.reduce((acc: number, result: any) => {
      return acc + (result === 1 ? 1 : 0);
    }, 0);
    
    console.log(`Invalidated ${deletedCount} cache entries`);
    return deletedCount;
  } catch (error) {
    console.error('Error invalidating multiple cache entries:', error);
    return 0;
  }
}

/**
 * Invalidate cache entries by pattern
 * Note: This requires scanning keys which can be expensive on large datasets
 */
export async function invalidateByPattern(
  pattern: string,
  namespace?: string
): Promise<number> {
  const searchPattern = namespace ? `${namespace}:${pattern}` : pattern;
  let deletedCount = 0;

  try {
    // Scan for keys matching the pattern
    let cursor = 0;
    do {
      const result = await redis.scan(cursor, {
        match: searchPattern,
        count: 100
      });
      
      cursor = Number(result[0]);
      const keys = result[1] as string[];
      
      if (keys.length > 0) {
        const pipeline = redis.pipeline();
        keys.forEach(key => pipeline.del(key));
        const results = await pipeline.exec();
        
        deletedCount += results.reduce((acc: number, result: any) => {
          return acc + (result === 1 ? 1 : 0);
        }, 0);
      }
    } while (cursor !== 0);

    console.log(`Invalidated ${deletedCount} cache entries matching pattern: ${searchPattern}`);
    return deletedCount;
  } catch (error) {
    console.error(`Error invalidating cache by pattern ${searchPattern}:`, error);
    return 0;
  }
}

/**
 * Clear all cache entries in a namespace
 */
export async function clearNamespace(namespace: string): Promise<number> {
  return invalidateByPattern('*', namespace);
}

/**
 * Check if a cache key exists
 */
export async function cacheExists(
  key: string,
  namespace?: string
): Promise<boolean> {
  const cacheKey = generateCacheKey(key, namespace);

  try {
    const exists = await redis.exists(cacheKey);
    return exists === 1;
  } catch (error) {
    console.error(`Error checking cache existence for key ${cacheKey}:`, error);
    return false;
  }
}

/**
 * Get remaining TTL for a cache key
 */
export async function getCacheTTL(
  key: string,
  namespace?: string
): Promise<number | null> {
  const cacheKey = generateCacheKey(key, namespace);

  try {
    const ttl = await redis.ttl(cacheKey);
    return ttl;
  } catch (error) {
    console.error(`Error getting TTL for key ${cacheKey}:`, error);
    return null;
  }
}

// Cache key helpers for common use cases
export const cacheKeys = {
  // Token-related cache keys
  tokens: (walletAddress: string) => `tokens:${walletAddress.toLowerCase()}`,
  tokenPrice: (tokenAddress: string) => `price:${tokenAddress.toLowerCase()}`,
  
  // Generate cache key for API responses
  apiResponse: (endpoint: string, params?: Record<string, any>) => {
    const paramStr = params ? JSON.stringify(params, Object.keys(params).sort()) : '';
    return `api:${endpoint}:${paramStr}`;
  }
};