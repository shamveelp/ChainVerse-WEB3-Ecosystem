import { Container } from "inversify"
import { TYPES } from "../types/types"
import { OAuthClient } from "../../utils/OAuthClient"

// Controllers
import type { IUserAuthController } from "../interfaces/controllers/user/IUserAuth.controllers"
import { UserAuthController } from "../../controllers/user/UserAuth.controller"
import type { IReferralController } from "../interfaces/controllers/user/IReferral.controller"
import { ReferralController } from "../../controllers/user/Referral.controller"
import type { IPointsController } from "../interfaces/controllers/user/IPoints.controller"
import { PointsController } from "../../controllers/user/Points.controller"

// Services
import type { IUserAuthService } from "../interfaces/services/user/IUserAuthService"
import { UserAuthService } from "../../services/user/UserAuth.service"
import type { IReferralService } from "../interfaces/services/user/IReferralService"
import { ReferralService } from "../../services/user/Referral.service"
import type { IPointsService } from "../interfaces/services/user/IPointsService"
import { PointsService } from "../../services/user/Points.service"
import { JwtService } from "../../utils/jwt"

// Repositories
import type { IUserRepository } from "../interfaces/repositories/IUserRepository"
import { UserRepository } from "../../repositories/user.repository"
import type { IReferralHistoryRepository } from "../interfaces/repositories/IReferralHistoryRepository"
import { ReferralHistoryRepository } from "../../repositories/referralHistory.repository"
import type { IDailyCheckInRepository } from "../interfaces/repositories/IDailyCheckInRepository"
import { DailyCheckInRepository } from "../../repositories/dailyCheckIn.repository"
import type { IPointsHistoryRepository } from "../interfaces/repositories/IPointsHistoryRepository"
import { PointsHistoryRepository } from "../../repositories/pointsHistory.repository"
import type { IOTPService } from "../interfaces/services/IOtpService"
import { OtpService } from "../../services/otp.service"
import type { IOtpRepository } from "../interfaces/repositories/IOtpRepository"
import { OtpRepository } from "../../repositories/otp.repository"
import type { IMailService } from "../interfaces/services/IMailService"
import { MailService } from "../../services/mail.service"
import { IJwtService } from "../interfaces/services/IJwtService"
import { AdminAuthController } from "../../controllers/admin/adminAuth.controller"
import { IAdminAuthController } from "../interfaces/controllers/admin/IAuthAdmin.controllers"
import { IAdminAuthService } from "../interfaces/services/admin/IAdminAuthService"
import { AdminAuthService } from "../../services/admin/AdminAuth.service"
import { IAdminRepository } from "../interfaces/repositories/IAdminRepository"
import { AdminRepository } from "../../repositories/admin.repository"
import { ICommunityAdminAuthController } from "../interfaces/controllers/communityAdmin/ICommunityAdminAuth.controller"
import { CommunityAdminAuthController } from "../../controllers/communityAdmin/communityAdminAuth.controller"
import { ICommunityAdminAuthService } from "../interfaces/services/communityAdmin/ICommunityAdminAuthService"
import { CommunityAdminAuthService } from "../../services/communityAdmin/CommunityAdminAuth.service"
import { ICommunityAdminRepository } from "../interfaces/repositories/ICommunityAdminRepository"
import { CommunityAdminRepository } from "../../repositories/communityAdmin.repository"
import { ICommunityRequestRepository } from "../interfaces/repositories/ICommunityRequestRepository"
import { CommunityRequestRepository } from "../../repositories/communityRequest.repository"
import { IUserProfileController } from "../interfaces/controllers/user/IUserProfile.controller"
import { UserProfileController } from "../../controllers/user/UserProfile.controller"
import { IUserService } from "../interfaces/services/user/IUserService"
import { UserService } from "../../services/user/User.service"

// Create Container
const container = new Container()

// Bind Controllers
container.bind<IUserAuthController>(TYPES.IUserAuthController).to(UserAuthController)
container.bind<IUserProfileController>(TYPES.IUserProfileController).to(UserProfileController)
container.bind<IReferralController>(TYPES.IReferralController).to(ReferralController)
container.bind<IPointsController>(TYPES.IPointsController).to(PointsController)

// Bind Services
container.bind<IUserAuthService>(TYPES.IUserAuthService).to(UserAuthService)
container.bind<IUserService>(TYPES.IUserService).to(UserService)
container.bind<IReferralService>(TYPES.IReferralService).to(ReferralService)
container.bind<IPointsService>(TYPES.IPointsService).to(PointsService)

// Bind Repositories
container.bind<IUserRepository>(TYPES.IUserRepository).to(UserRepository)
container.bind<IReferralHistoryRepository>(TYPES.IReferralHistoryRepository).to(ReferralHistoryRepository)
container.bind<IDailyCheckInRepository>(TYPES.IDailyCheckInRepository).to(DailyCheckInRepository)
container.bind<IPointsHistoryRepository>(TYPES.IPointsHistoryRepository).to(PointsHistoryRepository)

// Bind OAuth Client
container.bind<OAuthClient>(TYPES.OAuthClient).to(OAuthClient)

// Bind other services
container.bind<IOTPService>(TYPES.IOtpService).to(OtpService)
container.bind<IOtpRepository>(TYPES.IOtpRepository).to(OtpRepository)
container.bind<IMailService>(TYPES.IMailService).to(MailService)
container.bind<IJwtService>(TYPES.IJwtService).to(JwtService)

// Admin
container.bind<AdminAuthController>(TYPES.AdminAuthController).to(AdminAuthController)
container.bind<IAdminAuthController>(TYPES.IAdminAuthController).to(AdminAuthController)
container.bind<IAdminAuthService>(TYPES.IAdminAuthService).to(AdminAuthService)
container.bind<IAdminRepository>(TYPES.IAdminRepository).to(AdminRepository)

// Community Admin
container.bind<ICommunityAdminAuthController>(TYPES.ICommunityAdminAuthController).to(CommunityAdminAuthController)
container.bind<CommunityAdminAuthController>(TYPES.CommunityAdminAuthController).to(CommunityAdminAuthController)
container.bind<ICommunityAdminAuthService>(TYPES.ICommunityAdminAuthService).to(CommunityAdminAuthService)
container.bind<ICommunityAdminRepository>(TYPES.ICommunityAdminRepository).to(CommunityAdminRepository)
container.bind<ICommunityRequestRepository>(TYPES.ICommunityRequestRepository).to(CommunityRequestRepository)

export default container