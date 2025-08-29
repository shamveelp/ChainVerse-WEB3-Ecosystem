import axios from 'axios';
import type { Store } from '@reduxjs/toolkit';
import type { RootState } from '@/redux/store';

const API_BASE_URL = process.env.NEXT_PUBLIC_API_URL || 'http://localhost:5000';

// Create axios instance
const api = axios.create({
  baseURL: API_BASE_URL,
  withCredentials: true,
  headers: {
    'Content-Type': 'application/json',
  },
});

let storeInstance: Store<RootState> | null = null;

export const setupAxiosInterceptors = (store: Store<RootState>) => {
  if (storeInstance) return;
  storeInstance = store;

  // Request interceptor
  api.interceptors.request.use(
    (config) => {
      const state = storeInstance?.getState() as RootState;
      const token = state?.userAuth?.token;
      
      if (token) {
        config.headers.Authorization = `Bearer ${token}`;
      }
      
      config.withCredentials = true;
      return config;
    },
    (error) => {
      return Promise.reject(error);
    }
  );

  // Response interceptor
  api.interceptors.response.use(
    (response) => response,
    async (error) => {
      const originalRequest = error.config;
      
      if (
        error.response?.status === 401 &&
        !originalRequest._retry &&
        originalRequest.url !== '/api/user/refresh-token'
      ) {
        originalRequest._retry = true;
        
        try {
          // Attempt to refresh token
          const response = await api.post('/api/user/refresh-token', {}, { withCredentials: true });
          
          if (response.data.success) {
            // If refresh successful, retry original request
            return api(originalRequest);
          }
        } catch (refreshError) {
          // If refresh fails, redirect to login
          if (typeof window !== 'undefined') {
            window.location.href = '/user/login';
          }
          return Promise.reject(refreshError);
        }
      }
      
      return Promise.reject(error);
    }
  );
};

export default api;