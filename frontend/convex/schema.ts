import { defineSchema, defineTable } from "convex/server";
import { v } from "convex/values";

export default defineSchema({
  nftVisibility: defineTable({
    chainId: v.number(),
    contract: v.string(),
    tokenId: v.string(),
    hidden: v.boolean(),
    explicit: v.boolean(),
  }).index("by_contract_token", ["contract", "tokenId"]),
});
