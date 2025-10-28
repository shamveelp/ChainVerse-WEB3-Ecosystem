import { injectable } from "inversify";
import { Types } from "mongoose";
import { IChainCastRepository } from "../../core/interfaces/repositories/chainCast/IChainCastRepository";
import ChainCastModel, { IChainCast } from "../../models/chainCast.model";
import ChainCastParticipantModel, { IChainCastParticipant } from "../../models/chainCastParticipant.model";
import ChainCastReactionModel, { IChainCastReaction } from "../../models/chainCastReaction.model";
import ChainCastModerationRequestModel, { IChainCastModerationRequest } from "../../models/chainCastModerationRequest.model";

@injectable()
export class ChainCastRepository implements IChainCastRepository {
    
    // ChainCast operations
    async createChainCast(data: Partial<IChainCast>): Promise<IChainCast> {
        const chainCast = new ChainCastModel(data);
        return await chainCast.save();
    }

    async findChainCastById(id: string): Promise<IChainCast | null> {
        return await ChainCastModel.findById(id)
            .populate('adminId', 'name profilePicture email')
            .populate('communityId', 'communityName username logo')
            .lean();
    }

    async findChainCastsByAdmin(
        adminId: string, 
        skip: number, 
        limit: number, 
        status?: string
    ): Promise<{ chainCasts: IChainCast[], total: number }> {
        const query: any = { adminId, isActive: true };
        
        if (status && status !== 'all') {
            query.status = status;
        }

        const [chainCasts, total] = await Promise.all([
            ChainCastModel.find(query)
                .populate('adminId', 'name profilePicture email')
                .populate('communityId', 'communityName username logo')
                .sort({ createdAt: -1 })
                .skip(skip)
                .limit(limit)
                .lean(),
            ChainCastModel.countDocuments(query)
        ]);

        return { chainCasts, total };
    }

    async findChainCastsByCommunity(
        communityId: string, 
        skip: number, 
        limit: number, 
        status?: string
    ): Promise<{ chainCasts: IChainCast[], total: number }> {
        const query: any = { communityId, isActive: true };
        
        if (status && status !== 'all') {
            query.status = status;
        }

        const [chainCasts, total] = await Promise.all([
            ChainCastModel.find(query)
                .populate('adminId', 'name profilePicture email')
                .sort({ createdAt: -1 })
                .skip(skip)
                .limit(limit)
                .lean(),
            ChainCastModel.countDocuments(query)
        ]);

        return { chainCasts, total };
    }

    async updateChainCast(id: string, data: Partial<IChainCast>): Promise<IChainCast | null> {
        return await ChainCastModel.findByIdAndUpdate(
            id,
            { ...data, updatedAt: new Date() },
            { new: true }
        ).populate('adminId', 'name profilePicture email');
    }

    async deleteChainCast(id: string): Promise<boolean> {
        const result = await ChainCastModel.findByIdAndUpdate(
            id,
            { isActive: false, updatedAt: new Date() }
        );
        return !!result;
    }

    async findActiveChainCastByCommunity(communityId: string): Promise<IChainCast | null> {
        return await ChainCastModel.findOne({
            communityId,
            status: 'live',
            isActive: true
        }).populate('adminId', 'name profilePicture email');
    }

    // Participant operations
    async createParticipant(data: Partial<IChainCastParticipant>): Promise<IChainCastParticipant> {
        const participant = new ChainCastParticipantModel(data);
        return await participant.save();
    }

    async findParticipantByChainCastAndUser(
        chainCastId: string, 
        userId: string
    ): Promise<IChainCastParticipant | null> {
        return await ChainCastParticipantModel.findOne({
            chainCastId,
            userId,
            isActive: true
        }).populate('userId', 'username name profilePic isVerified');
    }

    async findParticipantsByChainCast(
        chainCastId: string, 
        skip: number, 
        limit: number, 
        filter?: string
    ): Promise<{ participants: IChainCastParticipant[], total: number }> {
        const query: any = { chainCastId, isActive: true };
        
        if (filter === 'moderators') {
            query.role = { $in: ['moderator', 'admin'] };
        } else if (filter === 'active') {
            query.leftAt = { $exists: false };
        }

        const [participants, total] = await Promise.all([
            ChainCastParticipantModel.find(query)
                .populate('userId', 'username name profilePic isVerified')
                .sort({ joinedAt: -1 })
                .skip(skip)
                .limit(limit)
                .lean(),
            ChainCastParticipantModel.countDocuments(query)
        ]);

        return { participants, total };
    }

    async updateParticipant(
        chainCastId: string, 
        userId: string, 
        data: Partial<IChainCastParticipant>
    ): Promise<IChainCastParticipant | null> {
        return await ChainCastParticipantModel.findOneAndUpdate(
            { chainCastId, userId, isActive: true },
            { ...data, updatedAt: new Date() },
            { new: true }
        ).populate('userId', 'username name profilePic isVerified');
    }

    async updateParticipantRole(
        chainCastId: string, 
        userId: string, 
        role: string, 
        permissions: any
    ): Promise<IChainCastParticipant | null> {
        return await ChainCastParticipantModel.findOneAndUpdate(
            { chainCastId, userId, isActive: true },
            { 
                role, 
                permissions, 
                updatedAt: new Date() 
            },
            { new: true }
        ).populate('userId', 'username name profilePic isVerified');
    }

    async removeParticipant(chainCastId: string, userId: string): Promise<boolean> {
        const result = await ChainCastParticipantModel.findOneAndUpdate(
            { chainCastId, userId, isActive: true },
            { 
                isActive: false, 
                leftAt: new Date(),
                updatedAt: new Date()
            }
        );
        return !!result;
    }

    async getActiveParticipantsCount(chainCastId: string): Promise<number> {
        return await ChainCastParticipantModel.countDocuments({
            chainCastId,
            isActive: true,
            leftAt: { $exists: false }
        });
    }

    async getModeratorsCount(chainCastId: string): Promise<number> {
        return await ChainCastParticipantModel.countDocuments({
            chainCastId,
            isActive: true,
            role: { $in: ['moderator', 'admin'] }
        });
    }

    // Reaction operations
    async createReaction(data: Partial<IChainCastReaction>): Promise<IChainCastReaction> {
        const reaction = new ChainCastReactionModel(data);
        return await reaction.save();
    }

    async findReactionsByChainCast(
        chainCastId: string, 
        skip: number, 
        limit: number
    ): Promise<{ reactions: IChainCastReaction[], total: number }> {
        const [reactions, total] = await Promise.all([
            ChainCastReactionModel.find({ chainCastId, isActive: true })
                .populate('userId', 'username name profilePic')
                .sort({ timestamp: -1 })
                .skip(skip)
                .limit(limit)
                .lean(),
            ChainCastReactionModel.countDocuments({ chainCastId, isActive: true })
        ]);

        return { reactions, total };
    }

    async getReactionsSummary(chainCastId: string): Promise<{ [emoji: string]: number }> {
        const pipeline = [
            { $match: { chainCastId: new Types.ObjectId(chainCastId), isActive: true } },
            { $group: { _id: '$emoji', count: { $sum: 1 } } },
            { $sort: { count: -1 } }
        ];

        const results = await ChainCastReactionModel.aggregate(pipeline as any);
        const summary: { [emoji: string]: number } = {};
        
        results.forEach(result => {
            summary[result._id] = result.count;
        });

        return summary;
    }

    async deleteReaction(id: string): Promise<boolean> {
        const result = await ChainCastReactionModel.findByIdAndUpdate(
            id,
            { isActive: false }
        );
        return !!result;
    }

    // Moderation Request operations
    async createModerationRequest(data: Partial<IChainCastModerationRequest>): Promise<IChainCastModerationRequest> {
        const request = new ChainCastModerationRequestModel(data);
        return await request.save();
    }

    async findModerationRequestById(id: string): Promise<IChainCastModerationRequest | null> {
        return await ChainCastModerationRequestModel.findById(id)
            .populate('userId', 'username name profilePic')
            .populate('reviewedBy', 'name')
            .lean();
    }

    async findModerationRequestsByChainCast(
        chainCastId: string, 
        skip: number, 
        limit: number, 
        status?: string
    ): Promise<{ requests: IChainCastModerationRequest[], total: number }> {
        const query: any = { chainCastId, isActive: true };
        
        if (status && status !== 'all') {
            query.status = status;
        }

        const [requests, total] = await Promise.all([
            ChainCastModerationRequestModel.find(query)
                .populate('userId', 'username name profilePic')
                .populate('reviewedBy', 'name')
                .sort({ createdAt: -1 })
                .skip(skip)
                .limit(limit)
                .lean(),
            ChainCastModerationRequestModel.countDocuments(query)
        ]);

        return { requests, total };
    }

    async findPendingModerationRequestByUser(
        chainCastId: string, 
        userId: string
    ): Promise<IChainCastModerationRequest | null> {
        return await ChainCastModerationRequestModel.findOne({
            chainCastId,
            userId,
            status: 'pending',
            isActive: true,
            expiresAt: { $gt: new Date() }
        });
    }

    async updateModerationRequest(
        id: string, 
        data: Partial<IChainCastModerationRequest>
    ): Promise<IChainCastModerationRequest | null> {
        return await ChainCastModerationRequestModel.findByIdAndUpdate(
            id,
            { ...data, updatedAt: new Date() },
            { new: true }
        ).populate('userId', 'username name profilePic');
    }

    async getPendingModerationRequestsCount(chainCastId: string): Promise<number> {
        return await ChainCastModerationRequestModel.countDocuments({
            chainCastId,
            status: 'pending',
            isActive: true,
            expiresAt: { $gt: new Date() }
        });
    }

    // Analytics operations
    async updateChainCastStats(chainCastId: string, stats: Partial<IChainCast['stats']>): Promise<void> {
        await ChainCastModel.findByIdAndUpdate(
            chainCastId,
            { 
                $inc: stats,
                updatedAt: new Date()
            }
        );
    }

    async getChainCastAnalytics(
        communityId: string, 
        startDate?: Date, 
        endDate?: Date
    ): Promise<any> {
        const matchQuery: any = { communityId: new Types.ObjectId(communityId) };
        
        if (startDate && endDate) {
            matchQuery.createdAt = { $gte: startDate, $lte: endDate };
        }

        const pipeline = [
            { $match: matchQuery },
            {
                $group: {
                    _id: null,
                    totalChainCasts: { $sum: 1 },
                    liveChainCasts: {
                        $sum: { $cond: [{ $eq: ['$status', 'live'] }, 1, 0] }
                    },
                    completedChainCasts: {
                        $sum: { $cond: [{ $eq: ['$status', 'ended'] }, 1, 0] }
                    },
                    totalViews: { $sum: '$stats.totalViews' },
                    totalReactions: { $sum: '$stats.totalReactions' },
                    averageViewers: { $avg: '$stats.peakViewers' },
                    averageWatchTime: { $avg: '$stats.averageWatchTime' }
                }
            }
        ];

        const results = await ChainCastModel.aggregate(pipeline);
        return results[0] || {
            totalChainCasts: 0,
            liveChainCasts: 0,
            completedChainCasts: 0,
            totalViews: 0,
            totalReactions: 0,
            averageViewers: 0,
            averageWatchTime: 0
        };
    }
}