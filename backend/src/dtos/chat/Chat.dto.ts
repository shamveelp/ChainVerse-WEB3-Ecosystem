import { IsString, IsNotEmpty, IsOptional, MaxLength, IsNumber, Min } from 'class-validator';

export class SendMessageDto {
  @IsString()
  @IsNotEmpty()
  @MaxLength(2000)
  content: string | undefined;

  @IsString()
  @IsNotEmpty()
  receiverUsername: string | undefined;
}

export class EditMessageDto {
  @IsString()
  @IsNotEmpty()
  @MaxLength(2000)
  content: string | undefined;
}

export class GetMessagesDto {
  @IsOptional()
  @IsString()
  cursor?: string;

  @IsOptional()
  @IsNumber()
  @Min(1)
  limit?: number = 20;
}

export class GetConversationsDto {
  @IsOptional()
  @IsString()
  cursor?: string;

  @IsOptional()
  @IsNumber()
  @Min(1)
  limit?: number = 20;

  @IsOptional()
  @IsString()
  search?: string;
}

export class MarkMessagesReadDto {
  @IsString()
  @IsNotEmpty()
  conversationId: string | undefined;
}

export class ConversationResponseDto {
  _id: string | undefined;
  participants: ParticipantDto[] | undefined;
  lastMessage?: MessageResponseDto | undefined;
  lastActivity: Date | undefined;
  unreadCount: number | undefined;
  createdAt: Date | undefined;
  updatedAt: Date | undefined;
}

export class ParticipantDto {
  _id: string | undefined;
  username: string | undefined;
  name: string | undefined;
  profilePic: string | undefined;
  isVerified: boolean | undefined;
  isOnline?: boolean | undefined;
  lastSeen?: Date;
}

export class MessageResponseDto {
  _id: string | undefined;
  conversationId: string | undefined;
  sender: ParticipantDto | undefined;
  content: string | undefined;
  messageType: 'text' | undefined;
  readBy: ReadReceiptDto[] | undefined;
  editedAt?: Date;
  isDeleted: boolean | undefined;
  createdAt: Date | undefined;
  updatedAt: Date | undefined;
  isOwnMessage: boolean | undefined;
}

export class ReadReceiptDto {
  user: string | undefined;
  readAt: Date | undefined;
}

export class ConversationListResponseDto {
  conversations: ConversationResponseDto[] | undefined;
  hasMore: boolean | undefined;
  nextCursor?: string;
  totalCount: number | undefined;
}

export class MessageListResponseDto {
  messages: MessageResponseDto[] | undefined;
  hasMore: boolean | undefined;
  nextCursor?: string;
  totalCount: number | undefined;
}

export class SendMessageResponseDto {
  success: boolean | undefined;
  message: MessageResponseDto | undefined;
  conversation: ConversationResponseDto | undefined;
}