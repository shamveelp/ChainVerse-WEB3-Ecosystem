import { CommunityGroupMessagesListResponseDto } from "../../../../dtos/communityChat/CommunityGroupMessage.dto";
import {
  CreateCommunityMessageDto,
  UpdateCommunityMessageDto,
  CommunityMessageResponseDto,
  CommunityMessagesListResponseDto,
  MediaFileDto
} from "../../../../dtos/communityChat/CommunityMessage.dto";

export interface ICommunityAdminCommunityService {
  sendMessage(adminId: string, data: CreateCommunityMessageDto): Promise<CommunityMessageResponseDto>;
  getMessages(adminId: string, cursor?: string, limit?: number): Promise<CommunityMessagesListResponseDto>;
  updateMessage(adminId: string, messageId: string, data: UpdateCommunityMessageDto): Promise<CommunityMessageResponseDto>;
  deleteMessage(adminId: string, messageId: string): Promise<{ success: boolean; message: string }>;
  pinMessage(adminId: string, messageId: string): Promise<{ success: boolean; message: string }>;
  unpinMessage(adminId: string, messageId: string): Promise<{ success: boolean; message: string }>;
  getMessageReactions(adminId: string, messageId: string): Promise<{
    messageId: string;
    reactions: Array<{ emoji: string; count: number; users: string[] }>;
    totalReactions: number;
  }>;
  uploadMedia(adminId: string, files: Express.Multer.File[]): Promise<{ mediaFiles: MediaFileDto[] }>;
  getGroupMessages(
    adminId: string,
    cursor?: string,
    limit?: number
  ): Promise<CommunityGroupMessagesListResponseDto>;


}
