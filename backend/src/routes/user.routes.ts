import { Router } from 'express';
import container from '../core/di/container';
import { UserAuthController } from '../controllers/user/UserAuth.controller';
import { TYPES } from '../core/types/types';
import { authMiddleware } from '../middlewares/auth.middleware';

const router = Router();

const userAuthController = container.get<UserAuthController>(TYPES.IUserAuthController);

// Auth
// Auth
router.post("/login", userAuthController.login.bind(userAuthController))
router.post("/request-otp", userAuthController.requestOtp.bind(userAuthController))
router.post("/verify-otp", userAuthController.verifyOtp.bind(userAuthController))
router.post("/forgot-password", userAuthController.forgotPassword.bind(userAuthController))
router.post("/verify-forgot-password-otp", userAuthController.verifyForgotPasswordOtp.bind(userAuthController))
router.post("/reset-password", userAuthController.resetPassword.bind(userAuthController))
router.post("/refresh-token", userAuthController.refreshAccessToken.bind(userAuthController)) // Changed from refresh-access-token to refresh-token for consistency with frontend
router.post("/logout", authMiddleware, userAuthController.logout.bind(userAuthController)) // Protected logout route
router.post("/google-auth", userAuthController.googleAuth.bind(userAuthController)) // Added Google Auth route



export default router;
