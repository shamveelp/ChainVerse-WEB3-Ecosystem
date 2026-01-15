import { IPointsHistory } from "../../../../models/pointsHistory.model";

export interface IPointsService {
  performDailyCheckIn(userId: string): Promise<{
    success: boolean;
    pointsAwarded: number;
    streakCount: number;
    message: string;
  }>;

  getCheckInStatus(userId: string): Promise<{
    hasCheckedInToday: boolean;
    currentStreak: number;
    nextCheckInAvailable: Date | null;
  }>;

  getCheckInCalendar(userId: string, month: number, year: number): Promise<{
    checkIns: Array<{
      date: string;
      points: number;
      streakCount: number;
    }>;
  }>;

  getPointsHistory(userId: string, page: number, limit: number): Promise<{
    history: IPointsHistory[];
    total: number;
    totalPages: number;
    summary: {
      totalPoints: number;
      pointsByType: {
        daily_checkin: number;
        referral_bonus: number;
        quest_reward: number;
        bonus: number;
        deduction: number;
      };
    };
  }>;
}