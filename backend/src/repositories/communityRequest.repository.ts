import { injectable } from "inversify";
import { ICommunityRequest } from "../models/communityRequest.model";
import CommunityRequestModel from "../models/communityRequest.model";
import { ICommunityRequestRepository } from "../core/interfaces/repositories/ICommunityRequestRepository";

@injectable()
export class CommunityRequestRepository implements ICommunityRequestRepository {
    async create(data: Partial<ICommunityRequest>): Promise<ICommunityRequest> {
        const request = new CommunityRequestModel(data);
        return await request.save();
    }

    async findByEmail(email: string): Promise<ICommunityRequest | null> {
        return await CommunityRequestModel.findOne({ email }).exec();
    }

    async findByUsername(username: string): Promise<ICommunityRequest | null> {
        return await CommunityRequestModel.findOne({ username }).exec();
    }

    async findById(id: string): Promise<ICommunityRequest | null> {
        return await CommunityRequestModel.findById(id).exec();
    }

    async updateStatus(id: string, status: string): Promise<ICommunityRequest | null> {
        return await CommunityRequestModel.findByIdAndUpdate(
            id,
            { status },
            { new: true }
        ).exec();
    }

    async update(id: string, updateData: Partial<ICommunityRequest>): Promise<ICommunityRequest | null> {
        return await CommunityRequestModel.findByIdAndUpdate(
            id,
            updateData,
            { new: true }
        ).exec();
    }

    async delete(id: string): Promise<ICommunityRequest | null> {
        return await CommunityRequestModel.findByIdAndDelete(id).exec();
    }

    async findAll(page: number, limit: number, search: string): Promise<{ data: ICommunityRequest[]; total: number; page: number; limit: number }> {
        const skip = (page - 1) * limit;
        const searchQuery = search
            ? {
                $or: [
                    { email: { $regex: search, $options: 'i' } },
                    { communityName: { $regex: search, $options: 'i' } },
                    { username: { $regex: search, $options: 'i' } }
                ]
            }
            : {};

        const data = await CommunityRequestModel.find(searchQuery)
            .skip(skip)
            .limit(limit)
            .sort({ createdAt: -1 })
            .exec();

        const total = await CommunityRequestModel.countDocuments(searchQuery);

        return { data, total, page, limit };
    }

    async findByStatus(status: string): Promise<ICommunityRequest[]> {
        return await CommunityRequestModel.find({ status }).exec();
    }
}