import { BaseResponseDto } from '../base/BaseResponse.dto';

export class ReferralStatsDto {
  totalReferrals: number;
  totalPointsEarned: number;
  referralCode: string;
  referralLink: string;

  constructor(data: {
    totalReferrals: number;
    totalPointsEarned: number;
    referralCode: string;
    referralLink: string;
  }) {
    this.totalReferrals = data.totalReferrals;
    this.totalPointsEarned = data.totalPointsEarned;
    this.referralCode = data.referralCode;
    this.referralLink = data.referralLink;
  }
}

export class ReferralStatsResponseDto extends BaseResponseDto {
  data: ReferralStatsDto;

  constructor(stats: ReferralStatsDto) {
    super(true, 'Referral stats retrieved successfully');
    this.data = stats;
  }
}

export class ReferredUserDto {
  _id: string;
  username: string;
  name: string;
  email: string;
  createdAt: string;

  constructor(user: {
    _id: string;
    username: string;
    name: string;
    email: string;
    createdAt: string;
  }) {
    this._id = user._id;
    this.username = user.username;
    this.name = user.name;
    this.email = user.email;
    this.createdAt = user.createdAt;
  }
}

export class ReferralHistoryItemDto {
  _id: string;
  referred: ReferredUserDto;
  pointsAwarded: number;
  createdAt: string;

  constructor(item: {
    _id: string;
    referred: ReferredUserDto;
    pointsAwarded: number;
    createdAt: string;
  }) {
    this._id = item._id;
    this.referred = item.referred;
    this.pointsAwarded = item.pointsAwarded;
    this.createdAt = item.createdAt;
  }
}

export class ReferralHistoryStatsDto {
  totalReferrals: number;
  totalPointsEarned: number;

  constructor(stats: {
    totalReferrals: number;
    totalPointsEarned: number;
  }) {
    this.totalReferrals = stats.totalReferrals;
    this.totalPointsEarned = stats.totalPointsEarned;
  }
}

export class ReferralHistoryDto {
  referrals: ReferralHistoryItemDto[];
  total: number;
  totalPages: number;
  stats: ReferralHistoryStatsDto;

  constructor(data: {
    referrals: ReferralHistoryItemDto[];
    total: number;
    totalPages: number;
    stats: ReferralHistoryStatsDto;
  }) {
    this.referrals = data.referrals;
    this.total = data.total;
    this.totalPages = data.totalPages;
    this.stats = data.stats;
  }
}

export class ReferralHistoryResponseDto extends BaseResponseDto {
  data: ReferralHistoryDto;

  constructor(referralHistory: ReferralHistoryDto) {
    super(true, 'Referral history retrieved successfully');
    this.data = referralHistory;
  }
}