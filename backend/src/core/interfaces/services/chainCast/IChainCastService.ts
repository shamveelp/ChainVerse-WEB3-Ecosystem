import { 
    CreateChainCastDto, 
    UpdateChainCastDto,
    JoinChainCastDto,
    RequestModerationDto,
    ReviewModerationRequestDto,
    AddReactionDto,
    GetChainCastsQueryDto,
    GetParticipantsQueryDto,
    GetReactionsQueryDto,
    ChainCastResponseDto,
    ChainCastsListResponseDto,
    ChainCastParticipantsListResponseDto,
    ChainCastReactionsListResponseDto,
    ChainCastModerationRequestsListResponseDto,
    UpdateParticipantDto
} from "../../../../dtos/chainCast/ChainCast.dto";

export interface IChainCastService {
    // Admin ChainCast management
    createChainCast(adminId: string, data: CreateChainCastDto): Promise<ChainCastResponseDto>;
    getChainCasts(adminId: string, query: GetChainCastsQueryDto): Promise<ChainCastsListResponseDto>;
    getChainCastById(chainCastId: string, userId?: string): Promise<ChainCastResponseDto>;
    updateChainCast(adminId: string, chainCastId: string, data: UpdateChainCastDto): Promise<ChainCastResponseDto>;
    deleteChainCast(adminId: string, chainCastId: string): Promise<{ success: boolean; message: string }>;
    
    // ChainCast control
    startChainCast(adminId: string, chainCastId: string): Promise<ChainCastResponseDto>;
    endChainCast(adminId: string, chainCastId: string): Promise<ChainCastResponseDto>;
    
    // User ChainCast participation
    getCommunityChainCasts(communityId: string, userId: string, query: GetChainCastsQueryDto): Promise<ChainCastsListResponseDto>;
    joinChainCast(userId: string, data: JoinChainCastDto): Promise<{ success: boolean; message: string; streamUrl?: string }>;
    leaveChainCast(userId: string, chainCastId: string): Promise<{ success: boolean; message: string }>;
    
    // Participant management
    getParticipants(chainCastId: string, query: GetParticipantsQueryDto): Promise<ChainCastParticipantsListResponseDto>;
    updateParticipant(chainCastId: string, userId: string, data: UpdateParticipantDto): Promise<{ success: boolean; message: string }>;
    removeParticipant(adminId: string, chainCastId: string, participantId: string, reason?: string): Promise<{ success: boolean; message: string }>;
    
    // Moderation
    requestModeration(userId: string, data: RequestModerationDto): Promise<{ success: boolean; message: string }>;
    getModerationRequests(adminId: string, chainCastId: string): Promise<ChainCastModerationRequestsListResponseDto>;
    reviewModerationRequest(adminId: string, data: ReviewModerationRequestDto): Promise<{ success: boolean; message: string }>;
    
    // Reactions
    addReaction(userId: string, data: AddReactionDto): Promise<{ success: boolean; message: string }>;
    getReactions(chainCastId: string, query: GetReactionsQueryDto): Promise<ChainCastReactionsListResponseDto>;
    
    // Analytics
    getChainCastAnalytics(adminId: string, period?: string): Promise<any>;
    
    // Utility methods
    canUserJoinChainCast(userId: string, chainCastId: string): Promise<{ canJoin: boolean; reason?: string }>;
    isUserCommunityMember(userId: string, communityId: string): Promise<boolean>;
}