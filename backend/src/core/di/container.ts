import { Container } from "inversify"
import { TYPES } from "../types/types"
import { OAuthClient } from "../../utils/OAuthClient"

// Controllers
import type { IUserAuthController } from "../interfaces/controllers/user/IUserAuth.controllers"
import { UserAuthController } from "../../controllers/user/UserAuth.controller"
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
import { IJwtService } from "../interfaces/services/user/IJwtService"
import { AdminAuthController } from "../../controllers/admin/AdminAuth.controller"
import { IAdminAuthController } from "../interfaces/controllers/admin/IAuthAdmin.controllers"
import { IAdminAuthService } from "../interfaces/services/admin/IAdminAuthService"
import { AdminAuthService } from "../../services/admin/AdminAuth.service"
import { IAdminRepository } from "../interfaces/repositories/IAdminRepository"
import { AdminRepository } from "../../repositories/admin.repository"
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


export default container
