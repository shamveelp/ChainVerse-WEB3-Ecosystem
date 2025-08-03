

export const MAIL_CONSTANTS = {
    FROM: 'no-reply@chainverse.in',
    SUBJECT: 'ChainVerse - OTP Verification',
    REMINDER_SUBJECT: 'ChainVerse - OTP Reminder',
}

export function sendOtpHtml(otp: string): string {
    return `
        <div style="font-family: Arial, sans-serif; color: #333;">
            <h2>OTP Verification</h2>
            <p>Your OTP for ChainVerse is:</p>
            <h1 style="font-size: 2em; color: #007bff;">${otp}</h1>
            <p>Please enter this OTP to verify your account.</p>
            <p>If you did not request this, please ignore this email.</p>
        </div>
    `;
}


export function getReminderHtml(message: string): string {
    return `
        <div style="font-family: Arial, sans-serif;">
            <h2>Reminder</h2>
            <p>${message}</p>
        </div>
    `
}

