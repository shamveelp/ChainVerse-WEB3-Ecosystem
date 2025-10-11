import { Router } from "express";
import container from "../core/di/container";
import { TYPES } from "../core/types/types";
import { CommunityAdminAuthController } from "../controllers/communityAdmin/CommunityAdminAuth.controller";
import { authMiddleware, roleMiddleware } from "../middlewares/auth.middleware";
import {
  validateBody,
  validateQuery,
} from "../middlewares/validation.middleware";
import {
  CreateCommunityDto,
  SetPasswordDto,
  CommunityAdminLoginDto,
  VerifyOtpDto,
  CheckEmailDto,
  CheckUsernameDto,
  ResendOtpDto,
} from "../dtos/communityAdmin/CommunityAdminAuth.dto";
import {
  ForgotPasswordDto,
  VerifyOtpDto as AdminVerifyOtpDto,
  ResetPasswordDto,
} from "../dtos/ForgotPassword.dto";
import { uploadMiddleware } from "../middlewares/upload.middleware";

const router = Router();
const communityAdminAuthController =
  container.get<CommunityAdminAuthController>(
    TYPES.ICommunityAdminAuthController
  );

// Live validation endpoints
router.get(
  "/check-email",
  validateQuery(CheckEmailDto),
  communityAdminAuthController.checkEmailExists.bind(
    communityAdminAuthController
  )
);
router.get(
  "/check-username",
  validateQuery(CheckUsernameDto),
  communityAdminAuthController.checkUsernameExists.bind(
    communityAdminAuthController
  )
);

// Application flow
router.post(
  "/apply",
  uploadMiddleware.fields([
    { name: "logo", maxCount: 1 },
    { name: "banner", maxCount: 1 },
  ]),
  validateBody(CreateCommunityDto),
  communityAdminAuthController.createCommunity.bind(
    communityAdminAuthController
  )
);
router.post(
  "/set-password",
  validateBody(SetPasswordDto),
  communityAdminAuthController.setPassword.bind(communityAdminAuthController)
);
router.post(
  "/verify-otp",
  validateBody(VerifyOtpDto),
  communityAdminAuthController.verifyOtp.bind(communityAdminAuthController)
);
router.post(
  "/resend-otp",
  validateBody(ResendOtpDto),
  communityAdminAuthController.resendOtp.bind(communityAdminAuthController)
);
router.post(
  "/reapply",
  uploadMiddleware.fields([
    { name: "logo", maxCount: 1 },
    { name: "banner", maxCount: 1 },
  ]),
  validateBody(CreateCommunityDto),
  communityAdminAuthController.reapplyApplication.bind(
    communityAdminAuthController
  )
);

// Authentication
router.post(
  "/login",
  validateBody(CommunityAdminLoginDto),
  communityAdminAuthController.login.bind(communityAdminAuthController)
);
router.post(
  "/refresh-token",
  communityAdminAuthController.refreshToken.bind(communityAdminAuthController)
);

// Password reset
router.post(
  "/forgot-password",
  validateBody(ForgotPasswordDto),
  communityAdminAuthController.forgotPassword.bind(communityAdminAuthController)
);
router.post(
  "/verify-forgot-password-otp",
  validateBody(AdminVerifyOtpDto),
  communityAdminAuthController.verifyForgotPasswordOtp.bind(
    communityAdminAuthController
  )
);
router.post(
  "/reset-password",
  validateBody(ResetPasswordDto),
  communityAdminAuthController.resetPassword.bind(communityAdminAuthController)
);

// Protected routes
router.post(
  "/logout",
  authMiddleware,
  roleMiddleware(["communityAdmin"]),
  communityAdminAuthController.logout.bind(communityAdminAuthController)
);
router.get(
  "/profile",
  authMiddleware,
  roleMiddleware(["communityAdmin"]),
  communityAdminAuthController.getProfile.bind(communityAdminAuthController)
);
router.get(
  "/community",
  authMiddleware,
  roleMiddleware(["communityAdmin"]),
  communityAdminAuthController.getCommunityDetails.bind(
    communityAdminAuthController
  )
);
router.put(
  "/community",
  authMiddleware,
  roleMiddleware(["communityAdmin"]),
  uploadMiddleware.fields([
    { name: "logo", maxCount: 1 },
    { name: "banner", maxCount: 1 },
  ]),
  communityAdminAuthController.updateCommunity.bind(
    communityAdminAuthController
  )
);

export default router;
