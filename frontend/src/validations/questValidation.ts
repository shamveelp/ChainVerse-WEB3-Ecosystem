import { z } from "zod";

const dateSchema = z.preprocess((val) => {
  if (val instanceof Date) return val;
  if (typeof val === "string" || typeof val === "number") {
    const parsed = new Date(val);
    if (!isNaN(parsed.getTime())) return parsed;
  }
  return undefined;
}, z.date({ message: "Please select a valid date" }));

const taskConfigSchema = z.object({
  communityId: z.string().trim().min(1, "Select a community").optional(),
  communityName: z.string().trim().min(1, "Select a community").optional(),
  communityUsername: z.string().trim().optional(),
  targetUserId: z.string().trim().optional(),
  targetUsername: z.string().trim().optional(),
  twitterText: z.string().trim().optional(),
  twitterHashtags: z.array(z.string().trim().min(1)).max(5, "Max 5 hashtags").optional(),
  contractAddress: z.string().trim().optional(),
  tokenId: z.string().trim().optional(),
  tokenAddress: z.string().trim().optional(),
  minimumAmount: z.number().positive("Minimum amount must be > 0").optional(),
  customInstructions: z.string().trim().optional(),
  requiresProof: z.boolean().optional(),
  proofType: z.enum(["text", "image", "link"]).optional(),
});

const questTaskSchema = z.object({
  title: z.string().trim().min(5, "Task title must be at least 5 characters"),
  description: z.string().trim().min(15, "Task description must be at least 15 characters"),
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
  config: taskConfigSchema.default({}),
}).superRefine((task, ctx) => {
  const cfg = task.config || {};

  switch (task.taskType) {
    case "join_community":
      if (!cfg.communityId || !cfg.communityName) {
        ctx.addIssue({
          code: z.ZodIssueCode.custom,
          path: ["config", "communityId"],
          message: "Select a community for this task",
        });
      }
      break;
    case "follow_user":
      if (!cfg.targetUserId || !cfg.targetUsername) {
        ctx.addIssue({
          code: z.ZodIssueCode.custom,
          path: ["config", "targetUserId"],
          message: "Select a user to follow",
        });
      }
      break;
    case "twitter_post":
      if (!cfg.twitterText || cfg.twitterText.trim().length < 20) {
        ctx.addIssue({
          code: z.ZodIssueCode.custom,
          path: ["config", "twitterText"],
          message: "Add tweet copy (min 20 characters)",
        });
      }
      break;
    case "upload_screenshot":
    case "custom":
      if (!cfg.customInstructions || cfg.customInstructions.trim().length < 10) {
        ctx.addIssue({
          code: z.ZodIssueCode.custom,
          path: ["config", "customInstructions"],
          message: "Add clear instructions",
        });
      }
      break;
    case "nft_mint":
      if (!cfg.contractAddress || cfg.contractAddress.length !== 42 || !cfg.contractAddress.startsWith("0x")) {
        ctx.addIssue({
          code: z.ZodIssueCode.custom,
          path: ["config", "contractAddress"],
          message: "Provide a valid contract address",
        });
      }
      break;
    case "token_hold":
      if (!cfg.tokenAddress || cfg.tokenAddress.length !== 42 || !cfg.tokenAddress.startsWith("0x")) {
        ctx.addIssue({
          code: z.ZodIssueCode.custom,
          path: ["config", "tokenAddress"],
          message: "Provide a valid token address",
        });
      }
      if (typeof cfg.minimumAmount !== "number" || cfg.minimumAmount <= 0) {
        ctx.addIssue({
          code: z.ZodIssueCode.custom,
          path: ["config", "minimumAmount"],
          message: "Set the minimum amount",
        });
      }
      break;
    default:
      break;
  }
});

export const manualQuestSchema = z
  .object({
    title: z.string().trim().min(10, "Quest title must be at least 10 characters").max(120),
    description: z.string().trim().min(30, "Quest description must be at least 30 characters").max(2000),
    bannerImage: z.string().url().optional().or(z.literal("")),
    startDate: dateSchema,
    endDate: dateSchema,
    selectionMethod: z.enum(["fcfs", "random"]),
    participantLimit: z.number().int().min(1).max(10000),
    rewardPool: z.object({
      amount: z.number().positive("Reward amount must be greater than 0"),
      currency: z.string().trim().min(1, "Currency is required").max(10),
      rewardType: z.enum(["token", "nft", "points", "custom"]),
      customReward: z.string().trim().optional(),
    }).superRefine((reward, ctx) => {
      if (reward.rewardType === "custom" && !reward.customReward) {
        ctx.addIssue({
          code: z.ZodIssueCode.custom,
          path: ["customReward"],
          message: "Describe the custom reward",
        });
      }
    }),
    tasks: z.array(questTaskSchema).min(1, "Add at least one task").max(10, "Limit quests to 10 tasks"),
  })
  .superRefine((quest, ctx) => {
    if (quest.startDate <= new Date()) {
      ctx.addIssue({
        code: z.ZodIssueCode.custom,
        path: ["startDate"],
        message: "Start date must be in the future",
      });
    }

    if (quest.endDate <= quest.startDate) {
      ctx.addIssue({
        code: z.ZodIssueCode.custom,
        path: ["endDate"],
        message: "End date must be after the start date",
      });
    }

    if (quest.endDate.getTime() - quest.startDate.getTime() < 60 * 60 * 1000) {
      ctx.addIssue({
        code: z.ZodIssueCode.custom,
        path: ["endDate"],
        message: "Quest duration must be at least 1 hour",
      });
    }
  });

export type ManualQuestFormInput = z.infer<typeof manualQuestSchema>;

