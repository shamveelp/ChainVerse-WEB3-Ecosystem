import { injectable, inject } from "inversify";
import { IOTPService } from "../core/interfaces/services/IOtpService";
import { IUserRepository } from "../core/interfaces/repositories/IUserRepository";
import { IOtpRepository } from "../core/interfaces/repositories/IOtpRepository";
import { TYPES } from "../core/types/types";
import {IMailService} from "../core/interfaces/services/IMailService";
import {sendOtpHtml} from "../utils/sendEmail";
import logger from "../utils/logger";
import { IAdminRepository } from "../core/interfaces/repositories/IAdminRepository";


@injectable()
export class OtpService implements IOTPService {
    constructor(
        @inject(TYPES.IUserRepository) private userRepository: IUserRepository,
        @inject(TYPES.IAdminRepository) private adminRepository: IAdminRepository,
        @inject(TYPES.IUserRepository) private communityAdminRepository: IUserRepository,
        @inject(TYPES.IOtpRepository) private otpRepository: IOtpRepository,
        @inject(TYPES.IMailService) private mailService: IMailService
    ) { }

    private generateOtp() {
        return Math.floor(100000 + Math.random() * 900000).toString();
    }

    private getRepoByRole(role: 'user' | 'admin' | 'communityAdmin') {
        switch(role) {
            case 'user':
                return this.userRepository;
            case 'admin':
                return this.adminRepository;
            case 'communityAdmin':
                return this.communityAdminRepository;
            default:
                throw new Error("Invalid role");
        }
    }

    async requestOtp(email: string, role: 'user' | 'admin' | 'communityAdmin') {
        const repo = this.getRepoByRole(role)
        const existinguser = await repo.findByEmail(email);
        if(existinguser) {
            throw new Error("Email is already registered, Please Login");
        }


        const otp = this.generateOtp();
        const expiresAt = new Date(Date.now() + 10 * 60 * 1000);
        
        logger.info(`Generated OTP: ${otp} for email: ${email}`);
        await this.otpRepository.saveOtp(email, otp, expiresAt);
        await this.mailService.sendMail(
            email,
            "Your OTP Code",
            sendOtpHtml(otp)
        )
        return otp
    }


    async requestForgotPasswordOtp(email: string, role:'user' | 'admin' | 'communityAdmin') {
        const repo = this.getRepoByRole(role)
        const existingUser = await repo.findByEmail(email);
        if (!existingUser) {
            throw new Error("Email not found");
        }

        const otp = this.generateOtp();
        const expiresAt = new Date(Date.now() + 10 * 60 * 1000);

        logger.info(`Generated OTP: ${otp} for forgot password request for email: ${email}`);
        await this.otpRepository.saveOtp(email, otp, expiresAt);
        await this.mailService.sendMail(
            email,
            "ChainVerse Password Reset OTP",
            sendOtpHtml(otp)
        );
        return otp;
        
    }


    async verifyOtp(email: string, otp: string) {
        const record = await this.otpRepository.findOtpByEmail(email);
        if (!record) {
            throw new Error("OTP not found for this email");
        }
        if(record.expiresAt < new Date()) {
            throw new Error("OTP has expired");
        }
        if (record.otp !== otp) {
            throw new Error("Invalid OTP");
        }

        await this.otpRepository.deleteOtp(record._id.toString());
        return true;
    }

    async clearOtp(email:string){
        await this.otpRepository.deleteOtp(email)
    }


}

