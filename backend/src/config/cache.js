import { LRUCache } from 'lru-cache';
import { logger } from './logger.js';

/**
 * Stale-while-revalidate LRU cache with circuit-breaker fallback.
 * Stores entries for up to 24h so expired ("stale") snapshots remain available
 * whenever live upstream APIs fail or time out.
 */
export class SwrCache {
  constructor({ max = 250, staleTtlMs = 24 * 60 * 60 * 1000 } = {}) {
    this.store = new LRUCache({ max, ttl: staleTtlMs });
    this.inflight = new Map();
  }

  getEntry(key) {
    return this.store.get(key) || null;
  }

  setEntry(key, value, freshTtlMs) {
    const now = Date.now();
    const entry = {
      value,
      updatedAt: now,
      freshUntil: now + freshTtlMs,
    };
    this.store.set(key, entry);
    return entry;
  }

  /**
   * Returns fresh cached data immediately (<200ms), or stale data immediately while
   * refreshing in the background, or awaits live fetcher with fallback to stale/seed.
   */
  async getOrFetch(key, { freshTtlMs, fetcher, fallback }) {
    const existing = this.getEntry(key);
    const now = Date.now();

    if (existing && now < existing.freshUntil) {
      return {
        data: existing.value,
        cacheState: 'hit-fresh',
        isStale: false,
        cachedAt: new Date(existing.updatedAt).toISOString(),
      };
    }

    if (existing) {
      this.#refreshInBackground(key, freshTtlMs, fetcher);
      return {
        data: existing.value,
        cacheState: 'hit-stale',
        isStale: true,
        cachedAt: new Date(existing.updatedAt).toISOString(),
      };
    }

    try {
      const freshValue = await this.#dedupedFetch(key, fetcher);
      const saved = this.setEntry(key, freshValue, freshTtlMs);
      return {
        data: saved.value,
        cacheState: 'miss-live',
        isStale: false,
        cachedAt: new Date(saved.updatedAt).toISOString(),
      };
    } catch (err) {
      logger.warn('Live fetch failed; falling back to seed/stale data', {
        key,
        error: err.message,
      });
      const fallbackValue = typeof fallback === 'function' ? fallback() : fallback;
      const saved = this.setEntry(key, fallbackValue, Math.min(freshTtlMs, 120_000));
      return {
        data: saved.value,
        cacheState: 'fallback-sample',
        isStale: true,
        cachedAt: new Date(saved.updatedAt).toISOString(),
      };
    }
  }

  #refreshInBackground(key, freshTtlMs, fetcher) {
    if (this.inflight.has(key)) return;
    this.#dedupedFetch(key, fetcher)
      .then((value) => {
        this.setEntry(key, value, freshTtlMs);
      })
      .catch((err) => {
        logger.warn('Background SWR refresh failed; keeping stale data', {
          key,
          error: err.message,
        });
      });
  }

  #dedupedFetch(key, fetcher) {
    if (this.inflight.has(key)) {
      return this.inflight.get(key);
    }
    const promise = Promise.resolve()
      .then(fetcher)
      .finally(() => {
        this.inflight.delete(key);
      });
    this.inflight.set(key, promise);
    return promise;
  }

  clear() {
    this.store.clear();
    this.inflight.clear();
  }
}

export const appCache = new SwrCache();
