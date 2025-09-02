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

  // Repositories
  IUserRepository: Symbol.for("IUserRepository"),
  IReferralHistoryRepository: Symbol.for("IReferralHistoryRepository"),
  IDailyCheckInRepository: Symbol.for("IDailyCheckInRepository"),
  IPointsHistoryRepository: Symbol.for("IPointsHistoryRepository"),
  IOtpRepository: Symbol.for("IOtpRepository"),
  IAdminRepository: Symbol.for("IAdminRepository"),
  ICommunityAdminRepository: Symbol.for("ICommunityAdminRepository"),
  ICommunityRequestRepository: Symbol.for("ICommunityRequestRepository"),

  // Others
  OAuthClient: Symbol.for("OAuthClient"),
  AdminAuthController: Symbol.for("AdminAuthController"),
  AdminUserController: Symbol.for("AdminUserController"),
  AdminCommunityController: Symbol.for("AdminCommunityController"),
  CommunityAdminAuthController: Symbol.for("CommunityAdminAuthController"),



  
  IReferralHistoryService: Symbol.for("IReferralHistoryService"),
  IPointsHistoryService: Symbol.for("IPointsHistoryService"),
  IDailyCheckInService: Symbol.for("IDailyCheckInService"),
  
};

export { TYPES };