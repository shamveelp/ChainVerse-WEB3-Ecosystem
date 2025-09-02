interface ValidationResult {
  isValid: boolean
  error?: string
  errors?: Record<string, string>
}

interface CommunityFormData {
  email: string
  communityName: string
  communityUsername: string
  ethWallet: string
  description: string
  category: string
  whyChooseUs: string
  communityRules: string[]
  socialHandlers: {
    twitter: string
    discord: string
    telegram: string
    website: string
  }
  logo: File | null
  banner: File | null
}

export const validateEmail = (email: string): ValidationResult => {
  if (!email) {
    return { isValid: false, error: "Email is required" }
  }
  
  const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/
  if (!emailRegex.test(email)) {
    return { isValid: false, error: "Invalid email format" }
  }
  
  return { isValid: true }
}

export const validatePassword = (password: string): ValidationResult => {
  if (!password) {
    return { isValid: false, error: "Password is required" }
  }
  
  if (password.length < 8) {
    return { isValid: false, error: "Password must be at least 8 characters long" }
  }
  
  if (!/(?=.*[a-z])/.test(password)) {
    return { isValid: false, error: "Password must contain at least one lowercase letter" }
  }
  
  if (!/(?=.*[A-Z])/.test(password)) {
    return { isValid: false, error: "Password must contain at least one uppercase letter" }
  }
  
  if (!/(?=.*\d)/.test(password)) {
    return { isValid: false, error: "Password must contain at least one number" }
  }
  
  if (!/(?=.*[@$!%*?&])/.test(password)) {
    return { isValid: false, error: "Password must contain at least one special character (@$!%*?&)" }
  }
  
  return { isValid: true }
}

export const validateCommunityName = (name: string): ValidationResult => {
  if (!name) {
    return { isValid: false, error: "Community name is required" }
  }
  
  if (name.length < 3) {
    return { isValid: false, error: "Community name must be at least 3 characters long" }
  }
  
  if (name.length > 50) {
    return { isValid: false, error: "Community name must be at most 50 characters long" }
  }
  
  return { isValid: true }
}

export const validateUsername = (username: string): ValidationResult => {
  if (!username) {
    return { isValid: false, error: "Username is required" }
  }
  
  if (username.length < 4) {
    return { isValid: false, error: "Username must be at least 4 characters long" }
  }
  
  if (username.length > 20) {
    return { isValid: false, error: "Username must be at most 20 characters long" }
  }
  
  if (!/^[a-zA-Z0-9_]+$/.test(username)) {
    return { isValid: false, error: "Username can only contain letters, numbers, and underscores" }
  }
  
  return { isValid: true }
}

export const validateWalletAddress = (address: string): ValidationResult => {
  if (!address) {
    return { isValid: false, error: "Wallet address is required" }
  }
  
  if (!/^0x[a-fA-F0-9]{40}$/.test(address)) {
    return { isValid: false, error: "Invalid Ethereum wallet address format" }
  }
  
  return { isValid: true }
}

export const validateDescription = (description: string): ValidationResult => {
  if (!description) {
    return { isValid: false, error: "Description is required" }
  }
  
  if (description.length < 50) {
    return { isValid: false, error: "Description must be at least 50 characters long" }
  }
  
  if (description.length > 500) {
    return { isValid: false, error: "Description must be at most 500 characters long" }
  }
  
  return { isValid: true }
}

export const validateWhyChooseUs = (text: string): ValidationResult => {
  if (!text) {
    return { isValid: false, error: "This field is required" }
  }
  
  if (text.length < 30) {
    return { isValid: false, error: "Must be at least 30 characters long" }
  }
  
  if (text.length > 300) {
    return { isValid: false, error: "Must be at most 300 characters long" }
  }
  
  return { isValid: true }
}

export const validateUrl = (url: string): ValidationResult => {
  if (!url) return { isValid: true } // Optional field
  
  try {
    new URL(url)
    return { isValid: true }
  } catch {
    return { isValid: false, error: "Invalid URL format" }
  }
}

export const validateCommunityForm = (formData: CommunityFormData): ValidationResult => {
  const errors: Record<string, string> = {}
  
  // Email validation
  const emailValidation = validateEmail(formData.email)
  if (!emailValidation.isValid) {
    errors.email = emailValidation.error!
  }
  
  // Community name validation
  const nameValidation = validateCommunityName(formData.communityName)
  if (!nameValidation.isValid) {
    errors.communityName = nameValidation.error!
  }
  
  // Username validation
  const usernameValidation = validateUsername(formData.communityUsername)
  if (!usernameValidation.isValid) {
    errors.communityUsername = usernameValidation.error!
  }
  
  // Wallet address validation
  const walletValidation = validateWalletAddress(formData.ethWallet)
  if (!walletValidation.isValid) {
    errors.ethWallet = walletValidation.error!
  }
  
  // Description validation
  const descValidation = validateDescription(formData.description)
  if (!descValidation.isValid) {
    errors.description = descValidation.error!
  }
  
  // Category validation
  if (!formData.category) {
    errors.category = "Category is required"
  }
  
  // Why choose us validation
  const whyValidation = validateWhyChooseUs(formData.whyChooseUs)
  if (!whyValidation.isValid) {
    errors.whyChooseUs = whyValidation.error!
  }
  
  // Social links validation (optional but validate format if provided)
  if (formData.socialHandlers.website) {
    const websiteValidation = validateUrl(formData.socialHandlers.website)
    if (!websiteValidation.isValid) {
      errors.website = websiteValidation.error!
    }
  }
  
  // Rules validation (at least one non-empty rule)
  const validRules = formData.communityRules.filter(rule => rule.trim() !== '')
  if (validRules.length === 0) {
    errors.communityRules = "At least one community rule is required"
  }
  
  return {
    isValid: Object.keys(errors).length === 0,
    errors: Object.keys(errors).length > 0 ? errors : undefined
  }
}

export const validateLoginForm = (email: string, password: string): ValidationResult => {
  const errors: Record<string, string> = {}
  
  const emailValidation = validateEmail(email)
  if (!emailValidation.isValid) {
    errors.email = emailValidation.error!
  }
  
  if (!password) {
    errors.password = "Password is required"
  }
  
  return {
    isValid: Object.keys(errors).length === 0,
    errors: Object.keys(errors).length > 0 ? errors : undefined
  }
}

export const validateOtp = (otp: string): ValidationResult => {
  if (!otp) {
    return { isValid: false, error: "OTP is required" }
  }
  
  if (otp.length !== 6) {
    return { isValid: false, error: "OTP must be exactly 6 digits" }
  }
  
  if (!/^\d{6}$/.test(otp)) {
    return { isValid: false, error: "OTP must contain only numbers" }
  }
  
  return { isValid: true }
}

export const validatePasswordMatch = (password: string, confirmPassword: string): ValidationResult => {
  if (password !== confirmPassword) {
    return { isValid: false, error: "Passwords do not match" }
  }
  
  return { isValid: true }
}