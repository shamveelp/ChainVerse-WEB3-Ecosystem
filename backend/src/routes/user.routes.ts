import { Router } from 'express';
import container from '../core/di/container';
import { UserAuthController } from '../controllers/user/userAuth.controller';
import { TYPES } from '../core/types/types';
import { authMiddleware } from '../middlewares/auth.middleware';
import { UserProfileController } from '../controllers/user/userProfile.controller';

const router = Router();

const userAuthController = container.get<UserAuthController>(TYPES.IUserAuthController);
const userProfileController = container.get<UserProfileController>(TYPES.IUserProfileController);


// Auth
router.post("/login", userAuthController.login.bind(userAuthController))
router.post("/refresh-token", userAuthController.refreshAccessToken.bind(userAuthController))
router.post("/logout", userAuthController.logout.bind(userAuthController))
router.post("/request-otp", userAuthController.requestOtp.bind(userAuthController))
router.post("/verify-otp", userAuthController.verifyOtp.bind(userAuthController))
router.post("/resend-otp", userAuthController.resendOtp.bind(userAuthController))
router.post("/forgot-password", userAuthController.forgotPassword.bind(userAuthController))
router.post("/verify-forgot-password-otp", userAuthController.verifyForgotPasswordOtp.bind(userAuthController))
router.post("/reset-password", userAuthController.resetPassword.bind(userAuthController))
router.post("/google-login", userAuthController.googleLogin.bind(userAuthController))


// Profile routes (protected)
router.get("/profile", authMiddleware, (req, res) => userProfileController.getProfile(req as any, res));
router.put("/profile", authMiddleware, (req, res) => userProfileController.updateProfile(req as any, res));
router.post("/check-username", authMiddleware, (req, res) => userProfileController.checkUsername(req as any, res));

export default router;
