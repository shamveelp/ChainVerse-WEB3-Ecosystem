import { IsString, IsOptional, IsBoolean, IsNumber, IsEnum, IsDateString, ValidateNested, Min, Max } from 'class-validator';
import { Type } from 'class-transformer';


export class ChainCastSettingsDto {
    @IsOptional()
    @IsBoolean()
    allowReactions?: boolean = true;

    @IsOptional()
    @IsBoolean()
    allowChat?: boolean = true;

    @IsOptional()
    @IsBoolean()
    moderationRequired?: boolean = true;

    @IsOptional()
    @IsBoolean()
    recordSession?: boolean = false;
}
// Base ChainCast DTOs
export class CreateChainCastDto {
    @IsString()
    title!: string;

    @IsOptional()
    @IsString()
    description?: string;

    @IsOptional()
    @IsDateString()
    scheduledStartTime?: string;

    @IsOptional()
    @IsNumber()
    @Min(1)
    @Max(100)
    maxParticipants?: number = 50;

    @IsOptional()
    @ValidateNested()
    @Type(() => ChainCastSettingsDto)
    settings?: ChainCastSettingsDto;
}

export class UpdateChainCastDto {
    @IsOptional()
    @IsString()
    title?: string;

    @IsOptional()
    @IsString()
    description?: string;

    @IsOptional()
    @IsDateString()
    scheduledStartTime?: string;

    @IsOptional()
    @IsNumber()
    @Min(1)
    @Max(100)
    maxParticipants?: number;

    @IsOptional()
    @ValidateNested()
    @Type(() => ChainCastSettingsDto)
    settings?: ChainCastSettingsDto;
}



// Participant DTOs
export class JoinChainCastDto {
    @IsString()
    chainCastId!: string;

    @IsOptional()
    @IsString()
    quality?: 'low' | 'medium' | 'high' = 'medium';
}

export class UpdateParticipantDto {
    @IsOptional()
    @IsBoolean()
    hasVideo?: boolean;

    @IsOptional()
    @IsBoolean()
    hasAudio?: boolean;

    @IsOptional()
    @IsBoolean()
    isMuted?: boolean;

    @IsOptional()
    @IsBoolean()
    isVideoOff?: boolean;
}
export class RequestedPermissionsDto {
    @IsBoolean()
    video!: boolean;

    @IsBoolean()
    audio!: boolean;
}

// Moderation DTOs
export class RequestModerationDto {
    @IsString()
    chainCastId!: string;

    @ValidateNested()
    @Type(() => RequestedPermissionsDto)
    requestedPermissions!: RequestedPermissionsDto;

    @IsOptional()
    @IsString()
    message?: string;
}


export class ReviewModerationRequestDto {
    @IsString()
    requestId!: string;

    @IsEnum(['approved', 'rejected'])
    status!: 'approved' | 'rejected';

    @IsOptional()
    @IsString()
    reviewMessage?: string;
}

// Reaction DTOs
export class AddReactionDto {
    @IsString()
    chainCastId!: string;

    @IsEnum(['👏', '❤️', '😂', '😮', '😢', '😡', '👍', '👎', '🔥', '💯'])
    emoji!: string;
}

// Query DTOs
export class GetChainCastsQueryDto {
    @IsOptional()
    @IsEnum(['all', 'scheduled', 'live', 'ended'])
    status?: string = 'all';

    @IsOptional()
    @IsString()
    cursor?: string;

    @IsOptional()
    @IsNumber()
    @Type(() => Number)
    @Min(1)
    @Max(50)
    limit?: number = 10;

    @IsOptional()
    @IsEnum(['recent', 'oldest', 'popular'])
    sortBy?: string = 'recent';
}

export class GetParticipantsQueryDto {
    @IsString()
    chainCastId!: string;

    @IsOptional()
    @IsEnum(['all', 'active', 'moderators'])
    filter?: string = 'all';

    @IsOptional()
    @IsString()
    cursor?: string;

    @IsOptional()
    @IsNumber()
    @Type(() => Number)
    @Min(1)
    @Max(100)
    limit?: number = 20;
}

export class GetReactionsQueryDto {
    @IsString()
    chainCastId!: string;

    @IsOptional()
    @IsString()
    cursor?: string;

    @IsOptional()
    @IsNumber()
    @Type(() => Number)
    @Min(1)
    @Max(100)
    limit?: number = 50;
}

// Response DTOs
export class ChainCastResponseDto {
    _id!: string;
    communityId!: string;
    admin!: {
        _id: string;
        name: string;
        profilePicture?: string;
    };
    title!: string;
    description?: string;
    status!: 'scheduled' | 'live' | 'ended' | 'cancelled';
    scheduledStartTime?: Date;
    actualStartTime?: Date;
    endTime?: Date;
    maxParticipants!: number;
    currentParticipants!: number;
    settings!: ChainCastSettingsDto;
    stats!: {
        totalViews: number;
        peakViewers: number;
        totalReactions: number;
        averageWatchTime: number;
    };
    canJoin!: boolean;
    canModerate!: boolean;
    isParticipant!: boolean;
    userRole?: 'viewer' | 'moderator' | 'admin';
    streamUrl?: string;
    createdAt!: Date;
    updatedAt!: Date;

    constructor(chainCast: any, admin: any, userRole?: string, canJoin: boolean = false, canModerate: boolean = false) {
        this._id = chainCast._id?.toString() || '';
        this.communityId = chainCast.communityId?.toString() || '';
        this.admin = {
            _id: admin._id?.toString() || '',
            name: admin.name || 'Unknown Admin',
            profilePicture: admin.profilePicture || undefined
        };
        this.title = chainCast.title || '';
        this.description = chainCast.description;
        this.status = chainCast.status || 'scheduled';
        this.scheduledStartTime = chainCast.scheduledStartTime;
        this.actualStartTime = chainCast.actualStartTime;
        this.endTime = chainCast.endTime;
        this.maxParticipants = chainCast.maxParticipants || 50;
        this.currentParticipants = chainCast.currentParticipants || 0;
        this.settings = chainCast.settings || {};
        this.stats = chainCast.stats || {
            totalViews: 0,
            peakViewers: 0,
            totalReactions: 0,
            averageWatchTime: 0
        };
        this.canJoin = canJoin;
        this.canModerate = canModerate;
        this.isParticipant = !!userRole;
        this.userRole = userRole as any;
        this.streamUrl = chainCast.streamData?.streamUrl;
        this.createdAt = chainCast.createdAt;
        this.updatedAt = chainCast.updatedAt;
    }
}

export class ChainCastParticipantResponseDto {
    _id!: string;
    user!: {
        _id: string;
        username: string;
        name: string;
        profilePic?: string;
        isVerified: boolean;
    };
    role!: 'viewer' | 'moderator' | 'admin';
    joinedAt!: Date;
    isActive!: boolean;
    permissions!: {
        canStream: boolean;
        canModerate: boolean;
        canReact: boolean;
        canChat: boolean;
    };
    streamData!: {
        hasVideo: boolean;
        hasAudio: boolean;
        isMuted: boolean;
        isVideoOff: boolean;
    };
    watchTime!: number;
    reactionsCount!: number;

    constructor(participant: any, user: any) {
        this._id = participant._id?.toString() || '';
        this.user = {
            _id: user._id?.toString() || '',
            username: user.username || '',
            name: user.name || user.username || 'Unknown',
            profilePic: user.profilePic,
            isVerified: user.isVerified || false
        };
        this.role = participant.role || 'viewer';
        this.joinedAt = participant.joinedAt;
        this.isActive = participant.isActive;
        this.permissions = participant.permissions || {};
        this.streamData = participant.streamData || {};
        this.watchTime = participant.watchTime || 0;
        this.reactionsCount = participant.reactionsCount || 0;
    }
}

export class ChainCastModerationRequestResponseDto {
    _id!: string;
    user!: {
        _id: string;
        username: string;
        name: string;
        profilePic?: string;
    };
    requestedPermissions!: RequestedPermissionsDto;
    message?: string;
    status!: 'pending' | 'approved' | 'rejected';
    reviewMessage?: string;
    createdAt!: Date;
    expiresAt!: Date;

    constructor(request: any, user: any) {
        this._id = request._id?.toString() || '';
        this.user = {
            _id: user._id?.toString() || '',
            username: user.username || '',
            name: user.name || user.username || 'Unknown',
            profilePic: user.profilePic
        };
        this.requestedPermissions = request.requestedPermissions || {};
        this.message = request.message;
        this.status = request.status || 'pending';
        this.reviewMessage = request.reviewMessage;
        this.createdAt = request.createdAt;
        this.expiresAt = request.expiresAt;
    }
}

export class ChainCastReactionResponseDto {
    _id!: string;
    user!: {
        _id: string;
        username: string;
        name: string;
        profilePic?: string;
    };
    emoji!: string;
    timestamp!: Date;

    constructor(reaction: any, user: any) {
        this._id = reaction._id?.toString() || '';
        this.user = {
            _id: user._id?.toString() || '',
            username: user.username || '',
            name: user.name || user.username || 'Unknown',
            profilePic: user.profilePic
        };
        this.emoji = reaction.emoji || '';
        this.timestamp = reaction.timestamp || reaction.createdAt;
    }
}

// List Response DTOs
export class ChainCastsListResponseDto {
    chainCasts!: ChainCastResponseDto[];
    hasMore!: boolean;
    nextCursor?: string;
    totalCount!: number;
    summary?: {
        live: number;
        scheduled: number;
        ended: number;
    };

    constructor(
        chainCasts: ChainCastResponseDto[],
        hasMore: boolean,
        totalCount: number,
        nextCursor?: string,
        summary?: any
    ) {
        this.chainCasts = chainCasts;
        this.hasMore = hasMore;
        this.nextCursor = nextCursor;
        this.totalCount = totalCount;
        this.summary = summary;
    }
}

export class ChainCastParticipantsListResponseDto {
    participants!: ChainCastParticipantResponseDto[];
    hasMore!: boolean;
    nextCursor?: string;
    totalCount!: number;
    activeCount!: number;
    moderatorCount!: number;

    constructor(
        participants: ChainCastParticipantResponseDto[],
        hasMore: boolean,
        totalCount: number,
        activeCount: number,
        moderatorCount: number,
        nextCursor?: string
    ) {
        this.participants = participants;
        this.hasMore = hasMore;
        this.nextCursor = nextCursor;
        this.totalCount = totalCount;
        this.activeCount = activeCount;
        this.moderatorCount = moderatorCount;
    }
}

export class ChainCastReactionsListResponseDto {
    reactions!: ChainCastReactionResponseDto[];
    hasMore!: boolean;
    nextCursor?: string;
    totalCount!: number;
    reactionsSummary!: { [emoji: string]: number };

    constructor(
        reactions: ChainCastReactionResponseDto[],
        hasMore: boolean,
        totalCount: number,
        reactionsSummary: { [emoji: string]: number },
        nextCursor?: string
    ) {
        this.reactions = reactions;
        this.hasMore = hasMore;
        this.nextCursor = nextCursor;
        this.totalCount = totalCount;
        this.reactionsSummary = reactionsSummary;
    }
}

export class ChainCastModerationRequestsListResponseDto {
    requests!: ChainCastModerationRequestResponseDto[];
    hasMore!: boolean;
    nextCursor?: string;
    totalCount!: number;
    pendingCount!: number;

    constructor(
        requests: ChainCastModerationRequestResponseDto[],
        hasMore: boolean,
        totalCount: number,
        pendingCount: number,
        nextCursor?: string
    ) {
        this.requests = requests;
        this.hasMore = hasMore;
        this.nextCursor = nextCursor;
        this.totalCount = totalCount;
        this.pendingCount = pendingCount;
    }
}