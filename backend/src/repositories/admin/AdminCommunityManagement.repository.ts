import { injectable } from "inversify";
import { IAdminCommunityManagementRepository } from "../../core/interfaces/repositories/admin/IAdminCommunityManagement.repository";
import CommunityModel, { ICommunity } from "../../models/community.model";
import CommunityMemberModel from "../../models/communityMember.model";

@injectable()
export class AdminCommunityManagementRepository implements IAdminCommunityManagementRepository {

    async getAllCommunities(page: number, limit: number, search: string, status?: string, isVerified?: boolean | string): Promise<{ communities: ICommunity[], total: number }> {
        const query: any = {};

        if (search) {
            query.$or = [
                { communityName: { $regex: search, $options: 'i' } },
                { email: { $regex: search, $options: 'i' } },
                { username: { $regex: search, $options: 'i' } }
            ];
        }

        if (status && status !== 'all') {
            query.status = status;
        }

        if (isVerified !== undefined && isVerified !== 'all') {
            query.isVerified = isVerified === 'true' || isVerified === true;
        }

        const skip = (page - 1) * limit;

        const communities = await CommunityModel.find(query)
            .skip(skip)
            .limit(limit)
            .sort({ createdAt: -1 });

        const total = await CommunityModel.countDocuments(query);

        return { communities, total };
    }

    async getCommunityById(id: string): Promise<ICommunity | null> {
        return await CommunityModel.findById(id).populate('communityAdmins', 'username email');
    }

    async updateCommunityStatus(id: string, status: string): Promise<ICommunity | null> {
        return await CommunityModel.findByIdAndUpdate(id, { status }, { new: true });
    }

    async updateVerificationStatus(id: string, isVerified: boolean): Promise<ICommunity | null> {
        return await CommunityModel.findByIdAndUpdate(id, { isVerified }, { new: true });
    }

    async deleteCommunity(id: string): Promise<boolean> {
        const result = await CommunityModel.findByIdAndDelete(id);
        return !!result;
    }

    async getCommunityMembers(communityId: string, page: number, limit: number, search: string): Promise<{ members: any[], total: number }> {
        const query: any = { communityId };

        // For search, we need to populate user first then filter, but Mongoose doesn't support easy search on populated fields in a single query efficiently.
        // Or we can find Users first matching the search, then find CommunityMembers with those userIds.
        // Assuming search is for username or email.

        if (search) {
            // Find users matching search
            // This requires importing UserModel, or doing an aggregation.
            // Let's us aggregation for better performance.
            const aggregationPipeline: any[] = [
                { $match: { communityId: new Object(communityId) } }, // This might fail if communityId is string, need to convert to ObjectId
                {
                    $lookup: {
                        from: 'users',
                        localField: 'userId',
                        foreignField: '_id',
                        as: 'user'
                    }
                },
                { $unwind: '$user' },
                {
                    $match: {
                        $or: [
                            { 'user.username': { $regex: search, $options: 'i' } },
                            { 'user.email': { $regex: search, $options: 'i' } }
                        ]
                    }
                },
                {
                    $project: {
                        _id: 1,
                        joinedAt: 1,
                        role: 1,
                        isActive: 1,
                        totalPosts: 1,
                        user: {
                            _id: 1,
                            username: 1,
                            email: 1,
                            profileImage: 1
                        }
                    }
                },
                { $skip: (page - 1) * limit },
                { $limit: limit }
            ];

            // We actually need aggregation for total count as well if search is applied
            // But for simplicity let's implement basic population first if search is simple, or aggregation.
        }

        // Implementation with Populate for basic listing + Basic filtering if needed.
        // Since I don't have UserModel imported here easily, I will use Populate and in-memory filter if search is present (not efficient for large data)
        // OR better: use aggregation.

        const skip = (page - 1) * limit;

        const populateOptions = {
            path: 'userId',
            select: 'username email profileImage',
            match: search ? {
                $or: [
                    { username: { $regex: search, $options: 'i' } },
                    { email: { $regex: search, $options: 'i' } }
                ]
            } : {}
        };

        // If we use match in populate, it returns null for userId if not matched.
        // We then have to filter out nulls.

        let members = await CommunityMemberModel.find(query)
            .populate(populateOptions)
            .sort({ joinedAt: -1 });

        // Filter out where userId is null (didn't match search)
        if (search) {
            members = members.filter(m => m.userId);
        }

        const total = members.length; // Approximate total after search

        // Manual pagination after filtering (if search exists)
        if (search) {
            members = members.slice(skip, skip + limit);
        } else {
            // Database pagination
            members = await CommunityMemberModel.find(query)
                .populate('userId', 'username email profileImage')
                .skip(skip)
                .limit(limit)
                .sort({ joinedAt: -1 });

            // Count total documents
            // total = await CommunityMemberModel.countDocuments(query); // Already defined above but variable scoping...
            return { members, total: await CommunityMemberModel.countDocuments(query) };
        }

        return { members, total };
    }

    async updateCommunitySettings(id: string, settings: any): Promise<ICommunity | null> {
        return await CommunityModel.findByIdAndUpdate(id, { settings }, { new: true });
    }
}
