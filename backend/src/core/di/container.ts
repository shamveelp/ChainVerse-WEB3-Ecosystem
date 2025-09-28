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

// Community Controllers
import { ICommunityUserProfileController } from "../interfaces/controllers/community/ICommunityUserProfile.controller"
import { CommunityUserProfileController } from "../../controllers/community/CommunityUserProfile.controller"

// Services
import type { IUserAuthService } from "../interfaces/services/user/IUserAuthService"
import { UserAuthService } from "../../services/user/UserAuth.service"
import type { IReferralService } from "../interfaces/services/user/IReferralService"
import { ReferralService } from "../../services/user/Referral.service"
import type { IPointsService } from "../interfaces/services/user/IPointsService"
import { PointsService } from "../../services/user/Points.service"
import { IUserService } from "../interfaces/services/user/IUserService"
import { UserService } from "../../services/user/User.service"

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

// Community Services
import { ICommunityUserService } from "../interfaces/services/community/ICommunityUserService"
import { CommunityUserService } from "../../services/community/CommunityUser.service"

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
import { IReferralHistoryService } from "../interfaces/services/IReferralHistoryService"
import { ReferralHistoryService } from "../../services/referralHistory.service"
import { IPointsHistoryService } from "../interfaces/services/IPointsHistoryService"
import { PointsHistoryService } from "../../services/pointsHistory.service"
import { IDailyCheckInService } from "../interfaces/services/IDailyCheckInService"
import { DailyCheckInService } from "../../services/DailyCheckInService"
import { IAdminDexController } from "../interfaces/controllers/admin/IAdminDexController"
import { AdminDexController } from "../../controllers/admin/adminDex.controller"
import { IAdminWalletController } from "../interfaces/controllers/admin/IAdminWalletController"
import { AdminWalletController } from "../../controllers/admin/AdminWallet.controller"
import { DexController } from "../../controllers/dex/dex.controller"
import { IDexController } from "../interfaces/controllers/dex/IDexController"
import { WalletController } from "../../controllers/dex/Wallet.controller"
import { IWalletController } from "../interfaces/controllers/dex/IWalletController"
import { DexService } from "../../services/dex/dex.service"
import { IDexService } from "../interfaces/services/dex/IDexService"
import { IWalletService } from "../interfaces/services/dex/IWalletService"
import { WalletService } from "../../services/dex/wallet.service"
import { IAdminDexService } from "../interfaces/services/admin/IAdminDexService"
import { AdminDexService } from "../../services/admin/adminDex.service"
import { IAdminWalletService } from "../interfaces/services/admin/IAdminWalletService"
import { AdminWalletService } from "../../services/admin/AdminWallet.service"
import { IDexRepository } from "../interfaces/repositories/IDexRepository"
import { DexRepository } from "../../repositories/dex.repository"
import { EtherscanService } from "../../services/etherscan.service"
import { IPaymentRepository } from "../interfaces/repositories/IPaymentRepository"
import { PaymentRepository } from "../../repositories/payment.repository"
import { IUserDexService } from "../interfaces/services/user/IUserDexService"
import { UserDexService } from "../../services/user/UserDex.service"
import { IUserDexController } from "../interfaces/controllers/user/IUserDex.controller"
import { UserDexController } from "../../controllers/user/UserDex.controller"

// Create Container
const container = new Container()

// Bind Controllers
container.bind<IUserAuthController>(TYPES.IUserAuthController).to(UserAuthController)
container.bind<IUserProfileController>(TYPES.IUserProfileController).to(UserProfileController)
container.bind<IReferralController>(TYPES.IReferralController).to(ReferralController)
container.bind<IPointsController>(TYPES.IPointsController).to(PointsController)

// Bind Admin Controllers
container.bind<IAdminAuthController>(TYPES.IAdminAuthController).to(AdminAuthController)
container.bind<IAdminUserController>(TYPES.IAdminUserController).to(AdminUserController)
container.bind<IAdminCommunityController>(TYPES.IAdminCommunityController).to(AdminCommunityController)

// Bind Community Admin Controllers
container.bind<ICommunityAdminAuthController>(TYPES.ICommunityAdminAuthController).to(CommunityAdminAuthController)

// Bind Community Controllers
container.bind<ICommunityUserProfileController>(TYPES.ICommunityUserProfileController).to(CommunityUserProfileController)

// Bind Services
container.bind<IUserAuthService>(TYPES.IUserAuthService).to(UserAuthService)
container.bind<IUserService>(TYPES.IUserService).to(UserService)
container.bind<IReferralService>(TYPES.IReferralService).to(ReferralService)
container.bind<IPointsService>(TYPES.IPointsService).to(PointsService)

// Bind Admin Services
container.bind<IAdminAuthService>(TYPES.IAdminAuthService).to(AdminAuthService)
container.bind<IAdminUserService>(TYPES.IAdminUserService).to(AdminUserService)
container.bind<IAdminCommunityService>(TYPES.IAdminCommunityService).to(AdminCommunityService)

// Bind Community Admin Services
container.bind<ICommunityAdminAuthService>(TYPES.ICommunityAdminAuthService).to(CommunityAdminAuthService)

// Bind Community Services
container.bind<ICommunityUserService>(TYPES.ICommunityUserService).to(CommunityUserService)

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

// admin dex
container.bind<IAdminDexController>(TYPES.IAdminDexController).to(AdminDexController)
container.bind<IAdminDexService>(TYPES.IAdminDexService).to(AdminDexService)

container.bind<IPaymentRepository>(TYPES.IPaymentRepository).to(PaymentRepository)

container.bind<IUserDexService>(TYPES.IUserDexService).to(UserDexService)
container.bind<IUserDexController>(TYPES.IUserDexController).to(UserDexController)

export default container