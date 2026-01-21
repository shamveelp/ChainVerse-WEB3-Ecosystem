import { defineSchema, defineTable } from "convex/server";
import { v } from "convex/values";

export default defineSchema({
    nftVisibility: defineTable({
        chainId: v.number(),
        contract: v.string(),
        tokenId: v.string(),
        hidden: v.boolean(),
        explicit: v.boolean(),
        createdAfterModeration: v.boolean(),
    }).index("by_contract_token", ["contract", "tokenId"]),
    nftReports: defineTable({
        tokenId: v.string(),
        reason: v.string(),
        detailedReason: v.optional(v.string()),
        status: v.string(), // "pending", "solved"
        reporterId: v.optional(v.string()),
        createdAt: v.number(),
    }).index("by_status", ["status"]).index("by_token", ["tokenId"]),
});
