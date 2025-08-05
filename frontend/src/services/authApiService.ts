import API from "@/lib/axios"
import logger from "@/utils/logger";
import { StatusCode } from "@/utils/statusCodes";


export const login = async (email: string, password: string) => {
    try {
        const response = await API.post("/api/user/login", { email, password });
        if(response?.status >= StatusCode.OK && response?.status < StatusCode.MULTIPLE_CHOICES) {
            return response.data;
        }
        throw new Error(response?.data?.error || "Login Failed");
    } catch (error: any) {
        logger.error("Login error:", error);
        throw new Error(error.response?.data?.error || error.message || 'Login failed: Unable to connect to the server');
    }
}

export const signup = async (name: string, email: string, password: string, otp: string) => {
    return await API.post("/api/user/signup", { 
        name,
        email, 
        password,
        otp, 
    }, { withCredentials: true });
}

export const resendOtp = async (email: string) => {
    return await API.post("/api/user/resend-otp", { email });
}

export const logout = async () => {
    await API.post("/api/user/logout");
}

export const forgotPassword = async (email: string) => {
    const res = await API.post("/api/user/forgot-password", { email });
    return res.data;
}

export const verifyForgotPasswordOtp = async (otp: string, email: string) => {
    await API.post("/api/user/verify-forgot-password-otp", { otp, email });
}

export const resetPassword = async (email: string, newPassword: string) => {
    await API.post("/api/user/reset-password", { email, newPassword  });
}



// Admin Auths

export const adminLogin = async (email: string, password: string) => {
    const response = await API.post("/api/admin/login", { email, password });
    return response.data;
}

export const adminLogout = async () => {
    await API.post("/api/admin/logout");
}




