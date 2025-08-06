import { UserModel, IUser } from "../models/user.models";
import { IUserRepository } from "../core/interfaces/repositories/IUserRepository";

export class UserRepository implements IUserRepository {
  async createUser(data: Partial<IUser>) {
    return await UserModel.create(data);
  }

  async findByEmail(email: string) {
    return await UserModel.findOne({ email }).exec();
  }

  async findAll(skip: number, limit: number) {
    return await UserModel.find()
      .skip(skip)
      .limit(limit)
      .select("name email phone isEmailVerified isBanned role username followersCount followingCount dailyCheckin.streak totalPoints profilePic createdAt");
  }
   async findUsers(page: number, limit: number, search: string) {
    const query: any = {};
    if (search) {
      query.$or = [
        { name: { $regex: search, $options: "i" } },
        { email: { $regex: search, $options: "i" } }
      ];
    }

    const skip = (page - 1) * limit;

    const [users, total] = await Promise.all([
      UserModel.find(query)
        .skip(skip)
        .limit(limit)
        .select("name email phone username role isEmailVerified isBanned createdAt")
        .lean(),
      UserModel.countDocuments(query)
    ]);

    return {
      users,
      total,
      page,
      totalPages: Math.ceil(total / limit)
    };
  }

  async count() {
    return await UserModel.countDocuments();
  }

  async updateUser(id: string, update: Partial<IUser>) {
    await UserModel.findByIdAndUpdate(id, { $set: update })
  }

async updateStatus(id: string, updateData: Partial<IUser>) {
  return await UserModel.findByIdAndUpdate(id, updateData, { new: true });
}
  async findById(id: string) {
    return UserModel.findById(id).select("-password");
  }
}