import { Router } from "express";
import container from "../core/di/container";
import { TYPES } from "../core/types/types";
import { CommunityAdminAuthController } from "../controllers/communityAdmin/CommunityAdminAuth.controller";
import { CommunityAdminProfileController } from "../controllers/communityAdmin/CommunityAdminProfile.controller";
import { CommunityAdminFeedController } from "../controllers/communityAdmin/CommunityAdminFeed.controller";
import { CommunityAdminMembersController } from "../controllers/communityAdmin/CommunityAdminMembers.controller";
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
import { UpdateCommunityAdminProfileDto } from "../dtos/communityAdmin/CommunityAdminProfile.dto";
import { GetCommunityFeedDto } from "../dtos/communityAdmin/CommunityAdminFeed.dto";
import {
  GetCommunityMembersDto,
  UpdateMemberRoleDto,
  BanMemberDto,
} from "../dtos/communityAdmin/CommunityAdminMembers.dto";
import { CreateCommentDto } from "../dtos/posts/Post.dto";
import {
  ForgotPasswordDto,
  VerifyOtpDto as AdminVerifyOtpDto,
  ResetPasswordDto,
} from "../dtos/ForgotPassword.dto";
import { uploadMiddleware } from "../middlewares/upload.middleware";
import multer from "multer";
import { ICommunityAdminDashboardController } from "../core/interfaces/controllers/communityAdmin/ICommunityAdminDashboard.controller";
import { CommunityAdminCommunityController } from "../controllers/communityAdmin/CommunityAdminCommunity.controller";
import { CommunityAdminChainCastController } from "../controllers/chainCast/CommunityAdminChainCast.controller";
import {
  CreateChainCastDto,
  GetChainCastsQueryDto,
  GetParticipantsQueryDto,
  GetReactionsQueryDto,
  ReviewModerationRequestDto,
  UpdateChainCastDto,
} from "../dtos/chainCast/ChainCast.dto";

// Configure Multer for profile picture uploads
const storage = multer.memoryStorage();
const upload = multer({
  storage,
  limits: { fileSize: 5 * 1024 * 1024 }, // 5MB limit for profile pictures
  fileFilter: (req, file, cb) => {
    const allowedTypes = /jpeg|jpg|png|gif/;
    const mimetype = allowedTypes.test(file.mimetype);
    if (mimetype) {
      return cb(null, true);
    }
    cb(
      new Error(
        "Only image files (JPEG, PNG, GIF) are allowed for profile pictures."
      )
    );
  },
});

const router = Router();

// Get controller instances
const communityAdminAuthController =
  container.get<CommunityAdminAuthController>(
    TYPES.ICommunityAdminAuthController
  );
const communityAdminProfileController =
  container.get<CommunityAdminProfileController>(
    TYPES.ICommunityAdminProfileController
  );
const communityAdminFeedController =
  container.get<CommunityAdminFeedController>(
    TYPES.ICommunityAdminFeedController
  );
const communityAdminMembersController =
  container.get<CommunityAdminMembersController>(
    TYPES.ICommunityAdminMembersController
  );
const communityAdminDashboardController =
  container.get<ICommunityAdminDashboardController>(
    TYPES.ICommunityAdminDashboardController
  );
const communityAdminCommunityController =
  container.get<CommunityAdminCommunityController>(
    TYPES.ICommunityAdminCommunityController
  );
const communityAdminChainCastController =
  container.get<CommunityAdminChainCastController>(
    TYPES.ICommunityAdminChainCastController
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

// Profile management
router.get(
  "/profile",
  authMiddleware,
  roleMiddleware(["communityAdmin"]),
  communityAdminProfileController.getProfile.bind(
    communityAdminProfileController
  )
);
router.put(
  "/profile",
  authMiddleware,
  roleMiddleware(["communityAdmin"]),
  validateBody(UpdateCommunityAdminProfileDto),
  communityAdminProfileController.updateProfile.bind(
    communityAdminProfileController
  )
);
router.post(
  "/profile/upload-picture",
  authMiddleware,
  roleMiddleware(["communityAdmin"]),
  upload.single("profilePicture"),
  communityAdminProfileController.uploadProfilePicture.bind(
    communityAdminProfileController
  )
);
router.get(
  "/community-stats",
  authMiddleware,
  roleMiddleware(["communityAdmin"]),
  communityAdminProfileController.getCommunityStats.bind(
    communityAdminProfileController
  )
);

// Community management (existing routes)
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

// Feed management
router.get(
  "/feed",
  authMiddleware,
  roleMiddleware(["communityAdmin"]),
  validateQuery(GetCommunityFeedDto),
  communityAdminFeedController.getCommunityFeed.bind(
    communityAdminFeedController
  )
);
router.post(
  "/feed/posts/:postId/like",
  authMiddleware,
  roleMiddleware(["communityAdmin"]),
  communityAdminFeedController.togglePostLike.bind(communityAdminFeedController)
);
router.post(
  "/feed/posts/:postId/share",
  authMiddleware,
  roleMiddleware(["communityAdmin"]),
  communityAdminFeedController.sharePost.bind(communityAdminFeedController)
);
router.post(
  "/feed/posts/:postId/pin",
  authMiddleware,
  roleMiddleware(["communityAdmin"]),
  communityAdminFeedController.pinPost.bind(communityAdminFeedController)
);
router.delete(
  "/feed/posts/:postId",
  authMiddleware,
  roleMiddleware(["communityAdmin"]),
  communityAdminFeedController.deletePost.bind(communityAdminFeedController)
);
router.post(
  "/feed/comments",
  authMiddleware,
  roleMiddleware(["communityAdmin"]),
  validateBody(CreateCommentDto),
  communityAdminFeedController.createComment.bind(communityAdminFeedController)
);
router.get(
  "/engagement-stats",
  authMiddleware,
  roleMiddleware(["communityAdmin"]),
  communityAdminFeedController.getEngagementStats.bind(
    communityAdminFeedController
  )
);

// Members management
router.get(
  "/members",
  authMiddleware,
  roleMiddleware(["communityAdmin"]),
  validateQuery(GetCommunityMembersDto),
  communityAdminMembersController.getCommunityMembers.bind(
    communityAdminMembersController
  )
);
router.get(
  "/members/:memberId",
  authMiddleware,
  roleMiddleware(["communityAdmin"]),
  communityAdminMembersController.getMemberDetails.bind(
    communityAdminMembersController
  )
);
router.put(
  "/members/role",
  authMiddleware,
  roleMiddleware(["communityAdmin"]),
  validateBody(UpdateMemberRoleDto),
  communityAdminMembersController.updateMemberRole.bind(
    communityAdminMembersController
  )
);
router.post(
  "/members/ban",
  authMiddleware,
  roleMiddleware(["communityAdmin"]),
  validateBody(BanMemberDto),
  communityAdminMembersController.banMember.bind(
    communityAdminMembersController
  )
);
router.post(
  "/members/:memberId/unban",
  authMiddleware,
  roleMiddleware(["communityAdmin"]),
  communityAdminMembersController.unbanMember.bind(
    communityAdminMembersController
  )
);
router.delete(
  "/members/:memberId",
  authMiddleware,
  roleMiddleware(["communityAdmin"]),
  communityAdminMembersController.removeMember.bind(
    communityAdminMembersController
  )
);
router.get(
  "/members/:memberId/activity",
  authMiddleware,
  roleMiddleware(["communityAdmin"]),
  communityAdminMembersController.getMemberActivity.bind(
    communityAdminMembersController
  )
);
router.post(
  "/members/bulk-update",
  authMiddleware,
  roleMiddleware(["communityAdmin"]),
  communityAdminMembersController.bulkUpdateMembers.bind(
    communityAdminMembersController
  )
);

// Dashboard routes
router.get(
  "/dashboard",
  authMiddleware,
  roleMiddleware(["communityAdmin"]),
  communityAdminDashboardController.getDashboardData.bind(
    communityAdminDashboardController
  )
);

// Community Channel Management
router.post(
  "/community/channel/send",
  authMiddleware,
  roleMiddleware(["communityAdmin"]),
  communityAdminCommunityController.sendMessage.bind(
    communityAdminCommunityController
  )
);

router.get(
  "/community/channel/messages",
  authMiddleware,
  roleMiddleware(["communityAdmin"]),
  communityAdminCommunityController.getMessages.bind(
    communityAdminCommunityController
  )
);

router.put(
  "/community/channel/messages/:messageId",
  authMiddleware,
  roleMiddleware(["communityAdmin"]),
  communityAdminCommunityController.updateMessage.bind(
    communityAdminCommunityController
  )
);

router.delete(
  "/community/channel/messages/:messageId",
  authMiddleware,
  roleMiddleware(["communityAdmin"]),
  communityAdminCommunityController.deleteMessage.bind(
    communityAdminCommunityController
  )
);

router.post(
  "/community/channel/messages/:messageId/pin",
  authMiddleware,
  roleMiddleware(["communityAdmin"]),
  communityAdminCommunityController.pinMessage.bind(
    communityAdminCommunityController
  )
);

router.post(
  "/community/channel/messages/:messageId/unpin",
  authMiddleware,
  roleMiddleware(["communityAdmin"]),
  communityAdminCommunityController.unpinMessage.bind(
    communityAdminCommunityController
  )
);

router.get(
  "/community/channel/messages/:messageId/reactions",
  authMiddleware,
  roleMiddleware(["communityAdmin"]),
  communityAdminCommunityController.getMessageReactions.bind(
    communityAdminCommunityController
  )
);

router.post(
  "/community/channel/upload-media",
  authMiddleware,
  roleMiddleware(["communityAdmin"]),
  upload.array("media", 5),
  communityAdminCommunityController.uploadMedia.bind(
    communityAdminCommunityController
  )
);

// Community Group Chat Management (Admin can view and delete)
router.get(
  "/community/group-chat/messages",
  authMiddleware,
  roleMiddleware(["communityAdmin"]),
  communityAdminCommunityController.getGroupMessages.bind(
    communityAdminCommunityController
  )
);

router.delete(
  "/community/group-chat/messages/:messageId",
  authMiddleware,
  roleMiddleware(["communityAdmin"]),
  communityAdminCommunityController.deleteGroupMessage.bind(
    communityAdminCommunityController
  )
);

router.post(
  "/chaincast/create",
  authMiddleware,
  roleMiddleware(["communityAdmin"]),
  validateBody(CreateChainCastDto),
  communityAdminChainCastController.createChainCast.bind(
    communityAdminChainCastController
  )
);

router.get(
  "/chaincast",
  authMiddleware,
  roleMiddleware(["communityAdmin"]),
  validateQuery(GetChainCastsQueryDto),
  communityAdminChainCastController.getChainCasts.bind(
    communityAdminChainCastController
  )
);

router.get(
  "/chaincast/:chainCastId",
  authMiddleware,
  roleMiddleware(["communityAdmin"]),
  communityAdminChainCastController.getChainCast.bind(
    communityAdminChainCastController
  )
);

router.put(
  "/chaincast/:chainCastId",
  authMiddleware,
  roleMiddleware(["communityAdmin"]),
  validateBody(UpdateChainCastDto),
  communityAdminChainCastController.updateChainCast.bind(
    communityAdminChainCastController
  )
);

router.delete(
  "/chaincast/:chainCastId",
  authMiddleware,
  roleMiddleware(["communityAdmin"]),
  communityAdminChainCastController.deleteChainCast.bind(
    communityAdminChainCastController
  )
);

// ChainCast control routes
router.post(
  "/chaincast/:chainCastId/start",
  authMiddleware,
  roleMiddleware(["communityAdmin"]),
  communityAdminChainCastController.startChainCast.bind(
    communityAdminChainCastController
  )
);

router.post(
  "/chaincast/:chainCastId/end",
  authMiddleware,
  roleMiddleware(["communityAdmin"]),
  communityAdminChainCastController.endChainCast.bind(
    communityAdminChainCastController
  )
);

// Participant management routes
router.get(
  "/chaincast/:chainCastId/participants",
  authMiddleware,
  roleMiddleware(["communityAdmin"]),
  validateQuery(GetParticipantsQueryDto),
  communityAdminChainCastController.getParticipants.bind(
    communityAdminChainCastController
  )
);

router.delete(
  "/chaincast/:chainCastId/participants/:participantId",
  authMiddleware,
  roleMiddleware(["communityAdmin"]),
  communityAdminChainCastController.removeParticipant.bind(
    communityAdminChainCastController
  )
);

// Moderation routes
router.get(
  "/chaincast/:chainCastId/moderation-requests",
  authMiddleware,
  roleMiddleware(["communityAdmin"]),
  communityAdminChainCastController.getModerationRequests.bind(
    communityAdminChainCastController
  )
);

router.post(
  "/chaincast/moderation-requests/review",
  authMiddleware,
  roleMiddleware(["communityAdmin"]),
  validateBody(ReviewModerationRequestDto),
  communityAdminChainCastController.reviewModerationRequest.bind(
    communityAdminChainCastController
  )
);

// Analytics routes
router.get(
  "/chaincast/analytics",
  authMiddleware,
  roleMiddleware(["communityAdmin"]),
  communityAdminChainCastController.getAnalytics.bind(
    communityAdminChainCastController
  )
);

// Reactions routes
router.get(
  "/chaincast/:chainCastId/reactions",
  authMiddleware,
  roleMiddleware(["communityAdmin"]),
  validateQuery(GetReactionsQueryDto),
  communityAdminChainCastController.getReactions.bind(
    communityAdminChainCastController
  )
);

export default router;
