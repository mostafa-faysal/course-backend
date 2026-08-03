export interface ICacheProvider {
  /**
   * Retrieve a cached value by key. Returns null if missing or expired.
   */
  get<T>(key: string): Promise<T | null>;

  /**
   * Store a value with a specific Time To Live (TTL) in seconds and optional categorization tags.
   */
  set<T>(key: string, value: T, ttlSeconds: number, tags?: string[]): Promise<void>;

  /**
   * Delete a specific key from the cache.
   */
  delete(key: string): Promise<void>;

  /**
   * Invalidate and clear all cache entries associated with a specific tag (e.g., 'home-featured').
   */
  invalidateByTag(tag: string): Promise<void>;

  /**
   * Clear all entries matching a key prefix.
   */
  clearByPrefix(prefix: string): Promise<void>;

  /**
   * Complete reset of the entire cache store.
   */
  clear(): Promise<void>;
}
