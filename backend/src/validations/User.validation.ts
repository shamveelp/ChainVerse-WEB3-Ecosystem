import logger from "../utils/logger";
import { VALIDATION_MESSAGES } from "../enums/validationMessages.enum";


export const validateUserSignupInput = (
    username: string,
    email: string,
    password: string,
    confirmPassword: string,
    termsAccepted: boolean,
    role?: string,
    refferalCode?: string
): void => {
    
}

