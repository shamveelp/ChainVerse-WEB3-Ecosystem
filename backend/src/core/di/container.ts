import { Container } from "inversify"
import { TYPES } from "../types/types"
import { OAuthClient } from "../../utils/oauthClient"

// Controllers
import type { IUserAuthController } from "../interfaces/controllers/user/IUserAuth.controllers"
import { UserAuthController } from "../../controllers/user/UserAuth.controller"
import type { IReferralController } from "../interfaces/controllers/user/IReferral.controller"
import { ReferralController } from "../../controllers/user/Referral.controller"
import type { IPointsController } from "../interfaces/controllers/user/IPoints.controller"
import { PointsController } from "../../controllers/user/Points.controller"
import { IUserProfileController } from "../interfaces/controllers/user/IUserProfile.controller"
import { UserProfileController } from "../../controllers/user/UserProfile.controller"
import { IUserMarketController } from "../interfaces/controllers/user/IUserMarket.controller"
import { UserMarketController } from "../../controllers/user/UserMarket.controller"

// Admin Controllers
import { IAdminAuthController } from "../interfaces/controllers/admin/IAuthAdmin.controllers"
import { AdminAuthController } from "../../controllers/admin/AdminAuth.controller"
import { IAdminUserController } from "../interfaces/controllers/admin/IAdminUser.controller"
import { AdminUserController } from "../../controllers/admin/AdminUser.controller"
import { IAdminCommunityController } from "../interfaces/controllers/admin/IAdminCommunity.controller"
import { AdminCommunityController } from "../../controllers/admin/AdminCommunity.controller"
import { IAdminDashboardController } from "../interfaces/controllers/admin/IAdminDashboard.controller"
import { AdminDashboardController } from "../../controllers/admin/AdminDashboard.controller"

import { IAdminCommunityManagementController } from "../interfaces/controllers/admin/IAdminCommunityManagement.controller";
import { AdminCommunityManagementController } from "../../controllers/admin/AdminCommunityManagement.controller";

// Community Admin Controllers
import { ICommunityAdminAuthController } from "../interfaces/controllers/communityAdmin/ICommunityAdminAuth.controller"
import { CommunityAdminAuthController } from "../../controllers/communityAdmin/CommunityAdminAuth.controller"
import { ICommunityAdminProfileController } from "../interfaces/controllers/communityAdmin/ICommunityAdminProfile.controller"
import { CommunityAdminProfileController } from "../../controllers/communityAdmin/CommunityAdminProfile.controller"
import { ICommunityAdminFeedController } from "../interfaces/controllers/communityAdmin/ICommunityAdminFeed.controller"
import { CommunityAdminFeedController } from "../../controllers/communityAdmin/CommunityAdminFeed.controller"
import { ICommunityAdminMembersController } from "../interfaces/controllers/communityAdmin/ICommunityAdminMembers.controller"
import { CommunityAdminMembersController } from "../../controllers/communityAdmin/CommunityAdminMembers.controller"

// Community Controllers
import { ICommunityUserProfileController } from "../interfaces/controllers/community/ICommunityUserProfile.controller"
import { CommunityUserProfileController } from "../../controllers/community/CommunityUserProfile.controller"
import { IFollowController } from "../interfaces/controllers/community/IFollow.controller"
import { FollowController } from "../../controllers/community/Follow.controller"
import { IUserMyCommunitiesController } from "../interfaces/controllers/community/IUserMyCommunities.controller"
import { UserMyCommunitiesController } from "../../controllers/community/UserMyCommunities.controller"

// Posts Controllers
import { IPostController } from "../interfaces/controllers/posts/IPost.controller"
import { PostController } from "../../controllers/posts/Post.controller"

// Chat Controllers
import { IChatController } from "../interfaces/controllers/chat/IChat.controller"
import { ChatController } from "../../controllers/chat/Chat.controller"

// Services
import type { IUserAuthService } from "../interfaces/services/user/IUserAuth.service"
import { UserAuthService } from "../../services/user/UserAuth.service"
import type { IReferralService } from "../interfaces/services/user/IReferral.service"
import { ReferralService } from "../../services/user/Referral.service"
import type { IPointsService } from "../interfaces/services/user/IPoints.service"
import { PointsService } from "../../services/user/Points.service"
import { IUserService } from "../interfaces/services/user/IUser.service"
import { UserService } from "../../services/user/User.service"
import { IUserMarketService } from "../interfaces/services/user/IUserMarket.service"
import { UserMarketService } from "../../services/user/UserMarket.service"

// Admin Services
import { IAdminAuthService } from "../interfaces/services/admin/IAdminAuth.service"
import { AdminAuthService } from "../../services/admin/AdminAuth.service"
import { IAdminUserService } from "../interfaces/services/admin/IAdminUser.service"
import { AdminUserService } from "../../services/admin/AdminUser.service"
import { IAdminCommunityService } from "../interfaces/services/admin/IAdminCommunity.service"
import { AdminCommunityService } from "../../services/admin/AdminCommunity.service"
import { IAdminDashboardService } from "../interfaces/services/admin/IAdminDashboard.service"
import { AdminDashboardService } from "../../services/admin/AdminDashboard.service"

// Community Admin Services
import { ICommunityAdminAuthService } from "../interfaces/services/communityAdmin/ICommunityAdminAuth.service"
import { CommunityAdminAuthService } from "../../services/communityAdmin/CommunityAdminAuth.service"
import { ICommunityAdminProfileService } from "../interfaces/services/communityAdmin/ICommunityAdminProfile.service"
import { CommunityAdminProfileService } from "../../services/communityAdmin/CommunityAdminProfile.service"
import { ICommunityAdminFeedService } from "../interfaces/services/communityAdmin/ICommnityAdminFeed.service"
import { CommunityAdminFeedService } from "../../services/communityAdmin/CommunityAdminFeed.service"
import { ICommunityAdminMembersService } from "../interfaces/services/communityAdmin/ICommunityAdminMembers.service"
import { CommunityAdminMembersService } from "../../services/communityAdmin/CommunityAdminMembers.service"

// Community Services
import { ICommunityUserService } from "../interfaces/services/community/ICommunityUser.service"
import { CommunityUserService } from "../../services/community/CommunityUser.service"
import { IFollowService } from "../interfaces/services/community/IFollow.service"
import { FollowService } from "../../services/community/Follow.service"
import { IUserMyCommunitiesService } from "../interfaces/services/community/IUserMyCommunities.service"
import { UserMyCommunitiesService } from "../../services/community/UserMyCommunities.service"

// Posts Services
import { IPostService } from "../interfaces/services/posts/IPost.service"
import { PostService } from "../../services/posts/Post.servcie"

// Chat Services
import { IChatService } from "../interfaces/services/chat/IChat.service"
import { ChatService } from "../../services/chat/Chat.service"

// Other Services
import { JwtService } from "../../utils/jwt"
import { IJwtService } from "../interfaces/services/IJwtService"
import type { IOTPService } from "../interfaces/services/IOTP.service"
import { OtpService } from "../../services/otp.service"
import type { IMailService } from "../interfaces/services/IMail.service"
import { MailService } from "../../services/mail.service"

// Repositories
import type { IUserRepository } from "../interfaces/repositories/IUser.repository"
import { UserRepository } from "../../repositories/User.repository"
import type { IReferralHistoryRepository } from "../interfaces/repositories/IReferralHistory.repository"
import { ReferralHistoryRepository } from "../../repositories/ReferralHistory.repository"
import type { IDailyCheckInRepository } from "../interfaces/repositories/IDailyCheckIn.repository"
import { DailyCheckInRepository } from "../../repositories/DailyCheckIn.repository"
import type { IPointsHistoryRepository } from "../interfaces/repositories/IPointsHistory.repository"
import { PointsHistoryRepository } from "../../repositories/PointsHistory.repository"
import type { IOtpRepository } from "../interfaces/repositories/IOTP.repository"
import { OtpRepository } from "../../repositories/OTP.repository"
import { IAdminRepository } from "../interfaces/repositories/IAdmin.repository"
import { AdminRepository } from "../../repositories/Admin.repository"
import { ICommunityAdminRepository } from "../interfaces/repositories/ICommunityAdminRepository"
import { CommunityAdminRepository } from "../../repositories/CommunityAdmin.repository"
import { ICommunityRequestRepository } from "../interfaces/repositories/ICommunityRequest.repository"
import { CommunityRequestRepository } from "../../repositories/CommunityRequest.repository"
import { ICommunityRepository } from "../interfaces/repositories/ICommunity.repository"
import { CommunityRepository } from "../../repositories/Community.repository"

// Posts Repository
import { IPostRepository } from "../interfaces/repositories/IPost.repository"
import { PostRepository } from "../../repositories/Post.repository"

// Chat Repository
import { IChatRepository } from "../interfaces/repositories/IChat.repository"
import { ChatRepository } from "../../repositories/Chat.repository"

import { IReferralHistoryService } from "../interfaces/services/IReferralHistory.service"
import { ReferralHistoryService } from "../../services/referralHistory.service"
import { IPointsHistoryService } from "../interfaces/services/IPointsHistory.service"
import { PointsHistoryService } from "../../services/pointsHistory.service"
import { IDailyCheckInService } from "../interfaces/services/user/IDailyCheckIn.service"
import { DailyCheckInService } from "../../services/user/DailyCheckInService"
import { IAdminDexController } from "../interfaces/controllers/admin/IAdminDexController"
import { AdminDexController } from "../../controllers/admin/AdminDex.controller"
import { IAdminMarketController } from "../interfaces/controllers/admin/IAdminMarketController"
import { AdminMarketController } from "../../controllers/admin/AdminMarket.controller"
import { IAdminWalletController } from "../interfaces/controllers/admin/IAdminWalletController"
import { AdminWalletController } from "../../controllers/admin/AdminWallet.controller"
import { DexController } from "../../controllers/dex/Dex.controller"
import { IDexController } from "../interfaces/controllers/dex/IDexController"
import { WalletController } from "../../controllers/dex/Wallet.controller"
import { IWalletController } from "../interfaces/controllers/dex/IWalletController"
import { DexService } from "../../services/dex/Dex.service"
import { IDexService } from "../interfaces/services/dex/IDex.service"
import { IWalletService } from "../interfaces/services/dex/IWallet.service"
import { WalletService } from "../../services/dex/Wallet.service"
import { IAdminDexService } from "../interfaces/services/admin/IAdminDex.service"
import { AdminDexService } from "../../services/admin/AdminDex.service"
import { IAdminMarketService } from "../interfaces/services/admin/IAdminMarket.service"
import { AdminMarketService } from "../../services/admin/AdminMarket.service"
import { IAdminWalletService } from "../interfaces/services/admin/IAdminWallet.service"
import { AdminWalletService } from "../../services/admin/AdminWallet.service"
import { IDexRepository } from "../interfaces/repositories/IDex.repository"
import { DexRepository } from "../../repositories/Dex.repository"
import { EtherscanService } from "../../utils/etherscan.service"
import { IPaymentRepository } from "../interfaces/repositories/IPayment.repository"
import { PaymentRepository } from "../../repositories/Payment.repository"
import { IUserDexService } from "../interfaces/services/user/IUserDex.service"
import { UserDexService } from "../../services/user/UserDex.service"
import { IUserDexController } from "../interfaces/controllers/user/IUserDex.controller"
import { UserDexController } from "../../controllers/user/UserDex.controller"
import { ICommunityAdminDashboardController } from "../interfaces/controllers/communityAdmin/ICommunityAdminDashboard.controller"
import { CommunityAdminDashboardController } from "../../controllers/communityAdmin/CommunityAdminDashbaord.controller"
import { ICommunityAdminDashboardService } from "../interfaces/services/communityAdmin/ICommunityAdminDashboard.service"
import { CommunityAdminDashboardService } from "../../services/communityAdmin/CommunityAdminDashbaord.service"
import { ICommunityController } from "../interfaces/controllers/community/ICommunity.controller"
import { CommunityController } from "../../controllers/community/Community.controller"
import { ICommunityService } from "../interfaces/services/community/ICommunity.service"
import { CommunityService } from "../../services/community/Community.service"
import { ICommunityAdminCommunityController } from "../interfaces/controllers/communityAdmin/ICommunityAdminCommunity.controller"
import { CommunityAdminCommunityController } from "../../controllers/communityAdmin/CommunityAdminCommunity.controller"
import { IUserCommunityChatController } from "../interfaces/controllers/community/IUserCommunityChat.controller"
import { UserCommunityChatController } from "../../controllers/community/UserCommunityChat.controller"
import { ICommunityAdminCommunityService } from "../interfaces/services/communityAdmin/ICommunityAdminCommunity.service"
import { UserCommunityChatService } from "../../services/community/UserCommunityChat.service"
import { CommunityAdminCommunityService } from "../../services/communityAdmin/CommunityAdminCommunity.service"
import { CommunityMessageRepository } from "../../repositories/community/CommunityMessage.repository"
import { IUserCommunityChatService } from "../interfaces/services/community/IUserCommunityChat.service"
import { ICommunityMessageRepository } from "../interfaces/repositories/community/ICommunityMessage.repository"
import { IChainCastRepository } from "../interfaces/repositories/chainCast/IChainCast.repository"
import { ChainCastRepository } from "../../repositories/chainCast/ChainCast.repository"
import { IChainCastService } from "../interfaces/services/chainCast/IChainCast.service"
import { ChainCastService } from "../../services/chainCast/ChainCast.service"
import { UserChainCastController } from "../../controllers/chainCast/UserChainCast.controller"
import { CommunityAdminChainCastController } from "../../controllers/chainCast/CommunityAdminChainCast.controller"
import { IUserChainCastController } from "../interfaces/controllers/chainCast/IUserChainCast.controller"
import { ICommunityAdminChainCastController } from "../interfaces/controllers/chainCast/ICommunityAdminChainCast.controller"
import { ICommunitySubscriptionRepository } from "../interfaces/repositories/communityAdmin/ICommunityAdminSubscription.repository"
import { CommunitySubscriptionRepository } from "../../repositories/communityAdmin/CommunityAdminSubscription.repository"
import { ICommunityAdminSubscriptionService } from "../interfaces/services/communityAdmin/ICommunityAdminSubscription.service"
import { CommunityAdminSubscriptionService } from "../../services/communityAdmin/CommunityAdminSubscription.service"
import { ICommunityAdminSubscriptionController } from "../interfaces/controllers/communityAdmin/ICommunityAdminSubscription.controller"
import { CommunityAdminSubscriptionController } from "../../controllers/communityAdmin/CommunityAdminSubscription.controller"
import { ICommunityAdminPostRepository } from "../interfaces/repositories/communityAdmin/ICommunityAdminPost.repository"
import { CommunityAdminPostRepository } from "../../repositories/communityAdmin/CommunityAdminPost.repository"
import { ICommunityAdminPostService } from "../interfaces/services/communityAdmin/ICommunityAdminPost.service"
import { CommunityAdminPostController } from "../../controllers/communityAdmin/CommunityAdminPost.controller"
import { ICommunityAdminPostController } from "../interfaces/controllers/communityAdmin/ICommunityAdminPost.controller"
import { CommunityAdminPostService } from "../../services/communityAdmin/CommunityAdminPost.service"

import { IAdminCommunityPostRepository } from "../interfaces/repositories/admin/IAdminCommunityPost.repository";
import { AdminCommunityPostRepository } from "../../repositories/admin/AdminCommunityPost.repository";
import { IAdminCommunityPostService } from "../interfaces/services/admin/IAdminCommunityPost.service";
import { AdminCommunityPostService } from "../../services/admin/AdminCommunityPost.service";
import { IAdminCommunityPostController } from "../interfaces/controllers/admin/IAdminCommunityPost.controller";
import { AdminCommunityPostController } from "../../controllers/admin/AdminCommunityPost.controller";

import { IAdminCommunityManagementService } from "../interfaces/services/admin/IAdminCommunityManagement.service";
import { AdminCommunityManagementService } from "../../services/admin/AdminCommunityManagement.service";
import { IAdminCommunityManagementRepository } from "../interfaces/repositories/admin/IAdminCommunityManagement.repository";
import { AdminCommunityManagementRepository } from "../../repositories/admin/AdminCommunityManagement.repository";

import { IPointsConversionRepository } from "../interfaces/repositories/points/IPointsConversion.repository"
import { IConversionRateRepository } from "../interfaces/repositories/points/IConversionRate.repository"
import { PointsConversionRepository } from "../../repositories/points/PointsConversion.repository"
import { ConversionRateRepository } from "../../repositories/points/ConversionRate.repository"
import { IPointsConversionService } from "../interfaces/services/points/IPointsConversion.service"
import { IAdminPointsConversionService } from "../interfaces/services/points/IAdminPointsConversion.service"
import { PointsConversionService } from "../../services/points/PointsConversionService"
import { AdminPointsConversionService } from "../../services/points/AdminPointsConversionService"
import { IPointsConversionController } from "../interfaces/controllers/points/IPointsConversionController"
import { IAdminPointsConversionController } from "../interfaces/controllers/points/IAdminPointsConversionController"
import { PointsConversionController } from "../../controllers/points/PointsConversion.controller"
import { AdminPointsConversionController } from "../../controllers/points/AdminPointsConversion.controller"
import { ICommunityAdminQuestRepository } from "../interfaces/repositories/quest/ICommunityAdminQuest.repository"
import { CommunityAdminQuestRepository } from "../../repositories/quest/CommunityAdminQuest.repository"
import { ICommunityAdminQuestService } from "../interfaces/services/quest/ICommunityAdminQuest.service"
import { CommunityAdminQuestService } from "../../services/quest/CommunityAdminQuest.service"
import { ICommunityAdminQuestController } from "../interfaces/controllers/quest/ICommunityAdminQuest.controller"
import { CommunityAdminQuestController } from "../../controllers/quest/CommunityAdminQuest.controller"
import { IUserQuestController } from "../interfaces/controllers/quest/IUserQuest.controller"
import { UserQuestController } from "../../controllers/quest/UserQuest.controller"
import { UserQuestRepository } from "../../repositories/quest/UserQuest.repository"
import { UserQuestService } from "../../services/quest/UserQuest.service"
import { IUserQuestService } from "../interfaces/services/quest/IUserQuest.service"
import { IUserQuestRepository } from "../interfaces/repositories/quest/IUserQuest.repository"
import { DexSwapController } from "../../controllers/dex/DexSwap.controller"
import { DexSwapService } from "../../services/dex/DexSwap.service"
import { DexSwapRepository } from "../../repositories/dex/DexSwap.repository"
import { IDexSwapRepository } from "../interfaces/repositories/dex/IDexSwap.repository"
import { IDexSwapService } from "../interfaces/services/dex/IDexSwap.service"
import { IDexSwapController } from "../interfaces/controllers/dex/IDexSwap.controller"
import { IAITradingController } from "../interfaces/controllers/aiChat/IAITrading.controller"
import { AITradingController } from "../../controllers/aiChat/AiTrading.controller"
import { IAITradingService } from "../interfaces/services/aiChat/IAITrading.service"
import { AITradingService } from "../../services/aiChat/AiTrading.service"
import { IAIChatHistoryRepository } from "../interfaces/repositories/aiChat/IAIChatHistory.repository"
import { AIChatHistoryRepository } from "../../repositories/aiChat/AiChatHistory.repository"

// Notification
import { INotificationRepository } from "../interfaces/repositories/notification/INotification.repository";
import { NotificationRepository } from "../../repositories/notification/Notification.repository";
import { INotificationService } from "../interfaces/services/notification/INotification.service";
import { NotificationService } from "../../services/notification/Notification.service";
import { INotificationController } from "../interfaces/controllers/notification/INotification.controller";
import { NotificationController } from "../../controllers/notification/Notification.controller";

// Create Container
const container = new Container()

// Bind Controllers
container.bind<IUserAuthController>(TYPES.IUserAuthController).to(UserAuthController)
container.bind<IUserProfileController>(TYPES.IUserProfileController).to(UserProfileController)
container.bind<IUserMarketController>(TYPES.IUserMarketController).to(UserMarketController)
container.bind<IReferralController>(TYPES.IReferralController).to(ReferralController)
container.bind<IPointsController>(TYPES.IPointsController).to(PointsController)

// Bind Admin Controllers
container.bind<IAdminCommunityManagementController>(TYPES.IAdminCommunityManagementController).to(AdminCommunityManagementController);
container.bind<IAdminAuthController>(TYPES.IAdminAuthController).to(AdminAuthController)
container.bind<IAdminUserController>(TYPES.IAdminUserController).to(AdminUserController)
container.bind<IAdminCommunityController>(TYPES.IAdminCommunityController).to(AdminCommunityController)
container.bind<IAdminDashboardController>(TYPES.IAdminDashboardController).to(AdminDashboardController)

// Bind Community Admin Controllers
container.bind<ICommunityAdminAuthController>(TYPES.ICommunityAdminAuthController).to(CommunityAdminAuthController)
container.bind<ICommunityAdminProfileController>(TYPES.ICommunityAdminProfileController).to(CommunityAdminProfileController)
container.bind<ICommunityAdminFeedController>(TYPES.ICommunityAdminFeedController).to(CommunityAdminFeedController)
container.bind<ICommunityAdminMembersController>(TYPES.ICommunityAdminMembersController).to(CommunityAdminMembersController)

// Bind Community Controllers
container.bind<ICommunityUserProfileController>(TYPES.ICommunityUserProfileController).to(CommunityUserProfileController)
container.bind<IFollowController>(TYPES.IFollowController).to(FollowController)
container.bind<IUserMyCommunitiesController>(TYPES.IUserMyCommunitiesController).to(UserMyCommunitiesController)

// Bind Posts Controllers
container.bind<IPostController>(TYPES.IPostController).to(PostController)

// Bind Chat Controllers
container.bind<IChatController>(TYPES.IChatController).to(ChatController)

// Bind Services
container.bind<IUserAuthService>(TYPES.IUserAuthService).to(UserAuthService)
container.bind<IUserService>(TYPES.IUserService).to(UserService)
container.bind<IUserMarketService>(TYPES.IUserMarketService).to(UserMarketService)
container.bind<IReferralService>(TYPES.IReferralService).to(ReferralService)
container.bind<IPointsService>(TYPES.IPointsService).to(PointsService)

// Bind Admin Services
container.bind<IAdminAuthService>(TYPES.IAdminAuthService).to(AdminAuthService)
container.bind<IAdminUserService>(TYPES.IAdminUserService).to(AdminUserService)
container.bind<IAdminCommunityService>(TYPES.IAdminCommunityService).to(AdminCommunityService)
container.bind<IAdminDashboardService>(TYPES.IAdminDashboardService).to(AdminDashboardService)

// Bind Community Admin Services
container.bind<ICommunityAdminAuthService>(TYPES.ICommunityAdminAuthService).to(CommunityAdminAuthService)
container.bind<ICommunityAdminProfileService>(TYPES.ICommunityAdminProfileService).to(CommunityAdminProfileService)
container.bind<ICommunityAdminFeedService>(TYPES.ICommunityAdminFeedService).to(CommunityAdminFeedService)
container.bind<ICommunityAdminMembersService>(TYPES.ICommunityAdminMembersService).to(CommunityAdminMembersService)

// Bind Community Services
container.bind<ICommunityUserService>(TYPES.ICommunityUserService).to(CommunityUserService)
container.bind<IFollowService>(TYPES.IFollowService).to(FollowService)
container.bind<IUserMyCommunitiesService>(TYPES.IUserMyCommunitiesService).to(UserMyCommunitiesService)

// Bind Posts Services
container.bind<IPostService>(TYPES.IPostService).to(PostService)

// Bind Chat Services
container.bind<IChatService>(TYPES.IChatService).to(ChatService)

// Bind Other Services
container.bind<IJwtService>(TYPES.IJwtService).to(JwtService)
container.bind<IOTPService>(TYPES.IOtpService).to(OtpService)
container.bind<IMailService>(TYPES.IMailService).to(MailService)

// Bind Repositories
container.bind<IUserRepository>(TYPES.IUserRepository).to(UserRepository)
container.bind<IReferralHistoryRepository>(TYPES.IReferralHistoryRepository).to(ReferralHistoryRepository)
container.bind<IDailyCheckInRepository>(TYPES.IDailyCheckInRepository).to(DailyCheckInRepository)
container.bind<IPointsHistoryRepository>(TYPES.IPointsHistoryRepository).to(PointsHistoryRepository)
container.bind<IOtpRepository>(TYPES.IOtpRepository).to(OtpRepository)
container.bind<IAdminRepository>(TYPES.IAdminRepository).to(AdminRepository)
container.bind<ICommunityAdminRepository>(TYPES.ICommunityAdminRepository).to(CommunityAdminRepository)
container.bind<ICommunityRequestRepository>(TYPES.ICommunityRequestRepository).to(CommunityRequestRepository)
container.bind<ICommunityRepository>(TYPES.ICommunityRepository).to(CommunityRepository)

// Bind Posts Repository
container.bind<IPostRepository>(TYPES.IPostRepository).to(PostRepository)

// Bind Chat Repository
container.bind<IChatRepository>(TYPES.IChatRepository).to(ChatRepository)

container.bind<IReferralHistoryService>(TYPES.IReferralHistoryService).to(ReferralHistoryService);
container.bind<IPointsHistoryService>(TYPES.IPointsHistoryService).to(PointsHistoryService);
container.bind<IDailyCheckInService>(TYPES.IDailyCheckInService).to(DailyCheckInService);

// dex
container.bind<IAdminWalletController>(TYPES.IAdminWalletController).to(AdminWalletController)
container.bind<IDexController>(TYPES.IDexController).to(DexController)

// dex - service
container.bind<IDexService>(TYPES.IDexService).to(DexService)
container.bind<IWalletService>(TYPES.IWalletService).to(WalletService)
container.bind<IAdminWalletService>(TYPES.IAdminWalletService).to(AdminWalletService)

// dex repo
container.bind<IDexRepository>(TYPES.IDexRepository).to(DexRepository)

// Etherscan Service
container.bind<EtherscanService>(TYPES.EtherscanService).to(EtherscanService)

// Bind OAuth Client
container.bind<OAuthClient>(TYPES.OAuthClient).to(OAuthClient)

// admin dex + market
container.bind<IAdminDexController>(TYPES.IAdminDexController).to(AdminDexController)
container.bind<IAdminDexService>(TYPES.IAdminDexService).to(AdminDexService)
container.bind<IAdminMarketController>(TYPES.IAdminMarketController).to(AdminMarketController)
container.bind<IAdminMarketService>(TYPES.IAdminMarketService).to(AdminMarketService)

container.bind<IPaymentRepository>(TYPES.IPaymentRepository).to(PaymentRepository)

container.bind<IUserDexService>(TYPES.IUserDexService).to(UserDexService)
container.bind<IUserDexController>(TYPES.IUserDexController).to(UserDexController)

container.bind<ICommunityAdminDashboardController>(TYPES.ICommunityAdminDashboardController).to(CommunityAdminDashboardController)
container.bind<ICommunityAdminDashboardService>(TYPES.ICommunityAdminDashboardService).to(CommunityAdminDashboardService)

container.bind<ICommunityController>(TYPES.ICommunityController).to(CommunityController)
container.bind<ICommunityService>(TYPES.ICommunityService).to(CommunityService)


container.bind<ICommunityAdminCommunityController>(TYPES.ICommunityAdminCommunityController).to(CommunityAdminCommunityController);
container.bind<IUserCommunityChatController>(TYPES.IUserCommunityChatController).to(UserCommunityChatController);
container.bind<ICommunityAdminCommunityService>(TYPES.ICommunityAdminCommunityService).to(CommunityAdminCommunityService);
container.bind<IUserCommunityChatService>(TYPES.IUserCommunityChatService).to(UserCommunityChatService);
container.bind<ICommunityMessageRepository>(TYPES.ICommunityMessageRepository).to(CommunityMessageRepository);



// Bind ChainCast Services
container.bind<IChainCastService>(TYPES.IChainCastService).to(ChainCastService);

// Bind ChainCast Repositories
container.bind<IChainCastRepository>(TYPES.IChainCastRepository).to(ChainCastRepository);

container.bind<IUserChainCastController>(TYPES.IUserChainCastController).to(UserChainCastController);
container.bind<ICommunityAdminChainCastController>(TYPES.ICommunityAdminChainCastController).to(CommunityAdminChainCastController);


container.bind<ICommunitySubscriptionRepository>(TYPES.ICommunitySubscriptionRepository).to(CommunitySubscriptionRepository);

// Bind Subscription Service
container.bind<ICommunityAdminSubscriptionService>(TYPES.ICommunityAdminSubscriptionService).to(CommunityAdminSubscriptionService);

// Bind Subscription Controller
container.bind<ICommunityAdminSubscriptionController>(TYPES.ICommunityAdminSubscriptionController).to(CommunityAdminSubscriptionController);


// comms admin post repo and service and controller
container.bind<ICommunityAdminPostRepository>(TYPES.ICommunityAdminPostRepository).to(CommunityAdminPostRepository);
container.bind<ICommunityAdminPostService>(TYPES.ICommunityAdminPostService).to(CommunityAdminPostService);
container.bind<ICommunityAdminPostController>(TYPES.ICommunityAdminPostController).to(CommunityAdminPostController);

// Admin Comms Post
container.bind<IAdminCommunityPostRepository>(TYPES.IAdminCommunityPostRepository).to(AdminCommunityPostRepository);
container.bind<IAdminCommunityPostService>(TYPES.IAdminCommunityPostService).to(AdminCommunityPostService);
container.bind<IAdminCommunityPostController>(TYPES.IAdminCommunityPostController).to(AdminCommunityPostController);

// Repositories
container.bind<IPointsConversionRepository>(TYPES.IPointsConversionRepository).to(PointsConversionRepository);
container.bind<IConversionRateRepository>(TYPES.IConversionRateRepository).to(ConversionRateRepository);

// Services
container.bind<IPointsConversionService>(TYPES.IPointsConversionService).to(PointsConversionService);
container.bind<IAdminPointsConversionService>(TYPES.IAdminPointsConversionService).to(AdminPointsConversionService);

// Controllers
container.bind<IPointsConversionController>(TYPES.IPointsConversionController).to(PointsConversionController);
container.bind<IAdminPointsConversionController>(TYPES.IAdminPointsConversionController).to(AdminPointsConversionController);


container.bind<ICommunityAdminQuestRepository>(TYPES.ICommunityAdminQuestRepository).to(CommunityAdminQuestRepository);
container.bind<ICommunityAdminQuestService>(TYPES.ICommunityAdminQuestService).to(CommunityAdminQuestService);
container.bind<ICommunityAdminQuestController>(TYPES.ICommunityAdminQuestController).to(CommunityAdminQuestController);

container.bind<IUserQuestController>(TYPES.IUserQuestController).to(UserQuestController)
container.bind<IUserQuestService>(TYPES.IUserQuestService).to(UserQuestService)
container.bind<IUserQuestRepository>(TYPES.IUserQuestRepository).to(UserQuestRepository)

container.bind<IDexSwapController>(TYPES.IDexSwapController).to(DexSwapController);
container.bind<IDexSwapService>(TYPES.IDexSwapService).to(DexSwapService);
container.bind<IDexSwapRepository>(TYPES.IDexSwapRepository).to(DexSwapRepository);

container.bind<IAITradingController>(TYPES.IAITradingController).to(AITradingController);
container.bind<IAITradingService>(TYPES.IAITradingService).to(AITradingService);
container.bind<IAIChatHistoryRepository>(TYPES.IAIChatHistoryRepository).to(AIChatHistoryRepository);

container.bind<IAdminCommunityManagementRepository>(TYPES.IAdminCommunityManagementRepository).to(AdminCommunityManagementRepository);
container.bind<IAdminCommunityManagementService>(TYPES.IAdminCommunityManagementService).to(AdminCommunityManagementService);

// Notification Bindings
container.bind<INotificationRepository>(TYPES.INotificationRepository).to(NotificationRepository);
container.bind<INotificationService>(TYPES.INotificationService).to(NotificationService);
container.bind<INotificationController>(TYPES.INotificationController).to(NotificationController);

export default container