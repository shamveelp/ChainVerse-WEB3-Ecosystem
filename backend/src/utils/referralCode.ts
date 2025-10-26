import { customAlphabet } from 'nanoid';
import { UserModel } from '../models/user.models';

const alphabet = '0123456789ABCDEFGHIJKLMNOPQRSTUVWXYZ';
const nanoid = customAlphabet(alphabet, 8);

export class ReferralCodeService {
  static async generateUniqueReferralCode(): Promise<string> {
    let referralCode: string;
    let isUnique = false;
    let attempts = 0;
    const maxAttempts = 20;

    while (!isUnique && attempts < maxAttempts) {
      referralCode = nanoid();
      
      const existingUser = await UserModel.findOne({ refferalCode: referralCode }).exec();
      if (!existingUser) {
        isUnique = true;
      }
      attempts++;
    }

    if (!isUnique) {
      throw new Error('Unable to generate a unique referral code after maximum attempts');
    }

    return referralCode!;
  }

  static async validateReferralCode(referralCode: string): Promise<string | null> {
    try {
      if (!referralCode || referralCode.trim().length !== 8) {
        return null;
      }

      const cleanReferralCode = referralCode.trim();
      
      const user = await UserModel.findOne({ refferalCode: cleanReferralCode }).exec();
      
      if (user) {
        
        return user._id.toString();
      }
      
      
      return null;
    } catch (error) {
      console.error('Error validating referral code:', error);
      return null;
    }
  }


  static async getReferralStats(userId: string) {
    try {
      const referrals = await UserModel.countDocuments({ refferedBy: userId });
      const totalPointsEarned = referrals * 100;
      
      return {
        totalReferrals: referrals,
        pointsEarned: totalPointsEarned,
      };
    } catch (error) {
      console.error('Error getting referral stats:', error);
      return {
        totalReferrals: 0,
        pointsEarned: 0,
      };
    }
  }


  static async getReferredUsers(userId: string, page = 1, limit = 10) {
    try {
      const skip = (page - 1) * limit;
      
      const referredUsers = await UserModel.find({ refferedBy: userId })
        .select('username name email createdAt totalPoints')
        .sort({ createdAt: -1 })
        .skip(skip)
        .limit(limit)
        .exec();

      const total = await UserModel.countDocuments({ refferedBy: userId });
      
      return {
        users: referredUsers,
        total,
        page,
        totalPages: Math.ceil(total / limit),
      };
    } catch (error) {
      console.error('Error getting referred users:', error);
      return {
        users: [],
        total: 0,
        page,
        totalPages: 0,
      };
    }
  }
}