import { Types } from "mongoose";
import { IChainCast } from "../../../../models/chainCast.model";
import { IChainCastParticipant } from "../../../../models/chainCastParticipant.model";
import { IChainCastReaction } from "../../../../models/chainCastReaction.model";
import { IChainCastModerationRequest } from "../../../../models/chainCastModerationRequest.model";

export interface IChainCastRepository {
    // ChainCast operations
    createChainCast(data: Partial<IChainCast>): Promise<IChainCast>;
    findChainCastById(id: string): Promise<IChainCast | null>;
    findChainCastsByAdmin(adminId: string, skip: number, limit: number, status?: string): Promise<{ chainCasts: IChainCast[], total: number }>;
    findChainCastsByCommunity(communityId: string, skip: number, limit: number, status?: string): Promise<{ chainCasts: IChainCast[], total: number }>;
    updateChainCast(id: string, data: Partial<IChainCast>): Promise<IChainCast | null>;
    deleteChainCast(id: string): Promise<boolean>;
    findActiveChainCastByCommunity(communityId: string): Promise<IChainCast | null>;
    
    // Participant operations
    createParticipant(data: Partial<IChainCastParticipant>): Promise<IChainCastParticipant>;
    findParticipantByChainCastAndUser(chainCastId: string, userId: string): Promise<IChainCastParticipant | null>;
    findParticipantsByChainCast(chainCastId: string, skip: number, limit: number, filter?: string): Promise<{ participants: IChainCastParticipant[], total: number }>;
    updateParticipant(chainCastId: string, userId: string, data: Partial<IChainCastParticipant>): Promise<IChainCastParticipant | null>;
    updateParticipantRole(chainCastId: string, userId: string, role: string, permissions: any): Promise<IChainCastParticipant | null>;
    removeParticipant(chainCastId: string, userId: string): Promise<boolean>;
    getActiveParticipantsCount(chainCastId: string): Promise<number>;
    getModeratorsCount(chainCastId: string): Promise<number>;
    
    // Reaction operations
    createReaction(data: Partial<IChainCastReaction>): Promise<IChainCastReaction>;
    findReactionsByChainCast(chainCastId: string, skip: number, limit: number): Promise<{ reactions: IChainCastReaction[], total: number }>;
    getReactionsSummary(chainCastId: string): Promise<{ [emoji: string]: number }>;
    deleteReaction(id: string): Promise<boolean>;
    
    // Moderation Request operations
    createModerationRequest(data: Partial<IChainCastModerationRequest>): Promise<IChainCastModerationRequest>;
    findModerationRequestById(id: string): Promise<IChainCastModerationRequest | null>;
    findModerationRequestsByChainCast(chainCastId: string, skip: number, limit: number, status?: string): Promise<{ requests: IChainCastModerationRequest[], total: number }>;
    findPendingModerationRequestByUser(chainCastId: string, userId: string): Promise<IChainCastModerationRequest | null>;
    updateModerationRequest(id: string, data: Partial<IChainCastModerationRequest>): Promise<IChainCastModerationRequest | null>;
    getPendingModerationRequestsCount(chainCastId: string): Promise<number>;
    
    // Analytics operations
    updateChainCastStats(chainCastId: string, stats: Partial<IChainCast['stats']>): Promise<void>;
    getChainCastAnalytics(communityId: string, startDate?: Date, endDate?: Date): Promise<any>;
}