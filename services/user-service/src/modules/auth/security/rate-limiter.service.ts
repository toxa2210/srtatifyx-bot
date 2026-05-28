/**
 * Rate Limiter Service
 * Prevents brute force attacks and API abuse
 */
import { Injectable } from '@nestjs/common';

interface RateLimitConfig {
  maxAttempts: number;
  windowMs: number;
  blockDurationMs: number;
}

interface AttemptRecord {
  count: number;
  firstAttempt: number;
  blockedUntil?: number;
}

@Injectable()
export class RateLimiterService {
  private attempts: Map<string, AttemptRecord> = new Map();

  private configs: Record<string, RateLimitConfig> = {
    login: {
      maxAttempts: 5,
      windowMs: 15 * 60 * 1000, // 15 minutes
      blockDurationMs: 15 * 60 * 1000, // 15 minutes block
    },
    passwordReset: {
      maxAttempts: 3,
      windowMs: 60 * 60 * 1000, // 1 hour
      blockDurationMs: 60 * 60 * 1000, // 1 hour block
    },
    api: {
      maxAttempts: 1000,
      windowMs: 60 * 60 * 1000, // 1 hour
      blockDurationMs: 5 * 60 * 1000, // 5 minutes block
    },
  };

  /**
   * Check if action is allowed for given key
   */
  isAllowed(key: string, action: string = 'login'): {
    allowed: boolean;
    remaining: number;
    resetIn: number;
  } {
    const config = this.configs[action];
    if (!config) {
      throw new Error(`Unknown rate limit action: ${action}`);
    }

    const now = Date.now();
    const record = this.attempts.get(`${action}:${key}`);

    // Check if currently blocked
    if (record?.blockedUntil && record.blockedUntil > now) {
      return {
        allowed: false,
        remaining: 0,
        resetIn: record.blockedUntil - now,
      };
    }

    // Reset if window expired
    if (record && now - record.firstAttempt > config.windowMs) {
      this.attempts.delete(`${action}:${key}`);
      return {
        allowed: true,
        remaining: config.maxAttempts - 1,
        resetIn: config.windowMs,
      };
    }

    // Check current count
    if (record && record.count >= config.maxAttempts) {
      record.blockedUntil = now + config.blockDurationMs;
      return {
        allowed: false,
        remaining: 0,
        resetIn: config.blockDurationMs,
      };
    }

    return {
      allowed: true,
      remaining: config.maxAttempts - (record?.count || 0) - 1,
      resetIn: config.windowMs - (now - (record?.firstAttempt || now)),
    };
  }

  /**
   * Record an attempt
   */
  recordAttempt(key: string, action: string = 'login'): void {
    const recordKey = `${action}:${key}`;
    const record = this.attempts.get(recordKey);
    const now = Date.now();

    if (!record) {
      this.attempts.set(recordKey, {
        count: 1,
        firstAttempt: now,
      });
    } else {
      record.count++;
    }
  }

  /**
   * Clear attempts (e.g., after successful login)
   */
  clearAttempts(key: string, action: string = 'login'): void {
    this.attempts.delete(`${action}:${key}`);
  }
}
