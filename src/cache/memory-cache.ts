import { ICacheProvider } from './cache.interface';

interface CacheEntry<T> {
  value: T;
  expiresAt: number;
  tags: string[];
}

export class MemoryCache implements ICacheProvider {
  private store: Map<string, CacheEntry<any>> = new Map();
  private tagIndex: Map<string, Set<string>> = new Map();

  public async get<T>(key: string): Promise<T | null> {
    const entry = this.store.get(key);
    if (!entry) {
      return null;
    }

    // Check expiration timestamp
    if (Date.now() > entry.expiresAt) {
      await this.delete(key);
      return null;
    }

    return entry.value as T;
  }

  public async set<T>(key: string, value: T, ttlSeconds: number, tags: string[] = []): Promise<void> {
    // Clean up any existing index references for this key before replacing
    if (this.store.has(key)) {
      await this.delete(key);
    }

    const expiresAt = Date.now() + ttlSeconds * 1000;
    const entry: CacheEntry<T> = { value, expiresAt, tags };
    this.store.set(key, entry);

    // Index tags for O(1) group invalidation
    for (const tag of tags) {
      if (!this.tagIndex.has(tag)) {
        this.tagIndex.set(tag, new Set());
      }
      this.tagIndex.get(tag)!.add(key);
    }
  }

  public async delete(key: string): Promise<void> {
    const entry = this.store.get(key);
    if (entry) {
      for (const tag of entry.tags) {
        const keySet = this.tagIndex.get(tag);
        if (keySet) {
          keySet.delete(key);
          if (keySet.size === 0) {
            this.tagIndex.delete(tag);
          }
        }
      }
    }
    this.store.delete(key);
  }

  public async invalidateByTag(tag: string): Promise<void> {
    const keys = this.tagIndex.get(tag);
    if (keys) {
      // Copy keys array because this.delete modifies the Set during iteration
      const keysToDelete = Array.from(keys);
      for (const key of keysToDelete) {
        await this.delete(key);
      }
    }
  }

  public async clearByPrefix(prefix: string): Promise<void> {
    const keysToDelete: string[] = [];
    for (const key of this.store.keys()) {
      if (key.startsWith(prefix)) {
        keysToDelete.push(key);
      }
    }
    for (const key of keysToDelete) {
      await this.delete(key);
    }
  }

  public async clear(): Promise<void> {
    this.store.clear();
    this.tagIndex.clear();
  }
}
