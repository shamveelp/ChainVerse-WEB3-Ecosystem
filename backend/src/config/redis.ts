import { createClient, RedisClientType } from "redis";
import dotenv from "dotenv";
import logger from "../utils/logger";
dotenv.config();

export interface IRedisClient {
  get(key: string): Promise<string | null>;
  set(key: string, value: string, options?: { EX: number }): Promise<string | null>;
  del(key: string): Promise<number>;
  keys(pattern: string): Promise<string[]>;
  isOpen: boolean;
  connect(): Promise<void>;

  sAdd(key: string, member: string): Promise<number>;
  sRem(key: string, member: string): Promise<number>;
  sMembers(key: string): Promise<string[]>;
  sIsMember(key: string, member: string): Promise<number>;
}




const redisClient: RedisClientType = createClient({
    url: process.env.REDIS_URL || "redis://localhost:6379",
});

redisClient.on("error", (err) => logger.error("Redis Client Error", err));
redisClient.on("connect", () => logger.info("Redis client connected"));
redisClient.on("ready", () => logger.info("Redis client is ready"));
redisClient.on("reconnecting", () => logger.info("Redis client is reconnecting"));
redisClient.on("end", () => logger.info("Redis client disconnected"));


async function ensureRedisConnection() {
    if(!redisClient.isOpen) {
        try {
            await redisClient.connect();
            logger.info("Redis client connected Established");
        } catch (error) {
            logger.error("Failed to connect to Redis", error);
            throw error;
        }
    }
}

ensureRedisConnection().catch((error) => {
    logger.error("Error ensuring Redis connection", error);
})


const redisClientWrapper: IRedisClient = {
    get: redisClient.get.bind(redisClient),
    set: redisClient.set.bind(redisClient),
    del: redisClient.del.bind(redisClient),
    keys: redisClient.keys.bind(redisClient),
    isOpen: redisClient.isOpen,
    connect: async () => {
        await redisClient.connect();
    },

    sAdd: redisClient.sAdd.bind(redisClient),
    sRem: redisClient.sRem.bind(redisClient),
    sMembers: redisClient.sMembers.bind(redisClient),
    sIsMember: redisClient.sIsMember.bind(redisClient),
}

export default redisClientWrapper;


