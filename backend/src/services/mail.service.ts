import { inject, injectable } from "inversify";
import { IMailService } from "../core/interfaces/services/IMailService";
import { MailUtil } from "../utils/mail.util";



@injectable()
export class MailService implements IMailService  {
    private mailUtil: MailUtil;

    constructor() {
        this.mailUtil = new MailUtil();
        this.validateEnv()
    }

    private validateEnv(): void {
        if(!process.env.EMAIL_USER || !process.env.EMAIL_PASS) {
            throw new Error("Mail Service configuration incomplete: Missing email  or password")
        }
    }

    async sendMail(to:string, subject:string, html:string) {
        try {
            const result = await this.mailUtil.send(to, subject, html);
            return result
        } catch (error) {
            throw new Error("Mail Delivery Failed")
        }
    }
    
}
