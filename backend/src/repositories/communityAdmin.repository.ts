import { injectable } from "inversify";
import { ICommunityAdminRepository } from "../core/interfaces/repositories/ICommunityAdminRepository";
import { ICommunityAdmin } from "../models/communityAdmin.model";
import CommunityAdminModel from "../models/communityAdmin.model";

@injectable()
export class CommunityAdminRepository implements ICommunityAdminRepository {
    async findByEmail(email: string): Promise<ICommunityAdmin | null> {
        return await CommunityAdminModel.findOne({ email }).exec();
    }

    async createCommunityAdmin(data: Partial<ICommunityAdmin>): Promise<ICommunityAdmin> {
        const communityAdmin = new CommunityAdminModel(data);
        return await communityAdmin.save();
    }

    async findAll(skip: number, limit: number): Promise<ICommunityAdmin[]> {
        return await CommunityAdminModel.find()
            .skip(skip)
            .limit(limit)
            .exec();
    }

    async findCommunityAdmins(page: number, limit: number, search: string): Promise<{ data: ICommunityAdmin[]; total: number; page: number; limit: number }> {
        const skip = (page - 1) * limit;
        const searchQuery = search 
            ? { 
                $or: [
                    { email: { $regex: search, $options: 'i' } },
                    { name: { $regex: search, $options: 'i' } }
                ]
            } 
            : {};

        const data = await CommunityAdminModel.find(searchQuery)
            .skip(skip)
            .limit(limit)
            .populate('communityId')
            .exec();

        const total = await CommunityAdminModel.countDocuments(searchQuery);

        return { data, total, page, limit };
    }

    async count(): Promise<number> {
        return await CommunityAdminModel.countDocuments();
    }

    async updateCommunityAdmin(id: string, updateData: Partial<ICommunityAdmin>): Promise<ICommunityAdmin | null> {
        return await CommunityAdminModel.findByIdAndUpdate(id, updateData, { new: true }).exec();
    }

    async updateStatus(id: string, updateData: Partial<ICommunityAdmin>): Promise<ICommunityAdmin | null> {
        return await CommunityAdminModel.findByIdAndUpdate(id, updateData, { new: true }).exec();
    }

    async findById(id: string): Promise<ICommunityAdmin | null> {
        return await CommunityAdminModel.findById(id).populate('communityId').exec();
    }
}
