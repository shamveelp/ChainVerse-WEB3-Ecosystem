import nodemailer, {Transporter, SentMessageInfo} from 'nodemailer';


export class MailUtil {
    private transporter!: Transporter;
    
    constructor() {
        this.initializeTransporter();
    }

    private initializeTransporter() {
        this.transporter = nodemailer.createTransport({
            service: "gmail",
            auth: {
                user: process.env.EMAIL_USER!,
                pass: process.env.EMAIL_PASS!,
            },
            pool: true,
            maxConnections: 5,
            rateLimit: 10,
        })
    }

    public async send(to: string, subject: string, html: string): Promise<SentMessageInfo> {
        const mailOptions = {
            from: `"ChainVerse" <${process.env.EMAIL_USER}>`,
            to,
            subject,
            html,
            headers: {
                'X-Priority': '1', 
                'X-MSMail-Priority': 'High',
            }
        };

        return this.transporter.sendMail(mailOptions)
    }

}


