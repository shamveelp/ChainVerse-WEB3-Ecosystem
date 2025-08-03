import axios from 'axios';
import { useAuthStore } from '@/stores/userAuthStore';
const { logout } = useAuthStore.getState();
import logger from '@/utils/logger';
import { StatusCode } from '@/utils/statusCodes';


const BACKEND_URL = process.env.NEXT_PUBLIC_API_URL;

export const api = axios.create({
    baseURL: BACKEND_URL,
    withCredentials: true,
    headers: {
        "Content-Type": "application/json"
    }
});

// api.interceptors.request.use((config) => {
//     return config;
// },
//     (error) => {
//         logger.error("Coming from interceptors", error.message)
//         return Promise.reject(error)
//     }
// )

// api.interceptors.response.use(
//     (res) => res,
//     (error) => {
//         logger.error("Coming from interceptors", error.response)
//         if (error?.response?.status === StatusCode.UNAUTHORIZED || error?.response?.status === StatusCode.FORBIDDEN) {
//             logout()
//             logger.info("Working this line")

//         }
//     }
// )


