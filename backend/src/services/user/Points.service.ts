import { injectable, inject } from "inversify";
import { IPointsService } from "../../core/interfaces/services/user/IPoints.service";
import { IDailyCheckInRepository } from "../../core/interfaces/repositories/IDailyCheckInRepository";
import { IPointsHistoryRepository } from "../../core/interfaces/repositories/IPointsHistoryRepository";
import { IUserRepository } from "../../core/interfaces/repositories/IUserRepository";
import { TYPES } from "../../core/types/types";
import { CustomError } from "../../utils/customError";
import { StatusCode } from "../../enums/statusCode.enum";
import { format, startOfDay, subDays } from "date-fns";
import logger from "../../utils/logger";

@injectable()
export class PointsService implements IPointsService {
  constructor(
    @inject(TYPES.IDailyCheckInRepository) private _dailyCheckInRepository: IDailyCheckInRepository,
    @inject(TYPES.IPointsHistoryRepository) private _pointsHistoryRepository: IPointsHistoryRepository,
    @inject(TYPES.IUserRepository) private _userRepository: IUserRepository
  ) {}

  async performDailyCheckIn(userId: string): Promise<{
    success: boolean;
    pointsAwarded: number;
    streakCount: number;
    message: string;
  }> {
    try {
      const todayCheckIn = await this._dailyCheckInRepository.findTodayCheckIn(userId);
      if (todayCheckIn) {
        throw new CustomError("You have already checked in today", StatusCode.BAD_REQUEST);
      }

      const lastCheckIn = await this._dailyCheckInRepository.getLastCheckIn(userId);
      let streakCount = 1;
      
      if (lastCheckIn) {
        const yesterday = startOfDay(subDays(new Date(), 1));
        const lastCheckInDate = startOfDay(lastCheckIn.checkInDate);
        
        if (lastCheckInDate.getTime() === yesterday.getTime()) {
          streakCount = lastCheckIn.streakCount + 1;
        }
      }

      const pointsAwarded = 10;
      const today = new Date();

      const checkIn = await this._dailyCheckInRepository.createCheckIn({
        userId,
        checkInDate: today,
        pointsAwarded,
        streakCount,
      });

      await this._pointsHistoryRepository.createPointsHistory({
        userId,
        type: 'daily_checkin',
        points: pointsAwarded,
        description: `Daily check-in streak day ${streakCount}`,
        relatedId: checkIn._id.toString(),
      });

      const user = await this._userRepository.findById(userId);
      if (user) {
        await this._userRepository.update(userId, {
          totalPoints: (user.totalPoints || 0) + pointsAwarded,
          'dailyCheckin.lastCheckIn': today,
          'dailyCheckin.streak': streakCount,
        } as any);
      }

      
      
      return {
        success: true,
        pointsAwarded,
        streakCount,
        message: `Check-in successful! You earned ${pointsAwarded} points. Streak: ${streakCount} days!`,
      };
    } catch (error) {
      console.error("PointsService: Daily check-in error:", error);
      if (error instanceof CustomError) {
        throw error;
      }
      throw new CustomError("Failed to perform daily check-in", StatusCode.INTERNAL_SERVER_ERROR);
    }
  }

  async getCheckInStatus(userId: string): Promise<{
    hasCheckedInToday: boolean;
    currentStreak: number;
    nextCheckInAvailable: Date | null;
  }> {
    try {
      
      
      const todayCheckIn = await this._dailyCheckInRepository.findTodayCheckIn(userId);
      const currentStreak = await this._dailyCheckInRepository.getStreakCount(userId);
      
      let nextCheckInAvailable = null;
      if (todayCheckIn) {
        const tomorrow = new Date();
        tomorrow.setDate(tomorrow.getDate() + 1);
        tomorrow.setHours(0, 0, 0, 0);
        nextCheckInAvailable = tomorrow;
      }

      return {
        hasCheckedInToday: !!todayCheckIn,
        currentStreak,
        nextCheckInAvailable,
      };
    } catch (error) {
      console.error("PointsService: Get check-in status error:", error);
      throw new CustomError("Failed to get check-in status", StatusCode.INTERNAL_SERVER_ERROR);
    }
  }

  async getCheckInCalendar(userId: string, month: number, year: number): Promise<{
    checkIns: Array<{
      date: string;
      points: number;
      streakCount: number;
    }>;
  }> {
    try {
      
      
      const checkIns = await this._dailyCheckInRepository.getCheckInHistory(userId, month, year);
      
      const formattedCheckIns = checkIns.map(checkIn => ({
        date: format(checkIn.checkInDate, 'yyyy-MM-dd'),
        points: checkIn.pointsAwarded,
        streakCount: checkIn.streakCount,
      }));

      return { checkIns: formattedCheckIns };
    } catch (error) {
      console.error("PointsService: Get check-in calendar error:", error);
      throw new CustomError("Failed to get check-in calendar", StatusCode.INTERNAL_SERVER_ERROR);
    }
  }

  async getPointsHistory(userId: string, page: number, limit: number): Promise<{
    history: any[];
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
  }> {
    try {
      
      
      const result = await this._pointsHistoryRepository.getPointsHistory(userId, page, limit);
      
      const pointsByType = {
        daily_checkin: await this._pointsHistoryRepository.getTotalPointsByType(userId, 'daily_checkin'),
        referral_bonus: await this._pointsHistoryRepository.getTotalPointsByType(userId, 'referral_bonus'),
        quest_reward: await this._pointsHistoryRepository.getTotalPointsByType(userId, 'quest_reward'),
        bonus: await this._pointsHistoryRepository.getTotalPointsByType(userId, 'bonus'),
        deduction: await this._pointsHistoryRepository.getTotalPointsByType(userId, 'deduction'),
      };

      const totalPoints = Object.values(pointsByType).reduce((sum, points) => sum + points, 0);

      return {
        history: result.history,
        total: result.total,
        totalPages: result.totalPages,
        summary: {
          totalPoints,
          pointsByType,
        },
      };
    } catch (error) {
      console.error("PointsService: Get points history error:", error);
      throw new CustomError("Failed to get points history", StatusCode.INTERNAL_SERVER_ERROR);
    }
  }
}