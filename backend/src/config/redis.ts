import Redis from 'ioredis';
import logger from '../utils/logger';

class RedisClient {
  private client: Redis;

  constructor() {
    this.client = new Redis({
      host: process.env.REDIS_HOST || 'localhost',
      port: parseInt(process.env.REDIS_PORT || '6379'),
    //   password: process.env.REDIS_PASSWORD,
      enableReadyCheck: false,
      maxRetriesPerRequest: null,
    });

    this.client.on('connect', () => {
      logger.info('Redis connected successfully');
    });

    this.client.on('error', (err) => {
      logger.error('Redis connection error:', err);
    });
  }

  async get(key: string): Promise<string | null> {
    return await this.client.get(key);
  }

  async set(key: string, value: string, ttl?: number): Promise<void> {
    if (ttl) {
      await this.client.setex(key, ttl, value);
    } else {
      await this.client.set(key, value);
    }
  }

  async del(key: string): Promise<void> {
    await this.client.del(key);
  }

  async exists(key: string): Promise<boolean> {
    const result = await this.client.exists(key);
    return result === 1;
  }

  async setHash(key: string, data: Record<string, any>, ttl?: number): Promise<void> {
    await this.client.hmset(key, data);
    if (ttl) {
      await this.client.expire(key, ttl);
    }
  }

  async getHash(key: string): Promise<Record<string, string>> {
    return await this.client.hgetall(key);
  }

  async incr(key: string, ttl?: number): Promise<number> {
    const result = await this.client.incr(key);
    if (ttl && result === 1) {
      await this.client.expire(key, ttl);
    }
    return result;
  }

  // Community-specific methods
  async setCommunityApplication(email: string, data: any, ttl: number = 3600): Promise<void> {
    const key = `community_app:${email}`;
    await this.setHash(key, {
      ...data,
      createdAt: new Date().toISOString(),
      status: 'pending'
    }, ttl);
  }

  async getCommunityApplication(email: string): Promise<any> {
    const key = `community_app:${email}`;
    const data = await this.getHash(key);
    return Object.keys(data).length > 0 ? data : null;
  }

  async deleteCommunityApplication(email: string): Promise<void> {
    const key = `community_app:${email}`;
    await this.del(key);
  }

  // OTP methods
  async setOTP(email: string, otp: string, type: 'registration' | 'forgot_password' = 'registration', ttl: number = 600): Promise<void> {
    const key = `otp:${type}:${email}`;
    await this.set(key, otp, ttl);
  }

  async getOTP(email: string, type: 'registration' | 'forgot_password' = 'registration'): Promise<string | null> {
    const key = `otp:${type}:${email}`;
    return await this.get(key);
  }

  async deleteOTP(email: string, type: 'registration' | 'forgot_password' = 'registration'): Promise<void> {
    const key = `otp:${type}:${email}`;
    await this.del(key);
  }

  // Rate limiting
  async checkRateLimit(identifier: string, maxAttempts: number = 5, windowMinutes: number = 15): Promise<{ allowed: boolean; attemptsLeft: number }> {
    const key = `rate_limit:${identifier}`;
    const attempts = await this.incr(key, windowMinutes * 60);
    
    return {
      allowed: attempts <= maxAttempts,
      attemptsLeft: Math.max(0, maxAttempts - attempts)
    };
  }

  async disconnect(): Promise<void> {
    await this.client.disconnect();
  }
}

export const redisClient = new RedisClient();
export default redisClient;