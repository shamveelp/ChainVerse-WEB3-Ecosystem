import { z } from "zod";
import { CustomError } from "../utils/customError";
import { StatusCode } from "../enums/statusCode.enum";

const dateSchema = z.preprocess((val) => {
  if (val instanceof Date) {
    return val;
  }
  if (typeof val === "string" || typeof val === "number") {
    const parsed = new Date(val);
    if (!isNaN(parsed.getTime())) {
      return parsed;
    }
  }
  return new Date();
}, z.date({ message: "Invalid date value" }));

const baseTaskConfigSchema = z.object({
  communityId: z.string().optional(),
  communityName: z.string().optional(),
  communityUsername: z.string().optional(),
  targetUserId: z.string().optional(),
  targetUsername: z.string().optional(),
  twitterText: z.string().optional(),
  twitterHashtags: z.array(z.string()).optional().default([]),
  contractAddress: z.string().optional(),
  tokenId: z.string().optional(),
  tokenAddress: z.string().optional(),
  minimumAmount: z.number().optional(),
  customInstructions: z.string().optional(),
  requiresProof: z.boolean().optional().default(true),
  proofType: z.enum(["text", "image", "link"]).optional().default("image"),
}).default({
  twitterHashtags: [],
  requiresProof: true,
  proofType: "image",
});

const questTaskSchema = z.object({
  title: z.string().min(1, "Task title is required"),
  description: z.string().min(1, "Task description is required"),
  taskType: z.enum([
    "join_community",
    "follow_user",
    "twitter_post",
    "upload_screenshot",
    "nft_mint",
    "token_hold",
    "wallet_connect",
    "custom",
  ]),
  isRequired: z.boolean().default(true),
  order: z.number().int().min(1),
  privilegePoints: z.number().min(1).max(10).optional(),
  config: baseTaskConfigSchema,
});

export const manualQuestSchema = z.object({
  title: z.string().min(1, "Quest title is required"),
  description: z.string().min(1, "Quest description is required"),
  bannerImage: z.string().optional(),
  startDate: dateSchema,
  endDate: dateSchema,
  selectionMethod: z.enum(["fcfs", "random", "leaderboard"]),
  participantLimit: z.number().int().min(1),
  rewardPool: z.object({
    amount: z.number().min(0),
    currency: z.string().min(1),
    rewardType: z.enum(["token", "nft", "points", "custom"]),
    customReward: z.string().optional(),
  }),
  tasks: z.array(questTaskSchema).min(1, "At least one task is required"),
  isAIGenerated: z.boolean().optional().default(false),
  aiPrompt: z.string().optional(),
}).refine((data) => data.endDate > data.startDate, {
  message: "End date must be after start date",
  path: ["endDate"],
});

export type ManualQuestInput = z.infer<typeof manualQuestSchema>;

export const validateManualQuestPayload = (payload: unknown): ManualQuestInput => {
  const validation = manualQuestSchema.safeParse(payload);

  if (!validation.success) {
    const firstIssue = validation.error.issues[0];
    const message = firstIssue?.message || "Invalid quest data";
    throw new CustomError(message, StatusCode.BAD_REQUEST);
  }

  return validation.data;
};