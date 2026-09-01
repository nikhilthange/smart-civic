"use strict";

/**
 * ─── Resilient Distributed Redis Manager & Memory Fallback Store ──────────────
 * Provides a unified caching, distributed lock, and key-value API.
 * Automatically activates Redis when REDIS_URL or REDIS_HOST is configured and
 * package is available, otherwise seamlessly operates in high-performance in-memory mode.
 */

class RedisManager {
  constructor() {
    this.client = null;
    this.isReady = false;
    this.memoryStore = new Map();
    this.memorySortedSets = new Map(); // key -> [{ member, score }]
    this.init();
  }

  async init() {
    const redisUrl = process.env.REDIS_URL || (process.env.REDIS_HOST ? `redis://${process.env.REDIS_HOST}:${process.env.REDIS_PORT || 6379}` : null);
    if (!redisUrl) {
      return;
    }

    try {
      const { createClient } = require("redis");
      this.client = createClient({
        url: redisUrl,
        socket: {
          reconnectStrategy: (retries) => {
            if (retries > 5) return new Error("Redis retry limit reached");
            const jitter = Math.floor(Math.random() * 200);
            return Math.min(retries * 100 + jitter, 3000);
          },
        },
      });

      this.client.on("error", (err) => {
        if (this.isReady) {
          console.warn("⚠️ Redis client warning:", err.message);
        }
        this.isReady = false;
      });

      this.client.on("ready", () => {
        this.isReady = true;
        console.log("⚡ Distributed Redis Cache & Key-Value Store Ready");
      });

      await this.client.connect();
    } catch (err) {
      this.isReady = false;
      this.client = null;
      // Silent fallback to memory store
    }
  }

  /**
   * Set key with TTL in seconds
   */
  async setEx(key, ttlSeconds, value) {
    const strVal = typeof value === "string" ? value : JSON.stringify(value);
    if (this.isReady && this.client) {
      try {
        await this.client.set(key, strVal, { EX: ttlSeconds });
        return true;
      } catch (err) {
        // Fallback to memory
      }
    }
    this.memoryStore.set(key, {
      value: strVal,
      expiresAt: Date.now() + ttlSeconds * 1000,
    });
    return true;
  }

  /**
   * Set key if not exists (Atomic lock / deduplication)
   */
  async setNx(key, ttlSeconds, value) {
    const strVal = typeof value === "string" ? value : JSON.stringify(value);
    if (this.isReady && this.client) {
      try {
        const res = await this.client.set(key, strVal, { NX: true, EX: ttlSeconds });
        return res === "OK";
      } catch {
        // Fallback to memory
      }
    }
    const existing = this.memoryStore.get(key);
    const now = Date.now();
    if (existing && existing.expiresAt > now) {
      return false;
    }
    this.memoryStore.set(key, {
      value: strVal,
      expiresAt: Date.now() + ttlSeconds * 1000,
    });
    return true;
  }

  /**
   * Get key value
   */
  async get(key) {
    if (this.isReady && this.client) {
      try {
        const val = await this.client.get(key);
        return val;
      } catch {
        // Fallback to memory
      }
    }
    const entry = this.memoryStore.get(key);
    if (!entry) return null;
    if (Date.now() > entry.expiresAt) {
      this.memoryStore.delete(key);
      return null;
    }
    return entry.value;
  }

  /**
   * Delete single or multiple keys
   */
  async del(keys) {
    const keyList = Array.isArray(keys) ? keys : [keys];
    if (keyList.length === 0) return 0;

    if (this.isReady && this.client) {
      try {
        return await this.client.del(keyList);
      } catch {
        // Fallback to memory
      }
    }

    let deleted = 0;
    for (const k of keyList) {
      if (this.memoryStore.delete(k)) deleted++;
    }
    return deleted;
  }

  /**
   * Delete all keys matching a prefix or substring pattern
   */
  async invalidatePattern(pattern) {
    if (!pattern) return 0;
    const pat = String(pattern).toLowerCase();

    if (this.isReady && this.client) {
      try {
        const keys = [];
        for await (const k of this.client.scanIterator({ MATCH: `*${pattern}*`, COUNT: 100 })) {
          keys.push(k);
        }
        if (keys.length > 0) {
          await this.client.del(keys);
        }
        return keys.length;
      } catch {
        // Fallback to memory
      }
    }

    let count = 0;
    for (const k of this.memoryStore.keys()) {
      if (k.toLowerCase().includes(pat)) {
        this.memoryStore.delete(k);
        count++;
      }
    }
    return count;
  }

  /**
   * Add member to Sorted Set (Leaderboard)
   */
  async zAdd(key, member, score) {
    if (this.isReady && this.client) {
      try {
        await this.client.zAdd(key, [{ score: Number(score), value: String(member) }]);
        return true;
      } catch {
        // Fallback to memory
      }
    }

    let set = this.memorySortedSets.get(key);
    if (!set) {
      set = [];
      this.memorySortedSets.set(key, set);
    }
    const existingIdx = set.findIndex((item) => item.member === String(member));
    if (existingIdx >= 0) {
      set[existingIdx].score = Number(score);
    } else {
      set.push({ member: String(member), score: Number(score) });
    }
    set.sort((a, b) => b.score - a.score);
    return true;
  }

  /**
   * Increment member score in Sorted Set
   */
  async zIncrBy(key, member, increment) {
    if (this.isReady && this.client) {
      try {
        return await this.client.zIncrBy(key, Number(increment), String(member));
      } catch {
        // Fallback to memory
      }
    }

    let set = this.memorySortedSets.get(key);
    if (!set) {
      set = [];
      this.memorySortedSets.set(key, set);
    }
    const item = set.find((it) => it.member === String(member));
    if (item) {
      item.score += Number(increment);
      set.sort((a, b) => b.score - a.score);
      return item.score;
    } else {
      const newScore = Number(increment);
      set.push({ member: String(member), score: newScore });
      set.sort((a, b) => b.score - a.score);
      return newScore;
    }
  }

  /**
   * Get top N members from Sorted Set (descending order)
   */
  async zRevRangeWithScores(key, start = 0, stop = 19) {
    if (this.isReady && this.client) {
      try {
        const results = await this.client.zRangeWithScores(key, start, stop, { REV: true });
        return results.map((r) => ({ member: r.value, score: r.score }));
      } catch {
        // Fallback to memory
      }
    }

    const set = this.memorySortedSets.get(key) || [];
    return set.slice(start, stop + 1);
  }

  /**
   * Check liveness/health
   */
  isAvailable() {
    return this.isReady;
  }
}

const redisManager = new RedisManager();
module.exports = redisManager;
