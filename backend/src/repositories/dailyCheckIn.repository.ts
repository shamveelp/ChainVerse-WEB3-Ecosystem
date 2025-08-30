import { injectable } from "inversify";
import { IDailyCheckInRepository } from "../core/interfaces/repositories/IDailyCheckInRepository";
import { DailyCheckInModel, IDailyCheckIn } from "../models/dailyCheckIn.model";
import { Types } from "mongoose";

@injectable()
export class DailyCheckInRepository implements IDailyCheckInRepository {
  
  async createCheckIn(data: {
    userId: string;
    checkInDate: Date;
    pointsAwarded: number;
    streakCount: number;
  }): Promise<IDailyCheckIn> {
    const checkIn = new DailyCheckInModel({
      userId: new Types.ObjectId(data.userId),
      checkInDate: data.checkInDate,
      pointsAwarded: data.pointsAwarded,
      streakCount: data.streakCount,
    });
    
    return await checkIn.save();
  }

  async findTodayCheckIn(userId: string): Promise<IDailyCheckIn | null> {
    const today = new Date();
    const startOfDay = new Date(today.getFullYear(), today.getMonth(), today.getDate());
    const endOfDay = new Date(today.getFullYear(), today.getMonth(), today.getDate(), 23, 59, 59);

    return await DailyCheckInModel.findOne({
      userId: new Types.ObjectId(userId),
      checkInDate: { $gte: startOfDay, $lte: endOfDay }
    }).exec();
  }

  async getCheckInHistory(userId: string, month: number, year: number): Promise<IDailyCheckIn[]> {
    const startDate = new Date(year, month - 1, 1);
    const endDate = new Date(year, month, 0, 23, 59, 59);

    return await DailyCheckInModel.find({
      userId: new Types.ObjectId(userId),
      checkInDate: { $gte: startDate, $lte: endDate }
    })
    .sort({ checkInDate: 1 })
    .exec();
  }

  async getLastCheckIn(userId: string): Promise<IDailyCheckIn | null> {
    return await DailyCheckInModel.findOne({ userId: new Types.ObjectId(userId) })
      .sort({ checkInDate: -1 })
      .exec();
  }

  async getStreakCount(userId: string): Promise<number> {
    const lastCheckIn = await this.getLastCheckIn(userId);
    return lastCheckIn?.streakCount || 0;
  }
}