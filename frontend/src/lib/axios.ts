import { StatusCode } from '@/utils/statusCodes';
import axios from 'axios';

const API_URL = process.env.NEXT_PUBLIC_API_URL || "http://localhost:5000"

const api = axios.create({
    baseURL: API_URL,
    withCredentials: true,
    headers: {
        'Content-Type': 'application/json'
    }
})


api.interceptors.response.use(
    response => response,
    async error => {
        const originalRequest = error.config;
        if (
            error.response && 
            error.response.status === StatusCode.UNAUTHORIZED &&
            !originalRequest._retry && 
            originalRequest.url !== '/user/refresh-token'
        ) {
            originalRequest._retry = true;
            try {
                const response = await api.post('/user/refresh-token', 
                    {}, 
                    { withCredentials: true});
                return api(originalRequest);
                } catch (refreshError) {
                    return Promise.reject(refreshError);
            }   
        }
        return Promise.reject(error);
    }
)


export default api;

