import { mutation, query } from "./_generated/server";
import { v } from "convex/values";

export const setVisibility = mutation({
    args: {
        chainId: v.number(),
        contract: v.string(),
        tokenId: v.string(),
        hidden: v.boolean(),
    },
    handler: async (ctx, args) => {
        const existing = await ctx.db
            .query("nftVisibility")
            .withIndex("by_contract_token", q =>
                q.eq("contract", args.contract).eq("tokenId", args.tokenId)
            )
            .first();

        if (existing) {
            await ctx.db.patch(existing._id, {
                hidden: args.hidden,
            });
        } else {
            await ctx.db.insert("nftVisibility", {
                chainId: args.chainId,
                contract: args.contract,
                tokenId: args.tokenId,
                hidden: args.hidden,
                explicit: true,
                createdAfterModeration: true,
            });
        }
    },
});

export const getHiddenTokenIds = query({
    args: {
        contract: v.string(),
    },
    handler: async (ctx, args) => {
        const rows = await ctx.db
            .query("nftVisibility")
            .withIndex("by_contract_token", q => q.eq("contract", args.contract))
            .collect();

        return rows.filter(r => r.hidden).map(r => r.tokenId);
    },
});
