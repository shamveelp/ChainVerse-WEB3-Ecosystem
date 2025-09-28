import { Router } from 'express';
import container from '../core/di/container';
import { UserAuthController } from '../controllers/user/UserAuth.controller';
import { TYPES } from '../core/types/types';
import { authMiddleware, roleMiddleware } from '../middlewares/auth.middleware';
import { UserProfileController } from '../controllers/user/UserProfile.controller';
import { CommunityUserProfileController } from '../controllers/community/CommunityUserProfile.controller';
import multer from 'multer';
import { ReferralController } from '../controllers/user/Referral.controller';
import { PointsController } from '../controllers/user/Points.controller';
import { validateBody } from '../middlewares/validation.middleware';
import { 
  UserRegisterDto, 
  UserLoginDto, 
  VerifyOtpDto, 
  CheckUsernameDto, 
  ForgotPasswordDto, 
  ResetPasswordDto,
  RequestOtpDto,
  GoogleLoginDto
} from '../dtos/users/UserAuth.dto';
import { UserDexController } from '../controllers/user/UserDex.controller';

// Configure Multer for file uploads
const storage = multer.memoryStorage();
const upload = multer({
  storage,
  limits: { fileSize: 5 * 1024 * 1024 }, // 5MB limit
  fileFilter: (req, file, cb) => {
    const filetypes = /jpeg|jpg|png/;
    const mimetype = filetypes.test(file.mimetype);
    if (mimetype) {
      return cb(null, true);
    }
    cb(new Error("File type not supported. Only JPEG and PNG are allowed."));
  },
});

const router = Router();

const userAuthController = container.get<UserAuthController>(TYPES.IUserAuthController);
const userProfileController = container.get<UserProfileController>(TYPES.IUserProfileController);
const communityUserProfileController = container.get<CommunityUserProfileController>(TYPES.ICommunityUserProfileController);
const referralController = container.get<ReferralController>(TYPES.IReferralController);
const pointsController = container.get<PointsController>(TYPES.IPointsController);
const userDexController = container.get<UserDexController>(TYPES.IUserDexController);

// Auth Routes with DTO validation
router.post("/register", 
  validateBody(UserRegisterDto), 
  userAuthController.register.bind(userAuthController)
);

router.post("/login", 
  validateBody(UserLoginDto), 
  userAuthController.login.bind(userAuthController)
);

router.post("/verify-otp", 
  validateBody(VerifyOtpDto), 
  userAuthController.verifyOtp.bind(userAuthController)
);

router.post("/check-username", 
  validateBody(CheckUsernameDto), 
  userAuthController.checkUsername.bind(userAuthController)
);

router.post("/request-otp", 
  validateBody(RequestOtpDto), 
  userAuthController.requestOtp.bind(userAuthController)
);

router.post("/forgot-password", 
  validateBody(ForgotPasswordDto), 
  userAuthController.forgotPassword.bind(userAuthController)
);

router.post("/reset-password", 
  validateBody(ResetPasswordDto), 
  userAuthController.resetPassword.bind(userAuthController)
);

router.post("/google-login", 
  validateBody(GoogleLoginDto), 
  userAuthController.googleLogin.bind(userAuthController)
);

// Routes without DTO validation (simple requests)
router.get("/generate-username", userAuthController.generateUsername.bind(userAuthController));
router.post("/refresh-token", userAuthController.refreshAccessToken.bind(userAuthController));
router.post("/logout", userAuthController.logout.bind(userAuthController));
router.post("/resend-otp", userAuthController.resendOtp.bind(userAuthController));
router.post("/verify-forgot-password-otp", userAuthController.verifyForgotPasswordOtp.bind(userAuthController));

// Profile Routes (protected)
router.get('/get-profile', 
  authMiddleware, 
  roleMiddleware(['user']), 
  userProfileController.getProfile.bind(userProfileController)
);

router.put('/profile', 
  authMiddleware, 
  roleMiddleware(['user']), 
  userProfileController.updateProfile.bind(userProfileController)
);

router.post('/upload-profile-image', 
  authMiddleware, 
  roleMiddleware(['user']), 
  upload.single('profileImage'), 
  userProfileController.uploadProfileImage.bind(userProfileController)
);

// Community Profile Routes (protected)
router.get('/community/profile', 
  authMiddleware, 
  roleMiddleware(['user']), 
  communityUserProfileController.getCommunityProfile.bind(communityUserProfileController)
);

router.get('/community/profile/username/:username', 
  communityUserProfileController.getCommunityProfileByUsername.bind(communityUserProfileController)
);

router.put('/community/profile', 
  authMiddleware, 
  roleMiddleware(['user']), 
  communityUserProfileController.updateCommunityProfile.bind(communityUserProfileController)
);

router.post('/community/upload-banner-image', 
  authMiddleware, 
  roleMiddleware(['user']), 
  upload.single('bannerImage'), 
  communityUserProfileController.uploadBannerImage.bind(communityUserProfileController)
);

// Referral Routes (protected)
router.get('/referrals/history', 
  authMiddleware, 
  roleMiddleware(['user']), 
  referralController.getReferralHistory.bind(referralController)
);

router.get('/referrals/stats', 
  authMiddleware, 
  roleMiddleware(['user']), 
  referralController.getReferralStats.bind(referralController)
);

// Points Routes (protected)
router.post('/points/daily-checkin', 
  authMiddleware, 
  roleMiddleware(['user']), 
  pointsController.performDailyCheckIn.bind(pointsController)
);

router.get('/points/checkin-status', 
  authMiddleware, 
  roleMiddleware(['user']), 
  pointsController.getCheckInStatus.bind(pointsController)
);

router.get('/points/checkin-calendar', 
  authMiddleware, 
  roleMiddleware(['user']), 
  pointsController.getCheckInCalendar.bind(pointsController)
);

router.get('/points/history', 
  authMiddleware, 
  roleMiddleware(['user']), 
  pointsController.getPointsHistory.bind(pointsController)
);

// Buy crypto - DEX Routes (protected)
router.get('/dex/eth-price', 
  authMiddleware, 
  roleMiddleware(['user']), 
  userDexController.getEthPrice.bind(userDexController)
);

router.post('/dex/calculate-estimate', 
  authMiddleware, 
  roleMiddleware(['user']), 
  userDexController.calculateEstimate.bind(userDexController)
);

router.post('/dex/create-order', 
  authMiddleware, 
  roleMiddleware(['user']), 
  userDexController.createPaymentOrder.bind(userDexController)
);

router.post('/dex/verify-payment', 
  authMiddleware, 
  roleMiddleware(['user']), 
  userDexController.verifyPayment.bind(userDexController)
);

router.get('/dex/payments', 
  authMiddleware, 
  roleMiddleware(['user']), 
  userDexController.getUserPayments.bind(userDexController)
);

export default router;