import { ICommunityRequest } from "../../../../models/communityRequest.model";

export interface IAdminCommunityService {
  getAllCommunityRequests(page: number, limit: number, search: string): Promise<{
    requests: ICommunityRequest[];
    total: number;
    page: number;
    limit: number;
    totalPages: number;
  }>;
  getCommunityRequestById(id: string): Promise<ICommunityRequest | null>;
  approveCommunityRequest(id: string): Promise<ICommunityRequest | null>;
  rejectCommunityRequest(id: string, reason: string): Promise<ICommunityRequest | null>;
}