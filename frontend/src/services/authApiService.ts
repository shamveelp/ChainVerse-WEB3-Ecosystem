import API from "@/lib/api-client"

interface ApiResponse<T = any> {
  success: boolean;
  data?: T;
  error?: string;
  message?: string;
}

interface LoginResponse {
  user: {
    _id: string;
    username: string;
    email: string;
    name: string;
    refferalCode: string;
    totalPoints: number;
    profilePic?: string;
    role: string;
    isEmailVerified: boolean;
    createdAt: string;
    lastLogin?: string;
  };
  accessToken: string;
  message: string;
}

interface RegisterResponse {
  success: boolean;
  message: string;
}

interface UsernameCheckResponse {
  available: boolean;
  success: boolean;
}

interface GenerateUsernameResponse {
  username: string;
  success: boolean;
}

export const login = async (email: string, password: string) => {
  try {
    const response = await API.post<LoginResponse>("/api/user/login", { email, password })
    return {
      success: true,
      user: response.data.user,
      token: response.data.accessToken,
      message: response.data.message,
    }
  } catch (error: any) {
    console.error("Login error:", error.response?.data || error.message)
    return {
      success: false,
      error: error.response?.data?.error || error.response?.data?.message || error.message || "Login failed",
    }
  }
}

export const register = async (username: string, email: string, password: string, name: string, referralCode?: string) => {
  try {
    const payload: any = { username, email, password, name }
    
    // Only include referralCode if it has a value
    if (referralCode && referralCode.trim()) {
      payload.referralCode = referralCode.trim().toUpperCase()
    }
    
    console.log("Sending registration request with payload:", payload);
    
    const response = await API.post<RegisterResponse>("/api/user/register", payload)
    return {
      success: true,
      message: response.data.message || "Registration successful, OTP sent",
    }
  } catch (error: any) {
    console.error("Register error:", error.response?.data || error.message)
    return {
      success: false,
      error: error.response?.data?.error || error.response?.data?.message || error.message || "Registration failed",
    }
  }
}

export const signup = async (username: string, email: string, password: string, name: string, referralCode: string | undefined, otp: string) => {
  try {
    const payload: any = {
      username,
      email,
      password,
      name,
      otp,
    }
    
    // Only include referralCode if it has a value
    if (referralCode && referralCode.trim()) {
      payload.referralCode = referralCode.trim().toUpperCase()
    }
    
    console.log("Sending OTP verification with payload:", payload);
    
    const response = await API.post<LoginResponse>("/api/user/verify-otp", payload)
    return {
      success: true,
      user: response.data.user,
      token: response.data.accessToken,
      message: response.data.message,
    }
  } catch (error: any) {
    console.error("Signup error:", error.response?.data || error.message)
    return {
      success: false,
      error: error.response?.data?.error || error.response?.data?.message || error.message || "Account creation failed",
    }
  }
}

export const checkUsername = async (username: string) => {
  try {
    const response = await API.post<UsernameCheckResponse>("/api/user/check-username", { username })
    return {
      success: true,
      available: response.data.available,
    }
  } catch (error: any) {
    console.error("Check username error:", error.response?.data || error.message)
    return {
      success: false,
      available: false,
      error: error.response?.data?.error || error.response?.data?.message || error.message || "Failed to check username",
    }
  }
}

export const generateUsername = async () => {
  try {
    const response = await API.get<GenerateUsernameResponse>("/api/user/generate-username")
    return {
      success: true,
      username: response.data.username,
    }
  } catch (error: any) {
    console.error("Generate username error:", error.response?.data || error.message)
    return {
      success: false,
      error: error.response?.data?.error || error.response?.data?.message || error.message || "Failed to generate username",
    }
  }
}

export const requestOtp = async (email: string) => {
  try {
    const response = await API.post<ApiResponse>("/api/user/request-otp", { email })
    return {
      success: response.data.success || true,
      message: response.data.message,
    }
  } catch (error: any) {
    console.error("Request OTP error:", error.response?.data || error.message)
    return {
      success: false,
      error: error.response?.data?.error || error.response?.data?.message || error.message || "Failed to request OTP",
    }
  }
}

export const forgotPassword = async (email: string) => {
  try {
    const response = await API.post<ApiResponse>("/api/user/forgot-password", { email })
    return {
      success: true,
      message: response.data.message,
    }
  } catch (error: any) {
    console.error("Forgot password error:", error.response?.data || error.message)
    return {
      success: false,
      error: error.response?.data?.error || error.response?.data?.message || error.message || "Failed to send reset code",
    }
  }
}

export const verifyForgotPasswordOtp = async (email: string, otp: string) => {
  try {
    const response = await API.post<ApiResponse>("/api/user/verify-forgot-password-otp", { email, otp })
    return {
      success: true,
      message: response.data.message,
    }
  } catch (error: any) {
    console.error("Verify forgot password OTP error:", error.response?.data || error.message)
    return {
      success: false,
      error: error.response?.data?.error || error.response?.data?.message || error.message || "Invalid OTP",
    }
  }
}

export const resetPassword = async (email: string, newPassword: string) => {
  try {
    const response = await API.post<ApiResponse>("/api/user/reset-password", { email, newPassword })
    return {
      success: true,
      message: response.data.message,
    }
  } catch (error: any) {
    console.error("Reset password error:", error.response?.data || error.message)
    return {
      success: false,
      error: error.response?.data?.error || error.response?.data?.message || error.message || "Password reset failed",
    }
  }
}

export const logout = async () => {
  try {
    await API.post("/api/user/logout")
    return { success: true }
  } catch (error: any) {
    console.error("Logout error:", error.response?.data || error.message)
    return {
      success: false,
      error: error.response?.data?.error || error.response?.data?.message || error.message || "Logout failed",
    }
  }
}

export const googleLogin = async (credential: string) => {
  try {
    const response = await API.post<LoginResponse>("/api/user/google-login", { token: credential })
    return {
      success: true,
      user: response.data.user,
      token: response.data.accessToken,
      message: response.data.message,
    }
  } catch (error: any) {
    console.error("Google login error:", error.response?.data || error.message)
    return {
      success: false,
      error: error.response?.data?.error || error.response?.data?.message || error.message || "Google login failed",
    }
  }
}

export const adminLogin = async (email: string, password: string) => {
  try {
    const response = await API.post("/api/admin/login", { email, password });
    return {
      success: true,
      admin: response.data.admin,
      token: response.data.accessToken, // Include token if backend returns it
      message: response.data.message,
    };
  } catch (error: any) {
    console.error("Admin login error:", error.response?.data || error.message);
    throw {
      success: false,
      error: error.response?.data?.message || error.message || "Login failed",
      response: error.response,
    };
  }
};

export const adminLogout = async () => {
  try {
    await API.post("/api/admin/logout")
    return { success: true }
  } catch (error: any) {
    console.error("Admin logout error:", error.response?.data || error.message)
    return {
      success: false,
      error: error.response?.data?.error || error.response?.data?.message || error.message || "Admin logout failed",
    }
  }
}