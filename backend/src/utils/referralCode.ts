import { customAlphabet } from 'nanoid';
import { UserModel } from '../models/user.models';

// Create a custom alphabet for referral codes (alphanumeric, no special chars)
const alphabet = '0123456789ABCDEFGHIJKLMNOPQRSTUVWXYZabcdefghijklmnopqrstuvwxyz';
const nanoid = customAlphabet(alphabet, 8);

// Utility class for generating and validating referral codes
export class ReferralCodeService {
  // Generate a unique 8-character referral code
  static async generateUniqueReferralCode(): Promise<string> {
    let referralCode: string;
    let isUnique = false;
    let attempts = 0;
    const maxAttempts = 20; // Increased attempts

    while (!isUnique && attempts < maxAttempts) {
      referralCode = nanoid();
      
      // Check if this code already exists
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

  // Validate a referral code and return the referrer's ID
  static async validateReferralCode(referralCode: string): Promise<string | null> {
    try {
      if (!referralCode || referralCode.trim().length !== 8) {
        return null;
      }

      const cleanReferralCode = referralCode.trim();
      
      // Find user with this referral code
      const user = await UserModel.findOne({ refferalCode: cleanReferralCode }).exec();
      
      if (user) {
        console.log(`Found referrer: ${user._id} for code: ${cleanReferralCode}`);
        return user._id.toString();
      }
      
      console.log(`No user found for referral code: ${cleanReferralCode}`);
      return null;
    } catch (error) {
      console.error('Error validating referral code:', error);
      return null;
    }
  }

  // Get referral statistics for a user
  static async getReferralStats(userId: string) {
    try {
      const referrals = await UserModel.countDocuments({ refferedBy: userId });
      const totalPointsEarned = referrals * 100; // 100 points per referral
      
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

  // Get list of users referred by a specific user
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