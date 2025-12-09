import { Types } from "mongoose";
import { IAdminRepository } from "../core/interfaces/repositories/IAdmin.repository";
import Admin, { IAdmin } from "../models/admin.model";
import { DailyCheckInModel, IDailyCheckIn } from "../models/dailyCheckIn.model";

export class AdminRepository implements IAdminRepository {
  async findByEmail(email: string) {
    return await Admin.findOne({ email }).exec();
  }

  async findById(id: string) {
    return await Admin.findById(id).exec();
  }

  async updateById(id: string, update: Partial<IAdmin>) {
    return await Admin.findByIdAndUpdate(id, update, {
      new: true,
    }).exec();
  }

  async incrementTokenVersion(id: string): Promise<void> {
    
    await Admin.findByIdAndUpdate(id, { $inc: { tokenVersion: 15 } }).exec();
  }


  async getCheckInHistory(userId: string, page: number, limit: number): Promise<{
    checkIns: IDailyCheckIn[];
    total: number;
    totalPages: number;
  }> {
    const skip = (page - 1) * limit;
    
    const checkIns = await DailyCheckInModel.find({ userId: new Types.ObjectId(userId) })
      .sort({ checkInDate: -1 })
      .skip(skip)
      .limit(limit)
      .exec();

    const total = await DailyCheckInModel.countDocuments({ userId: new Types.ObjectId(userId) });
    
    return {
      checkIns,
      total,
      totalPages: Math.ceil(total / limit),
    };
  }
  
}
