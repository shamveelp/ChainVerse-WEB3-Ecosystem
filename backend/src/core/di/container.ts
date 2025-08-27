import { Container } from "inversify"
import { TYPES } from "../types/types"
import { OAuthClient } from "../../utils/OAuthClient"

// Controllers
import type { IUserAuthController } from "../interfaces/controllers/user/IUserAuth.controllers"
import { UserAuthController } from "../../controllers/user/userAuth.controller"
// import { IAdminAuthController } from "../interfaces/controllers/admin/IAuthAdmin.controllers" // Commented out as per your code

// Services
import type { IUserAuthService } from "../interfaces/services/user/IUserAuthService"
import { UserAuthService } from "../../services/user/UserAuth.service"
import { JwtService } from "../../utils/jwt"

// Repositories
import type { IUserRepository } from "../interfaces/repositories/IUserRepository"
import { UserRepository } from "../../repositories/user.repository"
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
import { UserProfileController } from "../../controllers/user/userProfile.controller"
import { IUserService } from "../interfaces/services/user/IUserService"
import { UserService } from "../../services/user/User.service"
// import { WalletController } from "../../controllers/user/wallet.controller"
// import { IWalletController } from "../interfaces/controllers/user/IWallet.controller"
// import { IWalletRepository } from "../interfaces/repositories/IWalletRepository"
// import { WalletRepository } from "../../repositories/wallet.repository"
// import { IWalletService } from "../interfaces/services/user/IWalletService"
// import { WalletService } from "../../services/user/Wallet.service"
// import { IRedisClient } from "../../config/redis" // Commented out as per your code
// import redisClient from "../../config/redis" // Commented out as per your code

// Create Container
const container = new Container()

// Bind Controllers
container.bind<IUserAuthController>(TYPES.IUserAuthController).to(UserAuthController)
// container.bind<IAdminAuthController>(TYPES.IAdminAuthController).to(AdminAuthController) // Commented out as per your code

// Bind Services
container.bind<IUserAuthService>(TYPES.IUserAuthService).to(UserAuthService)

// Bind Repositories
container.bind<IUserRepository>(TYPES.IUserRepository).to(UserRepository)

// Bind OAuth Client
container.bind<OAuthClient>(TYPES.OAuthClient).to(OAuthClient)

// Bind other services
// container.bind<IEmailService>(TYPES.IEmailService).to(EmailService); // Commented out as per your code
// container.bind<JwtService>(TYPES.JwtService).to(JwtService)
container.bind<IOTPService>(TYPES.IOtpService).to(OtpService)

// Bind Otp Repository
container.bind<IOtpRepository>(TYPES.IOtpRepository).to(OtpRepository)
container.bind<IMailService>(TYPES.IMailService).to(MailService)

// utilities
// container.bind<IRedisClient>(TYPES.IRedisClient).toConstantValue(redisClient) // Commented out as per your code

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


container.bind<IUserProfileController>(TYPES.IUserProfileController).to(UserProfileController)
container.bind<IUserService>(TYPES.IUserService).to(UserService)

// Wallet
// container.bind<IWalletController>(TYPES.WalletController).to(WalletController);
// container.bind<IWalletService>(TYPES.IWalletService).to(WalletService);
// container.bind<IWalletRepository>(TYPES.IWalletRepository).to(WalletRepository);



export default container
