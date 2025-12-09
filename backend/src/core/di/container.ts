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
import type { IUserAuthService } from "../interfaces/services/user/IUserAuthService"
import { UserAuthService } from "../../services/user/UserAuth.service"
import type { IReferralService } from "../interfaces/services/user/IReferralService"
import { ReferralService } from "../../services/user/Referral.service"
import type { IPointsService } from "../interfaces/services/user/IPointsService"
import { PointsService } from "../../services/user/Points.service"
import { IUserService } from "../interfaces/services/user/IUserService"
import { UserService } from "../../services/user/User.service"
import { IUserMarketService } from "../interfaces/services/user/IUserMarketService"
import { UserMarketService } from "../../services/user/UserMarket.service"

// Admin Services
import { IAdminAuthService } from "../interfaces/services/admin/IAdminAuthService"
import { AdminAuthService } from "../../services/admin/AdminAuth.service"
import { IAdminUserService } from "../interfaces/services/admin/IAdminUserService"
import { AdminUserService } from "../../services/admin/AdminUser.service"
import { IAdminCommunityService } from "../interfaces/services/admin/IAdminCommunityService"
import { AdminCommunityService } from "../../services/admin/AdminCommunity.service"

// Community Admin Services
import { ICommunityAdminAuthService } from "../interfaces/services/communityAdmin/ICommunityAdminAuthService"
import { CommunityAdminAuthService } from "../../services/communityAdmin/CommunityAdminAuth.service"
import { ICommunityAdminProfileService } from "../interfaces/services/communityAdmin/ICommunityAdminProfileService"
import { CommunityAdminProfileService } from "../../services/communityAdmin/CommunityAdminProfile.service"
import { ICommunityAdminFeedService } from "../interfaces/services/communityAdmin/ICommnityAdminFeedService"
import { CommunityAdminFeedService } from "../../services/communityAdmin/CommunityAdminFeed.service"
import { ICommunityAdminMembersService } from "../interfaces/services/communityAdmin/ICommunityAdminMembersService"
import { CommunityAdminMembersService } from "../../services/communityAdmin/CommunityAdminMembers.service"

// Community Services
import { ICommunityUserService } from "../interfaces/services/community/ICommunityUserService"
import { CommunityUserService } from "../../services/community/CommunityUser.service"
import { IFollowService } from "../interfaces/services/community/IFollowService"
import { FollowService } from "../../services/community/Follow.service"
import { IUserMyCommunitiesService } from "../interfaces/services/community/IUserMyCommunitiesService"
import { UserMyCommunitiesService } from "../../services/community/UserMyCommunities.service"

// Posts Services
import { IPostService } from "../interfaces/services/posts/IPostService"
import { PostService } from "../../services/posts/Post.servcie"

// Chat Services
import { IChatService } from "../interfaces/services/chat/IChatService"
import { ChatService } from "../../services/chat/Chat.service"

// Other Services
import { JwtService } from "../../utils/jwt"
import { IJwtService } from "../interfaces/services/IJwtService"
import type { IOTPService } from "../interfaces/services/IOtpService"
import { OtpService } from "../../services/otp.service"
import type { IMailService } from "../interfaces/services/IMailService"
import { MailService } from "../../services/mail.service"

// Repositories
import type { IUserRepository } from "../interfaces/repositories/IUserRepository"
import { UserRepository } from "../../repositories/user.repository"
import type { IReferralHistoryRepository } from "../interfaces/repositories/IReferralHistoryRepository"
import { ReferralHistoryRepository } from "../../repositories/referralHistory.repository"
import type { IDailyCheckInRepository } from "../interfaces/repositories/IDailyCheckInRepository"
import { DailyCheckInRepository } from "../../repositories/dailyCheckIn.repository"
import type { IPointsHistoryRepository } from "../interfaces/repositories/IPointsHistoryRepository"
import { PointsHistoryRepository } from "../../repositories/pointsHistory.repository"
import type { IOtpRepository } from "../interfaces/repositories/IOtpRepository"
import { OtpRepository } from "../../repositories/otp.repository"
import { IAdminRepository } from "../interfaces/repositories/IAdminRepository"
import { AdminRepository } from "../../repositories/Admin.repository"
import { ICommunityAdminRepository } from "../interfaces/repositories/ICommunityAdminRepository"
import { CommunityAdminRepository } from "../../repositories/communityAdmin.repository"
import { ICommunityRequestRepository } from "../interfaces/repositories/ICommunityRequestRepository"
import { CommunityRequestRepository } from "../../repositories/communityRequest.repository"
import { ICommunityRepository } from "../interfaces/repositories/ICommunityRepository"
import { CommunityRepository } from "../../repositories/community.repository"

// Posts Repository
import { IPostRepository } from "../interfaces/repositories/IPostRepository"
import { PostRepository } from "../../repositories/post.repository"

// Chat Repository
import { IChatRepository } from "../interfaces/repositories/IChatRepository"
import { ChatRepository } from "../../repositories/chat.repository"

import { IReferralHistoryService } from "../interfaces/services/IReferralHistoryService"
import { ReferralHistoryService } from "../../services/referralHistory.service"
import { IPointsHistoryService } from "../interfaces/services/IPointsHistoryService"
import { PointsHistoryService } from "../../services/pointsHistory.service"
import { IDailyCheckInService } from "../interfaces/services/IDailyCheckInService"
import { DailyCheckInService } from "../../services/DailyCheckInService"
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
import { DexService } from "../../services/dex/dex.service"
import { IDexService } from "../interfaces/services/dex/IDexService"
import { IWalletService } from "../interfaces/services/dex/IWalletService"
import { WalletService } from "../../services/dex/wallet.service"
import { IAdminDexService } from "../interfaces/services/admin/IAdminDexService"
import { AdminDexService } from "../../services/admin/adminDex.service"
import { IAdminMarketService } from "../interfaces/services/admin/IAdminMarketService"
import { AdminMarketService } from "../../services/admin/AdminMarket.service"
import { IAdminWalletService } from "../interfaces/services/admin/IAdminWalletService"
import { AdminWalletService } from "../../services/admin/AdminWallet.service"
import { IDexRepository } from "../interfaces/repositories/IDexRepository"
import { DexRepository } from "../../repositories/dex.repository"
import { EtherscanService } from "../../utils/etherscan.service"
import { IPaymentRepository } from "../interfaces/repositories/IPaymentRepository"
import { PaymentRepository } from "../../repositories/payment.repository"
import { IUserDexService } from "../interfaces/services/user/IUserDexService"
import { UserDexService } from "../../services/user/UserDex.service"
import { IUserDexController } from "../interfaces/controllers/user/IUserDex.controller"
import { UserDexController } from "../../controllers/user/UserDex.controller"
import { ICommunityAdminDashboardController } from "../interfaces/controllers/communityAdmin/ICommunityAdminDashboard.controller"
import { CommunityAdminDashboardController } from "../../controllers/communityAdmin/CommunityAdminDashbaord.controller"
import { ICommunityAdminDashboardService } from "../interfaces/services/communityAdmin/ICommunityAdminDashboard.service"
import { CommunityAdminDashboardService } from "../../services/communityAdmin/CommunityAdminDashbaord.service"
import { ICommunityController } from "../interfaces/controllers/community/ICommunity.controller"
import { CommunityController } from "../../controllers/community/Community.controller"
import { ICommunityService } from "../interfaces/services/community/ICommunityService"
import { CommunityService } from "../../services/community/Community.service"
import { ICommunityAdminCommunityController } from "../interfaces/controllers/communityAdmin/ICommunityAdminCommunity.controller"
import { CommunityAdminCommunityController } from "../../controllers/communityAdmin/CommunityAdminCommunity.controller"
import { IUserCommunityChatController } from "../interfaces/controllers/community/IUserCommunityChat.controller"
import { UserCommunityChatController } from "../../controllers/community/UserCommunityChat.controller"
import { ICommunityAdminCommunityService } from "../interfaces/services/communityAdmin/ICommunityAdminCommunityService"
import { UserCommunityChatService } from "../../services/community/UserCommunityChat.service"
import { CommunityAdminCommunityService } from "../../services/communityAdmin/CommunityAdminCommunity.service"
import { CommunityMessageRepository } from "../../repositories/community/communityMessage.repository"
import { IUserCommunityChatService } from "../interfaces/services/community/IUserCommunityChatService"
import { ICommunityMessageRepository } from "../interfaces/repositories/community/ICommunityMessageRepository"
import { IChainCastRepository } from "../interfaces/repositories/chainCast/IChainCastRepository"
import { ChainCastRepository } from "../../repositories/chainCast/chainCast.repository"
import { IChainCastService } from "../interfaces/services/chainCast/IChainCastService"
import { ChainCastService } from "../../services/chainCast/chainCast.service"
import { UserChainCastController } from "../../controllers/chainCast/UserChainCast.controller"
import { CommunityAdminChainCastController } from "../../controllers/chainCast/CommunityAdminChainCast.controller"
import { IUserChainCastController } from "../interfaces/controllers/chainCast/IUserChainCast.controller"
import { ICommunityAdminChainCastController } from "../interfaces/controllers/chainCast/ICommunityAdminChainCast.controller"
import { ICommunitySubscriptionRepository } from "../interfaces/repositories/communityAdmin/ICommunityAdminSubscription.repository"
import { CommunitySubscriptionRepository } from "../../repositories/communityAdmin/CommunityAdminSubscription.repository"
import { ICommunityAdminSubscriptionService } from "../interfaces/services/communityAdmin/ICommunityAdminSubscriptionService"
import { CommunityAdminSubscriptionService } from "../../services/communityAdmin/CommunityAdminSubscription.service"
import { ICommunityAdminSubscriptionController } from "../interfaces/controllers/communityAdmin/ICommunityAdminSubscription.controller"
import { CommunityAdminSubscriptionController } from "../../controllers/communityAdmin/CommunityAdminSubscription.controller"
import { ICommunityAdminPostRepository } from "../interfaces/repositories/communityAdmin/ICommunityAdminPost.repository"
import { CommunityAdminPostRepository } from "../../repositories/communityAdmin/communityAdminPost.repository"
import { ICommunityAdminPostService } from "../interfaces/services/communityAdmin/ICommunityAdminPostService"
import { CommunityAdminPostController } from "../../controllers/communityAdmin/CommunityAdminPost.controller"
import { ICommunityAdminPostController } from "../interfaces/controllers/communityAdmin/ICommunityAdminPost.controller"
import { CommunityAdminPostService } from "../../services/communityAdmin/CommunityAdminPost.service"
import { IPointsConversionRepository } from "../interfaces/repositories/points/IPointsConversionRepository"
import { IConversionRateRepository } from "../interfaces/repositories/points/IConversionRateRepository"
import { PointsConversionRepository } from "../../repositories/points/pointsConversion.repository"
import { ConversionRateRepository } from "../../repositories/points/conversionRate.repository"
import { IPointsConversionService } from "../interfaces/services/points/IPointsConversionService"
import { IAdminPointsConversionService } from "../interfaces/services/points/IAdminPointsConversionService"
import { PointsConversionService } from "../../services/points/pointsConversionService"
import { AdminPointsConversionService } from "../../services/points/adminPointsConversionService"
import { IPointsConversionController } from "../interfaces/controllers/points/IPointsConversionController"
import { IAdminPointsConversionController } from "../interfaces/controllers/points/IAdminPointsConversionController"
import { PointsConversionController } from "../../controllers/points/PointsConversion.controller"
import { AdminPointsConversionController } from "../../controllers/points/AdminPointsConversion.controller"
import { ICommunityAdminQuestRepository } from "../interfaces/repositories/quest/ICommunityAdminQuestRepository"
import { CommunityAdminQuestRepository } from "../../repositories/quest/communityAdminQuest.repository"
import { ICommunityAdminQuestService } from "../interfaces/services/quest/ICommunityAdminQuestService"
import { CommunityAdminQuestService } from "../../services/quest/communityAdminQuest.service"
import { ICommunityAdminQuestController } from "../interfaces/controllers/quest/ICommunityAdminQuest.controller"
import { CommunityAdminQuestController } from "../../controllers/quest/CommunityAdminQuest.controller"
import { IUserQuestController } from "../interfaces/controllers/quest/IUserQuest.controller"
import { UserQuestController } from "../../controllers/quest/UserQuest.controller"
import { UserQuestRepository } from "../../repositories/quest/userQuest.repository"
import { UserQuestService } from "../../services/quest/userQuest.service"
import { IUserQuestService } from "../interfaces/services/quest/IUserQuestService"
import { IUserQuestRepository } from "../interfaces/repositories/quest/IUserQuest.repository"
import { DexSwapController } from "../../controllers/dex/DexSwap.controller"
import { DexSwapService } from "../../services/dex/dexSwap.service"
import { DexSwapRepository } from "../../repositories/dex/dexSwap.repository"
import { IDexSwapRepository } from "../interfaces/repositories/dex/IDexSwapRepository"
import { IDexSwapService } from "../interfaces/services/dex/IDexSwapService"
import { IDexSwapController } from "../interfaces/controllers/dex/IDexSwap.controller"
import { IAITradingController } from "../interfaces/controllers/aiChat/IAITrading.controller"
import { AITradingController } from "../../controllers/aiChat/AiTrading.controller"
import { IAITradingService } from "../interfaces/services/aiChat/IAITradingService"
import { AITradingService } from "../../services/aiChat/aiTrading.service"
import { IAIChatHistoryRepository } from "../interfaces/repositories/aiChat/IAIChatHistory.repository"
import { AIChatHistoryRepository } from "../../repositories/aiChat/aiChatHistory.repository"

// Create Container
const container = new Container()

// Bind Controllers
container.bind<IUserAuthController>(TYPES.IUserAuthController).to(UserAuthController)
container.bind<IUserProfileController>(TYPES.IUserProfileController).to(UserProfileController)
container.bind<IUserMarketController>(TYPES.IUserMarketController).to(UserMarketController)
container.bind<IReferralController>(TYPES.IReferralController).to(ReferralController)
container.bind<IPointsController>(TYPES.IPointsController).to(PointsController)

// Bind Admin Controllers
container.bind<IAdminAuthController>(TYPES.IAdminAuthController).to(AdminAuthController)
container.bind<IAdminUserController>(TYPES.IAdminUserController).to(AdminUserController)
container.bind<IAdminCommunityController>(TYPES.IAdminCommunityController).to(AdminCommunityController)

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

export default container