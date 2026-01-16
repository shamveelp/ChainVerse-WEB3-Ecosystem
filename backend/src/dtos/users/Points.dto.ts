import { IsNumber, IsOptional, Min, Max } from 'class-validator';
import { Type } from 'class-transformer';
import { BaseResponseDto } from '../base/BaseResponse.dto';

export class GetCheckInCalendarDto {
  @IsOptional()
  @Type(() => Number)
  @IsNumber({}, { message: 'Month must be a number' })
  @Min(1, { message: 'Month must be between 1 and 12' })
  @Max(12, { message: 'Month must be between 1 and 12' })
  month?: number;

  @IsOptional()
  @Type(() => Number)
  @IsNumber({}, { message: 'Year must be a number' })
  @Min(2020, { message: 'Year must be 2020 or later' })
  @Max(2030, { message: 'Year must be 2030 or earlier' })
  year?: number;
}

export class PaginationDto {
  @IsOptional()
  @Type(() => Number)
  @IsNumber({}, { message: 'Page must be a number' })
  @Min(1, { message: 'Page must be at least 1' })
  page?: number;

  @IsOptional()
  @Type(() => Number)
  @IsNumber({}, { message: 'Limit must be a number' })
  @Min(1, { message: 'Limit must be at least 1' })
  @Max(100, { message: 'Limit cannot exceed 100' })
  limit?: number;
}

export class DailyCheckInResponseDto extends BaseResponseDto {
  pointsAwarded: number;
  streakCount: number;

  constructor(pointsAwarded: number, streakCount: number, message: string) {
    super(true, message);
    this.pointsAwarded = pointsAwarded;
    this.streakCount = streakCount;
  }
}

export interface ICheckInStatus {
  hasCheckedInToday: boolean;
  currentStreak: number;
  nextCheckInAvailable: Date | null;
}

export class CheckInStatusResponseDto extends BaseResponseDto {
  hasCheckedInToday: boolean;
  currentStreak: number;
  nextCheckInAvailable: Date | null;

  constructor(status: ICheckInStatus) {
    super(true, 'Check-in status retrieved successfully');
    this.hasCheckedInToday = status.hasCheckedInToday;
    this.currentStreak = status.currentStreak;
    this.nextCheckInAvailable = status.nextCheckInAvailable;
  }
}