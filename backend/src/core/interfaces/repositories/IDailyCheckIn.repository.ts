import { IDailyCheckIn } from "../../../models/dailyCheckIn.model";

export interface IDailyCheckInRepository {
  createCheckIn(data: {
    userId: string;
    checkInDate: Date;
    pointsAwarded: number;
    streakCount: number;
  }): Promise<IDailyCheckIn>;
  
  findTodayCheckIn(userId: string): Promise<IDailyCheckIn | null>;
  
  getCheckInHistory(userId: string, month: number, year: number): Promise<IDailyCheckIn[]>;
  
  getLastCheckIn(userId: string): Promise<IDailyCheckIn | null>;
  
  getStreakCount(userId: string): Promise<number>;
}