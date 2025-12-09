import { injectable, inject } from 'inversify';
import { IAdminCommunityService } from '../../core/interfaces/services/admin/IAdminCommunity.service';
import { ICommunityRequestRepository } from '../../core/interfaces/repositories/ICommunityRequestRepository';
import { ICommunityAdminAuthService } from '../../core/interfaces/services/communityAdmin/ICommunityAdminAuth.service';
import { ICommunityRequest } from '../../models/communityRequest.model';
import { TYPES } from '../../core/types/types';
import { CustomError } from '../../utils/customError';
import { StatusCode } from '../../enums/statusCode.enum';

@injectable()
export class AdminCommunityService implements IAdminCommunityService {
  constructor(
    @inject(TYPES.ICommunityRequestRepository) private _communityRequestRepo: ICommunityRequestRepository,
    @inject(TYPES.ICommunityAdminAuthService) private _communityAdminAuthService: ICommunityAdminAuthService,
  ) {}

  async getAllCommunityRequests(page: number, limit: number, search: string) {
    const result = await this._communityRequestRepo.findAll(page, limit, search);
    const totalPages = Math.ceil(result.total / limit);

    return {
      requests: result.data,
      total: result.total,
      page: result.page,
      limit: result.limit,
      totalPages,
    };
  }

  async getCommunityRequestById(id: string): Promise<ICommunityRequest | null> {
    return await this._communityRequestRepo.findById(id);
  }

  async approveCommunityRequest(id: string): Promise<ICommunityRequest | null> {
    const request = await this._communityRequestRepo.findById(id);
    if (!request) {
      throw new CustomError("Community request not found", StatusCode.NOT_FOUND);
    }

    if (request.status !== 'pending') {
      throw new CustomError("Request has already been processed", StatusCode.BAD_REQUEST);
    }

    // Update request status to approved
    const updatedRequest = await this._communityRequestRepo.updateStatus(id, 'approved');
    
    // Create community from request
    await this._communityAdminAuthService.createCommunityFromRequest(id);

    return updatedRequest;
  }

  async rejectCommunityRequest(id: string, reason: string): Promise<ICommunityRequest | null> {
    const request = await this._communityRequestRepo.findById(id);
    if (!request) {
      throw new CustomError("Community request not found", StatusCode.NOT_FOUND);
    }

    if (request.status !== 'pending') {
      throw new CustomError("Request has already been processed", StatusCode.BAD_REQUEST);
    }

    return await this._communityRequestRepo.updateStatus(id, 'rejected');
  }
}