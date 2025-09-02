import API from "@/lib/axios"

interface ValidationResponse {
  success: boolean
  available?: boolean
  exists?: boolean
  error?: string
  message?: string
}

export const checkEmailAvailability = async (email: string): Promise<ValidationResponse> => {
  try {
    const response = await API.post("/api/community-admin/check-email", { email })
    return {
      success: true,
      available: response.data.available || false,
      message: response.data.message
    }
  } catch (error: any) {
    return {
      success: false,
      available: false,
      error: error.response?.data?.message || "Email validation failed"
    }
  }
}

export const checkUsernameAvailability = async (username: string): Promise<ValidationResponse> => {
  try {
    const response = await API.post("/api/community-admin/check-username", { username })
    return {
      success: true,
      available: response.data.available || false,
      message: response.data.message
    }
  } catch (error: any) {
    return {
      success: false,
      available: false,
      error: error.response?.data?.message || "Username validation failed"
    }
  }
}

export const validateWalletAddress = (address: string): boolean => {
  // Ethereum address validation
  const ethRegex = /^0x[a-fA-F0-9]{40}$/
  return ethRegex.test(address)
}

export const validateCommunityForm = (formData: any): { isValid: boolean; errors: Record<string, string> } => {
  const errors: Record<string, string> = {}

  if (!formData.email || !formData.email.trim()) {
    errors.email = "Email is required"
  } else if (!/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(formData.email)) {
    errors.email = "Invalid email format"
  }

  if (!formData.communityName || !formData.communityName.trim()) {
    errors.communityName = "Community name is required"
  } else if (formData.communityName.length < 3) {
    errors.communityName = "Community name must be at least 3 characters"
  } else if (formData.communityName.length > 50) {
    errors.communityName = "Community name must be at most 50 characters"
  }

  if (!formData.communityUsername || !formData.communityUsername.trim()) {
    errors.communityUsername = "Community username is required"
  } else if (formData.communityUsername.length < 4) {
    errors.communityUsername = "Username must be at least 4 characters"
  } else if (!/^[a-zA-Z0-9_]+$/.test(formData.communityUsername)) {
    errors.communityUsername = "Username can only contain letters, numbers, and underscores"
  }

  if (formData.ethWallet && formData.ethWallet.trim() && !validateWalletAddress(formData.ethWallet)) {
    errors.ethWallet = "Invalid Ethereum wallet address"
  }

  if (formData.description && formData.description.length > 0 && formData.description.length < 50) {
    errors.description = "Description must be at least 50 characters"
  } else if (formData.description && formData.description.length > 500) {
    errors.description = "Description must be at most 500 characters"
  }

  if (formData.whyChooseUs && formData.whyChooseUs.length > 0 && formData.whyChooseUs.length < 30) {
    errors.whyChooseUs = "This field must be at least 30 characters"
  } else if (formData.whyChooseUs && formData.whyChooseUs.length > 300) {
    errors.whyChooseUs = "This field must be at most 300 characters"
  }

  return {
    isValid: Object.keys(errors).length === 0,
    errors
  }
}