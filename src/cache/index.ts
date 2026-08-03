import { MemoryCache } from './memory-cache';
import { ICacheProvider } from './cache.interface';

/**
 * Singleton cache instance behind the ICacheProvider interface.
 * Simply replace `new MemoryCache()` with `new RedisCache()` in production scaling stages without touching service logic!
 */
export const cache: ICacheProvider = new MemoryCache();

export * from './cache.interface';
export * from './cache.constants';
