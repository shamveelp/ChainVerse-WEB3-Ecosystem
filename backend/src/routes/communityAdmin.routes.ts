import { Router } from 'express';
import container from '../core/di/container';
import { TYPES } from '../core/types/types';
import { CommunityAdminAuthController } from '../controllers/communityAdmin/communityAdminAuth.controller';
import { authMiddleware, roleMiddleware } from '../middlewares/auth.middleware';
import { validateBody } from '../middlewares/validation.middleware';
import { 
  CreateCommunityDto, 
  SetPasswordDto, 
  CommunityAdminLoginDto, 
  VerifyOtpDto 
} from '../dtos/communityAdmin/CommunityAdminAuth.dto';
import { AdminForgotPasswordDto, AdminVerifyOtpDto, AdminResetPasswordDto } from '../dtos/admin/AdminForgotPassword.dto';

const router = Router();
const communityAdminAuthController = container.get<CommunityAdminAuthController>(TYPES.ICommunityAdminAuthController);

// Public routes
router.post("/apply", validateBody(CreateCommunityDto), communityAdminAuthController.createCommunity.bind(communityAdminAuthController));
router.post("/set-password", validateBody(SetPasswordDto), communityAdminAuthController.setPassword.bind(communityAdminAuthController));
router.post("/verify-otp", validateBody(VerifyOtpDto), communityAdminAuthController.verifyOtp.bind(communityAdminAuthController));
router.post("/login", validateBody(CommunityAdminLoginDto), communityAdminAuthController.login.bind(communityAdminAuthController));
router.post("/forgot-password", validateBody(AdminForgotPasswordDto), communityAdminAuthController.forgotPassword.bind(communityAdminAuthController));
router.post("/verify-forgot-password-otp", validateBody(AdminVerifyOtpDto), communityAdminAuthController.verifyForgotPasswordOtp.bind(communityAdminAuthController));
router.post("/reset-password", validateBody(AdminResetPasswordDto), communityAdminAuthController.resetPassword.bind(communityAdminAuthController));

// Protected routes
router.post("/logout", authMiddleware, roleMiddleware(['communityAdmin']), communityAdminAuthController.logout.bind(communityAdminAuthController));
router.get("/profile", authMiddleware, roleMiddleware(['communityAdmin']), communityAdminAuthController.getProfile.bind(communityAdminAuthController));

export default router;