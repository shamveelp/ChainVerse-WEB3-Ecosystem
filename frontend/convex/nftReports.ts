import { mutation, query } from "./_generated/server";
import { v } from "convex/values";

// Create a new report
export const createReport = mutation({
    args: {
        tokenId: v.string(),
        reason: v.string(),
        detailedReason: v.optional(v.string()),
        reporterId: v.optional(v.string()),
    },
    handler: async (ctx, args) => {
        await ctx.db.insert("nftReports", {
            tokenId: args.tokenId,
            reason: args.reason,
            detailedReason: args.detailedReason,
            status: "pending",
            reporterId: args.reporterId,
            createdAt: Date.now(),
        });
    },
});

// Get all reports (for admin)
export const getReports = query({
    args: {},
    handler: async (ctx) => {
        return await ctx.db.query("nftReports").order("desc").collect();
    },
});

// Resolve a report
export const resolveReport = mutation({
    args: {
        id: v.id("nftReports"),
    },
    handler: async (ctx, args) => {
        await ctx.db.patch(args.id, {
            status: "solved",
        });
    },
});
