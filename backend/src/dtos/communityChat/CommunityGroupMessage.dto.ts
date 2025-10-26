import { IsString, IsOptional, IsNumber, Min } from 'class-validator';

export class SendGroupMessageDto {
    @IsString()
    communityUsername?: string;

    @IsString()
    content!: string;
}

export class EditGroupMessageDto {
    @IsString()
    content?: string;
}

export class GetGroupMessagesDto {
    @IsOptional()
    @IsString()
    cursor?: string;

    @IsOptional()
    @IsNumber()
    @Min(1)
    limit?: number = 50;
}

export class CommunityGroupMessageResponseDto {
    _id: string | undefined;
    communityId: string | undefined;
    sender?: {
        _id: string;
        username: string;
        name: string;
        profilePic: string;
    };
    content: string | undefined;
    isEdited: boolean   | undefined;
    editedAt?: Date;
    isCurrentUser: boolean  | undefined;
    createdAt: Date | undefined;
    updatedAt: Date | undefined;
}

export class CommunityGroupMessagesListResponseDto {
    messages?: CommunityGroupMessageResponseDto[];
    hasMore: boolean    | undefined;
    nextCursor?: string;
    totalCount: number   | undefined;
}
