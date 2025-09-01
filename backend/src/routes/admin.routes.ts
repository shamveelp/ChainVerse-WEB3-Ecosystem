import { Router } from 'express';
import container from '../core/di/container';
import { TYPES } from '../core/types/types';
import { AdminAuthController } from '../controllers/admin/adminAuth.controller';
import { AdminUserController } from '../controllers/admin/adminUser.controller';
import { AdminCommunityController } from '../controllers/admin/adminCommunity.controller';
import { authMiddleware, roleMiddleware } from '../middlewares/auth.middleware';
import { validateBody, validateQuery } from '../middlewares/validation.middleware';
import { AdminLoginDto, AdminChangePasswordDto } from '../dtos/admin/AdminAuth.dto';
import { AdminForgotPasswordDto, AdminVerifyOtpDto, AdminResetPasswordDto } from '../dtos/admin/AdminForgotPassword.dto';
import { GetUsersQueryDto, UpdateUserStatusDto } from '../dtos/admin/AdminUser.dto';
import { GetCommunityRequestsQueryDto, RejectCommunityRequestDto } from '../dtos/admin/AdminCommunity.dto';

const router = Router();

const adminAuthController = container.get<AdminAuthController>(TYPES.IAdminAuthController);
const adminUserController = container.get<AdminUserController>(TYPES.IAdminUserController);
const adminCommunityController = container.get<AdminCommunityController>(TYPES.IAdminCommunityController);

// Auth Routes (Public)
router.post("/login", validateBody(AdminLoginDto), adminAuthController.login.bind(adminAuthController));
router.post("/forgot-password", validateBody(AdminForgotPasswordDto), adminAuthController.forgotPassword.bind(adminAuthController));
router.post("/verify-forgot-password-otp", validateBody(AdminVerifyOtpDto), adminAuthController.verifyForgotPasswordOtp.bind(adminAuthController));
router.post("/reset-password", validateBody(AdminResetPasswordDto), adminAuthController.resetPassword.bind(adminAuthController));

// Protected Routes - Auth
router.post("/logout", authMiddleware, roleMiddleware(['admin']), adminAuthController.logout.bind(adminAuthController));
router.get("/profile", authMiddleware, roleMiddleware(['admin']), adminAuthController.getProfile.bind(adminAuthController));
router.post("/change-password", authMiddleware, roleMiddleware(['admin']), validateBody(AdminChangePasswordDto), adminAuthController.changePassword.bind(adminAuthController));

// Protected Routes - User Management
router.get("/users", authMiddleware, roleMiddleware(['admin']), validateQuery(GetUsersQueryDto), adminUserController.getAllUsers.bind(adminUserController));
router.get("/users/:id", authMiddleware, roleMiddleware(['admin']), adminUserController.getUserById.bind(adminUserController));
router.patch("/users/:id", authMiddleware, roleMiddleware(['admin']), validateBody(UpdateUserStatusDto), adminUserController.updateUserStatus.bind(adminUserController));
router.patch("/users/:id/ban", authMiddleware, roleMiddleware(['admin']), adminUserController.updateUserBanStatus.bind(adminUserController));
router.delete("/users/:id", authMiddleware, roleMiddleware(['admin']), adminUserController.deleteUser.bind(adminUserController));

// Protected Routes - Community Management
router.get("/community-requests", authMiddleware, roleMiddleware(['admin']), validateQuery(GetCommunityRequestsQueryDto), adminCommunityController.getAllCommunityRequests.bind(adminCommunityController));
router.get("/community-requests/:id", authMiddleware, roleMiddleware(['admin']), adminCommunityController.getCommunityRequestById.bind(adminCommunityController));
router.patch("/community-requests/:id/approve", authMiddleware, roleMiddleware(['admin']), adminCommunityController.approveCommunityRequest.bind(adminCommunityController));
router.patch("/community-requests/:id/reject", authMiddleware, roleMiddleware(['admin']), validateBody(RejectCommunityRequestDto), adminCommunityController.rejectCommunityRequest.bind(adminCommunityController));

export default router;