import { Router } from 'express';
import container from '../core/di/container';
import { UserAuthController } from '../controllers/user/UserAuth.controller';
import { TYPES } from '../core/types/types';
import { authMiddleware, roleMiddleware } from '../middlewares/auth.middleware';
import { UserProfileController } from '../controllers/user/UserProfile.controller';
import { CommunityUserProfileController } from '../controllers/community/CommunityUserProfile.controller';
import { FollowController } from '../controllers/community/Follow.controller';
import { PostController } from '../controllers/posts/Post.controller';
import { ChatController } from '../controllers/chat/Chat.controller';
import { UserMyCommunitiesController } from '../controllers/community/UserMyCommunities.controller';
import multer from 'multer';
import { ReferralController } from '../controllers/user/Referral.controller';
import { PointsController } from '../controllers/user/Points.controller';
import { validateBody, validateQuery, validateParams } from '../middlewares/validation.middleware';
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
import {
  FollowUserDto,
  UnfollowUserDto,
  GetFollowersDto,
  GetFollowingDto,
  FollowStatusDto
} from '../dtos/community/Follow.dto';
import {
  CreatePostDto,
  UpdatePostDto,
  CreateCommentDto,
  UpdateCommentDto,
  GetPostsQueryDto,
  GetCommentsQueryDto,
  SharePostDto
} from '../dtos/posts/Post.dto';
import {
  SendMessageDto,
  EditMessageDto,
  GetMessagesDto,
  GetConversationsDto,
  MarkMessagesReadDto
} from '../dtos/chat/Chat.dto';
import { UserDexController } from '../controllers/user/UserDex.controller';
import { CommunityController } from '../controllers/community/Community.controller';
import { JoinCommunityDto, LeaveCommunityDto, SearchCommunitiesDto } from '../dtos/community/Community.dto';
import { GetCommunityMembersDto } from '../dtos/communityAdmin/CommunityAdminMembers.dto';
import { GetMyCommunitiesDto } from '../dtos/community/MyCommunities.dto';
import { UserCommunityChatController } from '../controllers/community/UserCommunityChat.controller';
import { UserChainCastController } from "../controllers/chainCast/UserChainCast.controller";
import { AddReactionDto, GetChainCastsQueryDto, GetReactionsQueryDto, JoinChainCastDto, RequestModerationDto, UpdateParticipantDto } from '../dtos/chainCast/ChainCast.dto';

// Get controller instance


// Configure Multer for file uploads
const storage = multer.memoryStorage();
const upload = multer({
  storage,
  limits: { fileSize: 10 * 1024 * 1024 }, // 10MB limit
  fileFilter: (req, file, cb) => {
    const allowedTypes = /jpeg|jpg|png|gif|mp4|mpeg|mov/;
    const mimetype = allowedTypes.test(file.mimetype);
    if (mimetype) {
      return cb(null, true);
    }
    cb(new Error("File type not supported. Only images (JPEG, PNG, GIF) and videos (MP4, MPEG, MOV) are allowed."));
  },
});

const router = Router();

const userAuthController = container.get<UserAuthController>(TYPES.IUserAuthController);
const userProfileController = container.get<UserProfileController>(TYPES.IUserProfileController);
const communityUserProfileController = container.get<CommunityUserProfileController>(TYPES.ICommunityUserProfileController);
const followController = container.get<FollowController>(TYPES.IFollowController);
const postController = container.get<PostController>(TYPES.IPostController);
const chatController = container.get<ChatController>(TYPES.IChatController);
const referralController = container.get<ReferralController>(TYPES.IReferralController);
const pointsController = container.get<PointsController>(TYPES.IPointsController);
const userDexController = container.get<UserDexController>(TYPES.IUserDexController);
const communityController = container.get<CommunityController>(TYPES.ICommunityController);
const userMyCommunitiesController = container.get<UserMyCommunitiesController>(TYPES.IUserMyCommunitiesController);
const userCommunityChatController = container.get<UserCommunityChatController>(TYPES.IUserCommunityChatController);
const userChainCastController = container.get<UserChainCastController>(TYPES.IUserChainCastController);



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

// Community Profile Routes
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

// Follow Routes (protected)
router.post('/community/follow',
  authMiddleware,
  roleMiddleware(['user']),
  validateBody(FollowUserDto),
  followController.followUser.bind(followController)
);

router.post('/community/unfollow',
  authMiddleware,
  roleMiddleware(['user']),
  validateBody(UnfollowUserDto),
  followController.unfollowUser.bind(followController)
);

router.get('/community/followers',
  authMiddleware,
  roleMiddleware(['user']),
  validateQuery(GetFollowersDto),
  followController.getFollowers.bind(followController)
);

router.get('/community/following',
  authMiddleware,
  roleMiddleware(['user']),
  validateQuery(GetFollowingDto),
  followController.getFollowing.bind(followController)
);

router.get('/community/follow-status/:username',
  authMiddleware,
  roleMiddleware(['user']),
  followController.getFollowStatus.bind(followController)
);

router.get('/community/follow-stats',
  authMiddleware,
  roleMiddleware(['user']),
  followController.getFollowStats.bind(followController)
);

router.get('/community/user/:username/followers',
  validateQuery(GetFollowersDto),
  followController.getUserFollowers.bind(followController)
);

router.get('/community/user/:username/following',
  validateQuery(GetFollowingDto),
  followController.getUserFollowing.bind(followController)
);

// Posts Routes (protected)
router.post('/posts/create',
  authMiddleware,
  roleMiddleware(['user']),
  validateBody(CreatePostDto),
  postController.createPost.bind(postController)
);

router.get('/posts/:postId',
  postController.getPostById.bind(postController)
);

router.put('/posts/:postId',
  authMiddleware,
  roleMiddleware(['user']),
  validateBody(UpdatePostDto),
  postController.updatePost.bind(postController)
);

router.delete('/posts/:postId',
  authMiddleware,
  roleMiddleware(['user']),
  postController.deletePost.bind(postController)
);

router.get('/posts/feed/all',
  authMiddleware,
  roleMiddleware(['user']),
  validateQuery(GetPostsQueryDto),
  postController.getFeedPosts.bind(postController)
);

router.get('/posts/user/:userId/all',
  validateQuery(GetPostsQueryDto),
  postController.getUserPosts.bind(postController)
);

router.get('/posts/user/:userId/liked',
  validateQuery(GetPostsQueryDto),
  postController.getLikedPosts.bind(postController)
);

router.get('/posts/trending/all',
  validateQuery(GetPostsQueryDto),
  postController.getTrendingPosts.bind(postController)
);

router.get('/posts/hashtag/:hashtag',
  validateQuery(GetPostsQueryDto),
  postController.getPostsByHashtag.bind(postController)
);

router.get('/posts/search/all',
  validateQuery(GetPostsQueryDto),
  postController.searchPosts.bind(postController)
);

router.post('/posts/:postId/like',
  authMiddleware,
  roleMiddleware(['user']),
  postController.togglePostLike.bind(postController)
);

router.get('/posts/:postId/likers',
  validateQuery(GetPostsQueryDto),
  postController.getPostLikers.bind(postController)
);

// Comment Routes (protected)
router.post('/posts/comments/create',
  authMiddleware,
  roleMiddleware(['user']),
  validateBody(CreateCommentDto),
  postController.createComment.bind(postController)
);

router.put('/posts/comments/:commentId',
  authMiddleware,
  roleMiddleware(['user']),
  validateBody(UpdateCommentDto),
  postController.updateComment.bind(postController)
);

router.delete('/posts/comments/:commentId',
  authMiddleware,
  roleMiddleware(['user']),
  postController.deleteComment.bind(postController)
);

router.get('/posts/:postId/comments',
  validateQuery(GetCommentsQueryDto),
  postController.getPostComments.bind(postController)
);

router.get('/posts/comments/:commentId/replies',
  validateQuery(GetCommentsQueryDto),
  postController.getCommentReplies.bind(postController)
);

router.post('/posts/comments/:commentId/like',
  authMiddleware,
  roleMiddleware(['user']),
  postController.toggleCommentLike.bind(postController)
);

// Media Upload Routes
router.post('/posts/upload-media',
  authMiddleware,
  roleMiddleware(['user']),
  upload.single('media'),
  postController.uploadPostMedia.bind(postController)
);

// Share Routes
router.post('/posts/share',
  authMiddleware,
  roleMiddleware(['user']),
  validateBody(SharePostDto),
  postController.sharePost.bind(postController)
);

// Analytics Routes
router.get('/posts/stats/analytics',
  authMiddleware,
  roleMiddleware(['user']),
  postController.getPostStats.bind(postController)
);

router.get('/posts/hashtags/popular',
  postController.getPopularHashtags.bind(postController)
);

// Chat Routes (protected)
router.post('/chat/send',
  authMiddleware,
  roleMiddleware(['user']),
  validateBody(SendMessageDto),
  chatController.sendMessage.bind(chatController)
);

router.get('/chat/conversations',
  authMiddleware,
  roleMiddleware(['user']),
  validateQuery(GetConversationsDto),
  chatController.getUserConversations.bind(chatController)
);

router.get('/chat/conversations/:conversationId/messages',
  authMiddleware,
  roleMiddleware(['user']),
  validateQuery(GetMessagesDto),
  chatController.getConversationMessages.bind(chatController)
);

router.get('/chat/conversation/:username',
  authMiddleware,
  roleMiddleware(['user']),
  chatController.getOrCreateConversation.bind(chatController)
);

router.put('/chat/messages/:messageId',
  authMiddleware,
  roleMiddleware(['user']),
  validateBody(EditMessageDto),
  chatController.editMessage.bind(chatController)
);

router.delete('/chat/messages/:messageId',
  authMiddleware,
  roleMiddleware(['user']),
  chatController.deleteMessage.bind(chatController)
);

router.post('/chat/messages/read',
  authMiddleware,
  roleMiddleware(['user']),
  validateBody(MarkMessagesReadDto),
  chatController.markMessagesAsRead.bind(chatController)
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

// Community Explore Routes
router.get('/communities/search',
  validateQuery(SearchCommunitiesDto),
  communityController.searchCommunities.bind(communityController)
);

router.get('/communities/popular',
  communityController.getPopularCommunities.bind(communityController)
);

router.get('/communities/:communityId',
  communityController.getCommunityById.bind(communityController)
);

router.get('/communities/username/:username',
  communityController.getCommunityByUsername.bind(communityController)
);

router.post('/communities/join',
  authMiddleware,
  roleMiddleware(['user']),
  validateBody(JoinCommunityDto),
  communityController.joinCommunity.bind(communityController)
);

router.post('/communities/leave',
  authMiddleware,
  roleMiddleware(['user']),
  validateBody(LeaveCommunityDto),
  communityController.leaveCommunity.bind(communityController)
);

router.get('/communities/:username/members',
  validateQuery(GetCommunityMembersDto),
  communityController.getCommunityMembers.bind(communityController)
);

router.get('/communities/:username/member-status',
  authMiddleware,
  roleMiddleware(['user']),
  communityController.getCommunityMemberStatus.bind(communityController)
);

// My Communities Routes (protected)
router.get('/my-communities',
  authMiddleware,
  roleMiddleware(['user']),
  validateQuery(GetMyCommunitiesDto),
  userMyCommunitiesController.getMyCommunities.bind(userMyCommunitiesController)
);

router.get('/my-communities/stats',
  authMiddleware,
  roleMiddleware(['user']),
  userMyCommunitiesController.getMyCommunitiesStats.bind(userMyCommunitiesController)
);

router.get('/my-communities/activity',
  authMiddleware,
  roleMiddleware(['user']),
  userMyCommunitiesController.getMyCommunitiesActivity.bind(userMyCommunitiesController)
);

router.put('/my-communities/:communityId/notifications',
  authMiddleware,
  roleMiddleware(['user']),
  userMyCommunitiesController.updateCommunityNotifications.bind(userMyCommunitiesController)
);

router.delete('/my-communities/:communityId/leave',
  authMiddleware,
  roleMiddleware(['user']),
  userMyCommunitiesController.leaveCommunityFromMy.bind(userMyCommunitiesController)
);



// Community Channel Routes
router.get('/community/:username/channel/messages',
  authMiddleware,
  roleMiddleware(['user']),
  userCommunityChatController.getChannelMessages.bind(userCommunityChatController)
);

router.post('/community/channel/messages/:messageId/react',
  authMiddleware,
  roleMiddleware(['user']),
  userCommunityChatController.reactToMessage.bind(userCommunityChatController)
);

router.delete('/community/channel/messages/:messageId/react',
  authMiddleware,
  roleMiddleware(['user']),
  userCommunityChatController.removeReaction.bind(userCommunityChatController)
);

// Community Group Chat Routes
router.post('/community/group-chat/send',
  authMiddleware,
  roleMiddleware(['user']),
  userCommunityChatController.sendGroupMessage.bind(userCommunityChatController)
);

router.get('/community/:username/group-chat/messages',
  authMiddleware,
  roleMiddleware(['user']),
  userCommunityChatController.getGroupMessages.bind(userCommunityChatController)
);

router.put('/community/group-chat/messages/:messageId',
  authMiddleware,
  roleMiddleware(['user']),
  userCommunityChatController.editGroupMessage.bind(userCommunityChatController)
);

router.delete('/community/group-chat/messages/:messageId',
  authMiddleware,
  roleMiddleware(['user']),
  userCommunityChatController.deleteGroupMessage.bind(userCommunityChatController)
);

router.post('/community/:username/group-chat/read',
  authMiddleware,
  roleMiddleware(['user']),
  userCommunityChatController.markGroupMessagesAsRead.bind(userCommunityChatController)
);




router.get(
  "/community/:communityId/chaincasts",
  authMiddleware,
  roleMiddleware(["user"]),
  validateQuery(GetChainCastsQueryDto),
  userChainCastController.getCommunityChainCasts.bind(userChainCastController)
);

router.get(
  "/chaincast/:chainCastId",
  authMiddleware,
  roleMiddleware(["user"]),
  userChainCastController.getChainCast.bind(userChainCastController)
);

router.get(
  "/chaincast/:chainCastId/can-join",
  authMiddleware,
  roleMiddleware(["user"]),
  userChainCastController.canJoinChainCast.bind(userChainCastController)
);

// Participation routes
router.post(
  "/chaincast/join",
  authMiddleware,
  roleMiddleware(["user"]),
  validateBody(JoinChainCastDto),
  userChainCastController.joinChainCast.bind(userChainCastController)
);

router.post(
  "/chaincast/:chainCastId/leave",
  authMiddleware,
  roleMiddleware(["user"]),
  userChainCastController.leaveChainCast.bind(userChainCastController)
);

router.put(
  "/chaincast/:chainCastId/participant",
  authMiddleware,
  roleMiddleware(["user"]),
  validateBody(UpdateParticipantDto),
  userChainCastController.updateParticipant.bind(userChainCastController)
);

// Moderation routes
router.post(
  "/chaincast/request-moderation",
  authMiddleware,
  roleMiddleware(["user"]),
  validateBody(RequestModerationDto),
  userChainCastController.requestModeration.bind(userChainCastController)
);

// Reaction routes
router.post(
  "/chaincast/reaction",
  authMiddleware,
  roleMiddleware(["user"]),
  validateBody(AddReactionDto),
  userChainCastController.addReaction.bind(userChainCastController)
);

router.get(
  "/chaincast/:chainCastId/reactions",
  authMiddleware,
  roleMiddleware(["user"]),
  validateQuery(GetReactionsQueryDto),
  userChainCastController.getReactions.bind(userChainCastController)
);


export default router;