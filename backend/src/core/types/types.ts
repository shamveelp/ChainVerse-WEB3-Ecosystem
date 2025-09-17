const TYPES = {
  // Controllers
  IUserAuthController: Symbol.for("IUserAuthController"),
  IUserProfileController: Symbol.for("IUserProfileController"),
  IReferralController: Symbol.for("IReferralController"),
  IPointsController: Symbol.for("IPointsController"),
  IAdminAuthController: Symbol.for("IAdminAuthController"),
  IAdminUserController: Symbol.for("IAdminUserController"),
  IAdminCommunityController: Symbol.for("IAdminCommunityController"),
  ICommunityAdminAuthController: Symbol.for("ICommunityAdminAuthController"),

  IAdminDexController: Symbol.for("IAdminDexController"),
  IAdminWalletController: Symbol.for("IAdminWalletController"),
  IDexController: Symbol.for("IDexController"),
  IWalletController: Symbol.for("IWalletController"),

  // Services
  IUserAuthService: Symbol.for("IUserAuthService"),
  IUserService: Symbol.for("IUserService"),
  IReferralService: Symbol.for("IReferralService"),
  IPointsService: Symbol.for("IPointsService"),
  IAdminAuthService: Symbol.for("IAdminAuthService"),
  IAdminUserService: Symbol.for("IAdminUserService"),
  IAdminCommunityService: Symbol.for("IAdminCommunityService"),
  ICommunityAdminAuthService: Symbol.for("ICommunityAdminAuthService"),
  IJwtService: Symbol.for("IJwtService"),
  IOtpService: Symbol.for("IOtpService"),
  IMailService: Symbol.for("IMailService"),
  IWalletService: Symbol.for("IWalletService"),
  ICommunityRequestService: Symbol.for("ICommunityRequestService"),
  IDexService: Symbol.for("IDexService"),
  IAdminDexService: Symbol.for("IAdminDexService"),
  IAdminWalletService: Symbol.for("IAdminWalletService"),

  // Repositories
  IUserRepository: Symbol.for("IUserRepository"),
  IReferralHistoryRepository: Symbol.for("IReferralHistoryRepository"),
  IDailyCheckInRepository: Symbol.for("IDailyCheckInRepository"),
  IPointsHistoryRepository: Symbol.for("IPointsHistoryRepository"),
  IOtpRepository: Symbol.for("IOtpRepository"),
  IAdminRepository: Symbol.for("IAdminRepository"),
  ICommunityAdminRepository: Symbol.for("ICommunityAdminRepository"),
  ICommunityRequestRepository: Symbol.for("ICommunityRequestRepository"),
  IDexRepository: Symbol.for("IDexRepository"),

  // Others
  OAuthClient: Symbol.for("OAuthClient"),
  AdminAuthController: Symbol.for("AdminAuthController"),
  AdminUserController: Symbol.for("AdminUserController"),
  AdminCommunityController: Symbol.for("AdminCommunityController"),
  CommunityAdminAuthController: Symbol.for("CommunityAdminAuthController"),

  IReferralHistoryService: Symbol.for("IReferralHistoryService"),
  IPointsHistoryService: Symbol.for("IPointsHistoryService"),
  IDailyCheckInService: Symbol.for("IDailyCheckInService"),

  IPaymentRepository: Symbol.for("IPaymentRepository"),
  IPaymentService: Symbol.for("IPaymentService"),
  IUserDexService: Symbol.for("IUserDexService"),
  IUserDexController: Symbol.for("IUserDexController"),
  

  // Etherscan Service
  EtherscanService: Symbol.for("EtherscanService"),
};

export { TYPES };