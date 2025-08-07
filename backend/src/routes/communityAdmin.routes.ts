import { Router } from 'express';
import container from '../core/di/container';
import { TYPES } from '../core/types/types';
import { CommunityAdminAuthController } from '../controllers/communityAdmin/CommunityAdminAuth.controller';

const router = Router();
const communityAdminAuthController = container.get<CommunityAdminAuthController>(TYPES.ICommunityAdminAuthController);

// Public routes
router.post("/apply", communityAdminAuthController.createCommunity.bind(communityAdminAuthController));
router.post("/set-password", communityAdminAuthController.setPassword.bind(communityAdminAuthController));
router.post("/verify-otp", communityAdminAuthController.verifyOtp.bind(communityAdminAuthController));
router.post("/login", communityAdminAuthController.login.bind(communityAdminAuthController));
router.post("/forgot-password", communityAdminAuthController.forgotPassword.bind(communityAdminAuthController));
router.post("/verify-forgot-password-otp", communityAdminAuthController.verifyForgotPasswordOtp.bind(communityAdminAuthController));
router.post("/reset-password", communityAdminAuthController.resetPassword.bind(communityAdminAuthController));

// Protected routes
router.post("/logout",  communityAdminAuthController.logout.bind(communityAdminAuthController));
router.get("/profile",  communityAdminAuthController.getProfile.bind(communityAdminAuthController));

export default router;
