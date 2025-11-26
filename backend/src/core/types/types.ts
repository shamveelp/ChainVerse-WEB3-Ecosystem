const TYPES = {
  // Controllers
  IUserAuthController: Symbol.for("IUserAuthController"),
  IUserProfileController: Symbol.for("IUserProfileController"),
  IReferralController: Symbol.for("IReferralController"),
  IPointsController: Symbol.for("IPointsController"),

  IPostController: Symbol.for("IPostController"),
  
  // Admin Controllers
  IAdminAuthController: Symbol.for("IAdminAuthController"),
  IAdminUserController: Symbol.for("IAdminUserController"),
  IAdminCommunityController: Symbol.for("IAdminCommunityController"),
  
  // Community Admin Controllers
  ICommunityAdminAuthController: Symbol.for("ICommunityAdminAuthController"),
  
  // Community Controllers
  ICommunityUserProfileController: Symbol.for("ICommunityUserProfileController"),
  IFollowController: Symbol.for("IFollowController"),

  //chat controller
  IChatController: Symbol.for("IChatController"),
  
  
  // Services
  IUserAuthService: Symbol.for("IUserAuthService"),
  IUserService: Symbol.for("IUserService"),
  IReferralService: Symbol.for("IReferralService"),
  IPointsService: Symbol.for("IPointsService"),

  IPostService: Symbol.for("IPostService"),

  ICommunityAdminFeedService: Symbol.for("ICommunityAdminFeedService"),
  
  // Admin Services
  IAdminAuthService: Symbol.for("IAdminAuthService"),
  IAdminUserService: Symbol.for("IAdminUserService"),
  IAdminCommunityService: Symbol.for("IAdminCommunityService"),
  
  // Community Admin Services
  ICommunityAdminAuthService: Symbol.for("ICommunityAdminAuthService"),
  
  // Community Services
  ICommunityUserService: Symbol.for("ICommunityUserService"),
  IFollowService : Symbol.for("IFollowService"),

  //Chat
  IChatService: Symbol.for("IChatService"),
  
  // Other Services
  IJwtService: Symbol.for("IJwtService"),
  IOtpService: Symbol.for("IOtpService"),
  IMailService: Symbol.for("IMailService"),
  
  // Repositories
  IUserRepository: Symbol.for("IUserRepository"),
  IReferralHistoryRepository: Symbol.for("IReferralHistoryRepository"),
  IDailyCheckInRepository: Symbol.for("IDailyCheckInRepository"),
  IPointsHistoryRepository: Symbol.for("IPointsHistoryRepository"),
  IOtpRepository: Symbol.for("IOtpRepository"),
  IAdminRepository: Symbol.for("IAdminRepository"),
  ICommunityAdminRepository: Symbol.for("ICommunityAdminRepository"),
  ICommunityRequestRepository: Symbol.for("ICommunityRequestRepository"),
  ICommunityRepository: Symbol.for("ICommunityRepository"),

  IPostRepository: Symbol.for("IPostRepository"),

  //Chat Repo
  IChatRepository: Symbol.for("IChatRepository"),
  
  // History Services
  IReferralHistoryService: Symbol.for("IReferralHistoryService"),
  IPointsHistoryService: Symbol.for("IPointsHistoryService"),
  IDailyCheckInService: Symbol.for("IDailyCheckInService"),
  
  // DEX
  IAdminDexController: Symbol.for("IAdminDexController"),
  IAdminWalletController: Symbol.for("IAdminWalletController"),
  IDexController: Symbol.for("IDexController"),
  IWalletController: Symbol.for("IWalletController"),
  
  // DEX Services
  IDexService: Symbol.for("IDexService"),
  IWalletService: Symbol.for("IWalletService"),
  IAdminDexService: Symbol.for("IAdminDexService"),
  IAdminWalletService: Symbol.for("IAdminWalletService"),
  IUserDexService: Symbol.for("IUserDexService"),
  IUserDexController: Symbol.for("IUserDexController"),
  IAdminMarketService: Symbol.for("IAdminMarketService"),
  IAdminMarketController: Symbol.for("IAdminMarketController"),
  IUserMarketService: Symbol.for("IUserMarketService"),
  IUserMarketController: Symbol.for("IUserMarketController"),
  
  // DEX Repositories
  IDexRepository: Symbol.for("IDexRepository"),
  IPaymentRepository: Symbol.for("IPaymentRepository"),
  
  // External Services
  EtherscanService: Symbol.for("EtherscanService"),
  OAuthClient: Symbol.for("OAuthClient"),


  //new 
  ICommunityAdminMembersService: Symbol.for("ICommunityAdminMembersService"),
  ICommunityAdminProfileService: Symbol.for("ICommunityAdminProfileService"),
  ICommunityAdminProfileController: Symbol.for("ICommunityAdminProfileController"),
  ICommunityAdminMembersController: Symbol.for("ICommunityAdminMembersController"),
  ICommunityAdminFeedController: Symbol.for("ICommunityAdminFeedController"),


  ICommunityAdminDashboardService: Symbol.for("ICommunityAdminDashboardService"),
  ICommunityAdminDashboardController: Symbol.for("ICommunityAdminDashboardController"),

  ICommunityService: Symbol.for("ICommunityService"),
  ICommunityController: Symbol.for("ICommunityController"),

  IUserMyCommunitiesService: Symbol.for("IUserMyCommunitiesService"),
  IUserMyCommunitiesController: Symbol.for("IUserMyCommunitiesController"),

  ICommunityMessageRepository: Symbol.for("ICommunityMessageRepository"),
  ICommunityAdminCommunityService: Symbol.for("ICommunityAdminCommunityService"),
  IUserCommunityChatService: Symbol.for("IUserCommunityChatService"),
  ICommunityAdminCommunityController: Symbol.for("ICommunityAdminCommunityController"),
  IUserCommunityChatController: Symbol.for("IUserCommunityChatController"),

  IChainCastRepository: Symbol.for("IChainCastRepository"),
  ICommunityAdminChainCastService: Symbol.for("ICommunityAdminChainCastService"),
  IUserChainCastService: Symbol.for("IUserChainCastService"),
  ICommunityAdminChainCastController: Symbol.for("ICommunityAdminChainCastController"),
  IUserChainCastController: Symbol.for("IUserChainCastController"),
  IChainCastService: Symbol.for("IChainCastService"),
  ICommunitySubscriptionRepository  : Symbol.for("ICommunitySubscriptionRepository"),
  ICommunityAdminSubscriptionService      : Symbol.for("ICommunityAdminSubscriptionService"),

  ICommunityAdminSubscriptionController   : Symbol.for("ICommunityAdminSubscriptionController"),
  ICommunityAdminPostRepository : Symbol.for("ICommunityAdminPostRepository"),
  ICommunityAdminPostService    : Symbol.for("ICommunityAdminPostService"),
  ICommunityAdminPostController : Symbol.for("ICommunityAdminPostController"),

  IPointsConversionRepository : Symbol.for("IPointsConversionRepository"),
  IPointsConversionService    : Symbol.for("IPointsConversionService"),
  IPointsConversionController : Symbol.for("IPointsConversionController"),
  IConversionRateRepository   : Symbol.for("IConversionRateRepository"),
  IAdminPointsConversionService : Symbol.for("IAdminPointsConversionService"),
  IAdminPointsConversionController  : Symbol.for("IAdminPointsConversionController"),
  ICommunityAdminQuestRepository  : Symbol.for("ICommunityAdminQuestRepository"),
  ICommunityAdminQuestService: Symbol.for("ICommunityAdminQuestService"),
  ICommunityAdminQuestController: Symbol.for("ICommunityAdminQuestController"),
  IUserQuestService: Symbol.for("IUserQuestService"),
  IUserQuestController: Symbol.for("IUserQuestController"),
  IUserQuestRepository: Symbol.for("IUserQuestRepository"),

  IDexSwapRepository: Symbol.for("IDexSwapRepository"),
  IDexSwapService: Symbol.for("IDexSwapService"),
  IDexSwapController: Symbol.for("IDexSwapController"),

  IAIChatHistoryRepository: Symbol.for("IAIChatHistoryRepository"),
  IAITradingService: Symbol.for("IAITradingService"),
  IAITradingController: Symbol.for("IAITradingController"),

};

export { TYPES };