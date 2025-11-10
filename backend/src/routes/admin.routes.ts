import { Router } from "express";
import container from "../core/di/container";
import { TYPES } from "../core/types/types";
import { AdminAuthController } from "../controllers/admin/AdminAuth.controller";
import { AdminUserController } from "../controllers/admin/AdminUser.controller";
import { AdminCommunityController } from "../controllers/admin/AdminCommunity.controller";
import { authMiddleware, roleMiddleware } from "../middlewares/auth.middleware";
import {
  validateBody,
  validateQuery,
} from "../middlewares/validation.middleware";
import {
  AdminLoginDto,
  AdminChangePasswordDto,
} from "../dtos/admin/AdminAuth.dto";
import {
  AdminForgotPasswordDto,
  AdminVerifyOtpDto,
  AdminResetPasswordDto,
} from "../dtos/admin/AdminForgotPassword.dto";
import {
  GetUsersQueryDto,
  UpdateUserStatusDto,
} from "../dtos/admin/AdminUser.dto";
import {
  GetCommunityRequestsQueryDto,
  RejectCommunityRequestDto,
} from "../dtos/admin/AdminCommunity.dto";
import { AdminWalletController } from "../controllers/admin/AdminWallet.controller";
import { AdminDexController } from "../controllers/admin/adminDex.controller";
import { ApproveConversionDto, GetConversionsAdminQueryDto, GetConversionsQueryDto, RejectConversionDto, UpdateConversionRateDto } from "../dtos/points/PointsConversion.dto";
import { Admin } from "mongodb";
import { AdminPointsConversionController } from "../controllers/points/AdminPointsConversion.controller";

const router = Router();

const adminAuthController = container.get<AdminAuthController>(
  TYPES.IAdminAuthController
);
const adminUserController = container.get<AdminUserController>(
  TYPES.IAdminUserController
);
const adminCommunityController = container.get<AdminCommunityController>(
  TYPES.IAdminCommunityController
);
const adminWalletController = container.get<AdminWalletController>(
  TYPES.IAdminWalletController
);
const adminDexController = container.get<AdminDexController>(
  TYPES.IAdminDexController
);
const adminPointsConversionController = container.get<AdminPointsConversionController>(
  TYPES.IAdminPointsConversionController
)

// Auth Routes (Public)
router.post(
  "/login",
  validateBody(AdminLoginDto),
  adminAuthController.login.bind(adminAuthController)
);
router.post(
  "/forgot-password",
  validateBody(AdminForgotPasswordDto),
  adminAuthController.forgotPassword.bind(adminAuthController)
);
router.post(
  "/verify-forgot-password-otp",
  validateBody(AdminVerifyOtpDto),
  adminAuthController.verifyForgotPasswordOtp.bind(adminAuthController)
);
router.post(
  "/reset-password",
  validateBody(AdminResetPasswordDto),
  adminAuthController.resetPassword.bind(adminAuthController)
);

router.post(
  "/refresh-token",
  adminAuthController.refreshToken.bind(adminAuthController)
);

// Protected Routes - Auth
router.post(
  "/logout",
  authMiddleware,
  roleMiddleware(["admin"]),
  adminAuthController.logout.bind(adminAuthController)
);
router.get(
  "/profile",
  authMiddleware,
  roleMiddleware(["admin"]),
  adminAuthController.getProfile.bind(adminAuthController)
);
router.post(
  "/change-password",
  authMiddleware,
  roleMiddleware(["admin"]),
  validateBody(AdminChangePasswordDto),
  adminAuthController.changePassword.bind(adminAuthController)
);

// Protected Routes - User Management
router.get(
  "/users",
  authMiddleware,
  roleMiddleware(["admin"]),
  validateQuery(GetUsersQueryDto),
  adminUserController.getAllUsers.bind(adminUserController)
);
router.get(
  "/users/:id",
  authMiddleware,
  roleMiddleware(["admin"]),
  adminUserController.getUserById.bind(adminUserController)
);
router.patch(
  "/users/:id",
  authMiddleware,
  roleMiddleware(["admin"]),
  validateBody(UpdateUserStatusDto),
  adminUserController.updateUserStatus.bind(adminUserController)
);
router.patch(
  "/users/:id/ban",
  authMiddleware,
  roleMiddleware(["admin"]),
  adminUserController.updateUserBanStatus.bind(adminUserController)
);
router.delete(
  "/users/:id",
  authMiddleware,
  roleMiddleware(["admin"]),
  adminUserController.deleteUser.bind(adminUserController)
);

router.get(
  "/users/:id/referrals",
  authMiddleware,
  roleMiddleware(["admin"]),
  adminUserController.getUserReferrals.bind(adminUserController)
);
router.get(
  "/users/:id/points-history",
  authMiddleware,
  roleMiddleware(["admin"]),
  adminUserController.getUserPointsHistory.bind(adminUserController)
);
router.get(
  "/users/:id/checkin-history",
  authMiddleware,
  roleMiddleware(["admin"]),
  adminUserController.getUserCheckInHistory.bind(adminUserController)
);
router.get(
  "/users/:id/stats",
  authMiddleware,
  roleMiddleware(["admin"]),
  adminUserController.getUserStats.bind(adminUserController)
);

// Protected Routes - Community Management
router.get(
  "/community-requests",
  authMiddleware,
  roleMiddleware(["admin"]),
  validateQuery(GetCommunityRequestsQueryDto),
  adminCommunityController.getAllCommunityRequests.bind(
    adminCommunityController
  )
);
router.get(
  "/community-requests/:id",
  authMiddleware,
  roleMiddleware(["admin"]),
  adminCommunityController.getCommunityRequestById.bind(
    adminCommunityController
  )
);
router.patch(
  "/community-requests/:id/approve",
  authMiddleware,
  roleMiddleware(["admin"]),
  adminCommunityController.approveCommunityRequest.bind(
    adminCommunityController
  )
);
router.patch(
  "/community-requests/:id/reject",
  authMiddleware,
  roleMiddleware(["admin"]),
  validateBody(RejectCommunityRequestDto),
  adminCommunityController.rejectCommunityRequest.bind(adminCommunityController)
);

// Protected Routes - Wallet Management
router.get(
  "/wallets",
  authMiddleware,
  roleMiddleware(["admin"]),
  adminWalletController.getAllWallets.bind(adminWalletController)
);
router.get(
  "/wallets/stats",
  authMiddleware,
  roleMiddleware(["admin"]),
  adminWalletController.getWalletStats.bind(adminWalletController)
);
router.get(
  "/wallets/export",
  authMiddleware,
  roleMiddleware(["admin"]),
  adminWalletController.exportWalletData.bind(adminWalletController)
);
router.get(
  "/wallets/:address",
  authMiddleware,
  roleMiddleware(["admin"]),
  adminWalletController.getWalletDetails.bind(adminWalletController)
);
router.get(
  "/wallets/:address/transactions",
  authMiddleware,
  roleMiddleware(["admin"]),
  adminWalletController.getWalletTransactions.bind(adminWalletController)
);
router.get(
  "/wallets/:address/history",
  authMiddleware,
  roleMiddleware(["admin"]),
  adminWalletController.getWalletHistoryFromEtherscan.bind(
    adminWalletController
  )
);
router.get(
  "/wallets/:address/app-history",
  authMiddleware,
  roleMiddleware(["admin"]),
  adminWalletController.getWalletAppHistory.bind(adminWalletController)
);
router.post(
  "/wallets/:address/refresh",
  authMiddleware,
  roleMiddleware(["admin"]),
  adminWalletController.refreshWalletData.bind(adminWalletController)
);
router.get(
  "/wallets/:address/blockchain-transactions",
  authMiddleware,
  roleMiddleware(["admin"]),
  adminWalletController.getWalletBlockchainTransactions.bind(
    adminWalletController
  )
);
router.get(
  "/wallets/:address/contract-interactions",
  authMiddleware,
  roleMiddleware(["admin"]),
  adminWalletController.getWalletContractInteractions.bind(
    adminWalletController
  )
);

// Dex Payment Routes
router.get(
  "/dex/payments",
  authMiddleware,
  roleMiddleware(["admin"]),
  adminDexController.getAllPayments.bind(adminDexController)
);
router.post(
  "/dex/approve-payment",
  authMiddleware,
  roleMiddleware(["admin"]),
  adminDexController.approvePayment.bind(adminDexController)
);
router.post(
  "/dex/reject-payment",
  authMiddleware,
  roleMiddleware(["admin"]),
  adminDexController.rejectPayment.bind(adminDexController)
);
router.post(
  "/dex/fulfill-payment",
  authMiddleware,
  roleMiddleware(["admin"]),
  adminDexController.fulfillPayment.bind(adminDexController)
);
router.get(
  "/dex/stats",
  authMiddleware,
  roleMiddleware(["admin"]),
  adminDexController.getPaymentStats.bind(adminDexController)
);
router.get(
  "/dex/pending",
  authMiddleware,
  roleMiddleware(["admin"]),
  adminDexController.getPendingPayments.bind(adminDexController)
);

// Admin Points Conversion Routes
router.get(
  "/points-conversion/all",
  authMiddleware,
  roleMiddleware(["admin"]),
  validateQuery(GetConversionsAdminQueryDto),
  adminPointsConversionController.getAllConversions.bind(
    adminPointsConversionController
  )
);
router.post(
  "/points-conversion/:conversionId/approve",
  authMiddleware,
  roleMiddleware(["admin"]),
  validateBody(ApproveConversionDto),
  adminPointsConversionController.approveConversion.bind(
    adminPointsConversionController
  )
);
router.post(
  "/points-conversion/:conversionId/reject",
  authMiddleware,
  roleMiddleware(["admin"]),
  validateBody(RejectConversionDto),
  adminPointsConversionController.rejectConversion.bind(
    adminPointsConversionController
  )
);
router.get(
  "/points-conversion/stats",
  authMiddleware,
  roleMiddleware(["admin"]),
  adminPointsConversionController.getConversionStats.bind(
    adminPointsConversionController
  )
);
router.get(
  "/points-conversion/:conversionId",
  authMiddleware,
  roleMiddleware(["admin"]),
  adminPointsConversionController.getConversionById.bind(
    adminPointsConversionController
  )
);
router.post(
  "/points-conversion/rate/update",
  authMiddleware,
  roleMiddleware(["admin"]),
  validateBody(UpdateConversionRateDto),
  adminPointsConversionController.updateConversionRate.bind(
    adminPointsConversionController
  )
);
router.get(
  "/points-conversion/rates",
  authMiddleware,
  roleMiddleware(["admin"]),
  validateQuery(GetConversionsQueryDto),
  adminPointsConversionController.getConversionRates.bind(
    adminPointsConversionController
  )
);
router.get(
  "/points-conversion/rate/current",
  authMiddleware,
  roleMiddleware(["admin"]),
  adminPointsConversionController.getCurrentRate.bind(
    adminPointsConversionController
  )
);

export default router;
