import axios from 'axios';
import type { Store } from '@reduxjs/toolkit';
import type { RootState } from '@/redux/store';

const API_BASE_URL = process.env.NEXT_PUBLIC_API_URL || 'http://localhost:5000';

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

  api.interceptors.request.use(
    (config) => {
      const state = storeInstance?.getState() as RootState;
      const userToken = state?.userAuth?.token;
      const adminToken = state?.adminAuth?.token;

      const token = config.url?.includes('/admin') ? adminToken : userToken;

      if (token) {
        config.headers.Authorization = `Bearer ${token}`;
      }

      config.withCredentials = true;
      return config;
    },
    (error) => Promise.reject(error)
  );

  api.interceptors.response.use(
    (response) => response,
    async (error) => {
      const originalRequest = error.config;

      // Handle refresh on 401
      if (
        error.response?.status === 401 &&
        !originalRequest._retry &&
        !originalRequest.url.includes('/refresh-token')
      ) {
        originalRequest._retry = true;

        try {
          const refreshEndpoint = originalRequest.url.includes('/admin')
            ? '/api/admin/refresh-token'
            : '/api/user/refresh-token';

          const response = await api.post(refreshEndpoint, {}, { withCredentials: true });

          if (response.data.success) {
            const role = originalRequest.url.includes('/admin') ? 'admin' : 'user';

            store.dispatch({
              type: role === 'admin' ? 'adminAuth/updateToken' : 'userAuth/updateToken',
              payload: response.data.accessToken,
            });

            return api(originalRequest);
          }
        } catch (refreshError) {
          // If refresh fails → logout
          handleLogout(originalRequest.url.includes('/admin') ? 'admin' : 'user');
          return Promise.reject(refreshError);
        }
      }

      // Auto logout on 401 (failed refresh) or 403
      if (error.response?.status === 401 || error.response?.status === 403) {
        handleLogout(originalRequest.url.includes('/admin') ? 'admin' : 'user');
      }

      return Promise.reject(error);
    }
  );
};

function handleLogout(role: 'admin' | 'user') {
  if (!storeInstance) return;

  storeInstance.dispatch({
    type: role === 'admin' ? 'adminAuth/logout' : 'userAuth/logout',
  });

  if (typeof window !== 'undefined') {
    window.location.href = role === 'admin' ? '/admin/login' : '/user/login';
  }
}

export default api;
