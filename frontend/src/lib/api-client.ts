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

      const adminToken = state?.adminAuth?.token;
      const communityAdminToken = state?.communityAdminAuth?.token;

      let token: string | null = null;

      // Determine which token to use based on the URL
      if (config.url?.includes('/admin') && !config.url?.includes('/community-admin')) {
        token = adminToken;
      } else if (config.url?.includes('/community-admin')) {
        token = communityAdminToken;
      } else {
        // User side relies on HttpOnly cookies, no Bearer token needed
        token = null;
      }

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

      const url: string = originalRequest?.url || "";

      // Do NOT trigger refresh / auto-logout for auth endpoints (e.g. login)
      const isAuthEndpoint =
        url.includes("/api/admin/login") ||
        url.includes("/api/user/login") ||
        url.includes("/api/community-admin/login");

      // Handle refresh on 401 (skip auth endpoints)
      if (
        error.response?.status === 401 &&
        !originalRequest._retry &&
        !url.includes("/refresh-token") &&
        !isAuthEndpoint
      ) {
        originalRequest._retry = true;

        try {
          let refreshEndpoint: string;
          let role: "admin" | "user" | "communityAdmin";

          if (url.includes("/community-admin")) {
            refreshEndpoint = "/api/community-admin/refresh-token";
            role = "communityAdmin";
          } else if (url.includes("/admin")) {
            refreshEndpoint = "/api/admin/refresh-token";
            role = "admin";
          } else {
            refreshEndpoint = "/api/user/refresh-token";
            role = "user";
          }

          const response = await api.post(refreshEndpoint, {}, { withCredentials: true });

          if (response.data.success) {
            if (role === "admin" || role === "communityAdmin") {
              const actionType =
                role === "admin"
                  ? "adminAuth/updateToken"
                  : "communityAdminAuth/updateToken";

              store.dispatch({
                type: actionType,
                payload: response.data.accessToken,
              });
            }

            return api(originalRequest);
          }
        } catch (refreshError) {
          // If refresh fails → logout (skip auth endpoints)
          if (!isAuthEndpoint) {
            const role = url.includes("/community-admin")
              ? "communityAdmin"
              : url.includes("/admin")
                ? "admin"
                : "user";
            handleLogout(role);
          }
          return Promise.reject(refreshError);
        }
      }

      // Auto logout on 401 (failed refresh) or 403 (skip auth endpoints)
      if ((error.response?.status === 401 || error.response?.status === 403) && !isAuthEndpoint) {
        const role = url.includes("/community-admin")
          ? "communityAdmin"
          : url.includes("/admin")
            ? "admin"
            : "user";
        handleLogout(role);
      }

      return Promise.reject(error);
    }
  );
};

function handleLogout(role: 'admin' | 'user' | 'communityAdmin') {
  if (!storeInstance) return;

  const actionType = role === 'admin'
    ? 'adminAuth/logout'
    : role === 'communityAdmin'
      ? 'communityAdminAuth/logout'
      : 'userAuth/logout';

  storeInstance.dispatch({
    type: actionType,
  });

  if (typeof window !== 'undefined') {
    const redirectPath = role === 'admin'
      ? '/admin/login'
      : role === 'communityAdmin'
        ? '/comms-admin/login'
        : '/user/login';
    window.location.href = redirectPath;
  }
}

export default api;