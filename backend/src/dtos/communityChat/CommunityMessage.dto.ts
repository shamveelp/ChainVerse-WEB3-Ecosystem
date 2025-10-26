import { IsString, IsOptional, IsBoolean, IsArray, ValidateNested, IsEnum, IsNumber } from 'class-validator';
import { Type } from 'class-transformer';

export class MediaFileDto {
    @IsEnum(['image', 'video'])
    type!: 'image' | 'video';

    @IsString()
    url!: string;

    @IsString()
    publicId!: string;

    @IsString()
    filename!: string;

    @IsNumber()
    size!: number;
}

export class CreateCommunityMessageDto {
    @IsString()
    @IsOptional()
    content!: string;

    @IsOptional()
    @IsArray()
    @ValidateNested({ each: true })
    @Type(() => MediaFileDto)
    mediaFiles?: MediaFileDto[];

    @IsOptional()
    @IsEnum(['text', 'media', 'mixed'])
    messageType?: 'text' | 'media' | 'mixed';
}

export class UpdateCommunityMessageDto {
    @IsString()
    content: string | undefined;
}

export class ReactToMessageDto {
    @IsString()
    messageId: string | undefined;

    @IsString()
    emoji: string | undefined;
}

export class CommunityMessageResponseDto {
    @IsString()
    _id: string | undefined;

    @IsString()
    communityId: string | undefined;

    @ValidateNested()
    @Type(() => Object)
    admin!: {
        _id: string;
        name: string;
        profilePicture: string;
    };

    @IsString()
    @IsOptional()
    content: string | undefined;

    @IsArray()
    @ValidateNested({ each: true })
    @Type(() => MediaFileDto)
    @IsOptional()
    mediaFiles: MediaFileDto[] | undefined;

    @IsEnum(['text', 'media', 'mixed'])
    messageType!: 'text' | 'media' | 'mixed';

    @IsBoolean()
    isPinned!: boolean;

    @IsArray()
    @ValidateNested({ each: true })
    @Type(() => Object)
    reactions!: {
        emoji: string;
        count: number;
        userReacted: boolean;
    }[];

    @IsNumber()
    totalReactions!: number;

    @IsBoolean()
    isEdited!: boolean;

    @IsOptional()
    editedAt?: Date;

    @IsOptional()
    createdAt?: Date;

    @IsOptional()
    updatedAt?: Date;
}

export class CommunityMessagesListResponseDto {
    @IsArray()
    @ValidateNested({ each: true })
    @Type(() => CommunityMessageResponseDto)
    messages?: CommunityMessageResponseDto[];

    @IsBoolean()
    @IsOptional()
    hasMore?: boolean;

    @IsString()
    @IsOptional()
    nextCursor?: string;

    @IsNumber()
    @IsOptional()
    totalCount?: number;
}