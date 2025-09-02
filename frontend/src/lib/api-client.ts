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
      // Check both userAuth and adminAuth for token
      const userToken = state?.userAuth?.token;
      const adminToken = state?.adminAuth?.token;

      // Prioritize admin token for admin routes
      const token = config.url?.includes('/admin') ? adminToken : userToken;

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
        !originalRequest.url.includes('/refresh-token')
      ) {
        originalRequest._retry = true;

        try {
          // Attempt to refresh token
          const refreshEndpoint = originalRequest.url.includes('/admin')
            ? '/api/admin/refresh-token'
            : '/api/user/refresh-token';

          const response = await api.post(refreshEndpoint, {}, { withCredentials: true });

          if (response.data.success) {
            // Update token in Redux store
            const state = storeInstance?.getState() as RootState;
            const role = originalRequest.url.includes('/admin') ? 'admin' : 'user';
            if (role === 'admin') {
              store.dispatch({
                type: 'adminAuth/updateToken',
                payload: response.data.accessToken,
              });
            } else {
              store.dispatch({
                type: 'userAuth/updateToken',
                payload: response.data.accessToken,
              });
            }
            // Retry original request
            return api(originalRequest);
          }
        } catch (refreshError) {
          // If refresh fails, redirect to appropriate login page
          if (typeof window !== 'undefined') {
            const redirectUrl = originalRequest.url.includes('/admin')
              ? '/admin/login'
              : '/user/login';
            window.location.href = redirectUrl;
          }
          return Promise.reject(refreshError);
        }
      }

      return Promise.reject(error);
    }
  );
};

export default api;