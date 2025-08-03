import logger from '@/utils/logger';
import axios from 'axios';


const API_URL = process.env.NEXT_PUBLIC_API_URL


export const apiService = {
    requestOtp: async (email: string) => {
        try {
            const response = await axios.post(`${API_URL}/api/users/request-otp`, { email }, { withCredentials: true })
            return { success: true, message: response.data.message }
        } catch (error: any) {
            logger.error("Request OTP error:", error)
            return {
                success: false,
                error: error.response?.data?.error?.message || error.message || "Network error"
            }
        }
    }
}



