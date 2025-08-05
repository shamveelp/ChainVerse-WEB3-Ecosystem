"use client"

import type { Store } from "@reduxjs/toolkit"
import api from "@/lib/axios"
import { logout } from "@/redux/slices/userAuthSlice"
import { StatusCode } from "@/utils/statusCodes"
import type { RootState } from "@/redux/store"

let storeInstance: Store<RootState> | null = null

export const setupAxiosInterceptors = (store: Store<RootState>) => {
  if (storeInstance) return // Ensure interceptors are only set up once
  storeInstance = store

  api.interceptors.request.use(
    (config) => {
      const state = storeInstance?.getState() as RootState
      const token = state.userAuth.token
      if (token) {
        config.headers.Authorization = `Bearer ${token}`
      }
      config.withCredentials = true // Ensure credentials are sent with every request
      return config
    },
    (error) => {
      return Promise.reject(error)
    },
  )

  api.interceptors.response.use(
    (response) => response,
    async (error) => {
      const originalRequest = error.config
      if (
        error.response &&
        error.response.status === StatusCode.UNAUTHORIZED &&
        !originalRequest._retry &&
        originalRequest.url !== "/user/refresh-token"
      ) {
        originalRequest._retry = true
        try {
          // Attempt to refresh token
          const response = await api.post("/user/refresh-token", {}, { withCredentials: true })
          // If refresh successful, retry original request
          return api(originalRequest)
        } catch (refreshError: any) {
          // If refresh fails, dispatch logout
          storeInstance?.dispatch(logout())
          return Promise.reject(refreshError)
        }
      }
      return Promise.reject(error)
    },
  )
}

export default api // Export the configured axios instance for use in services
