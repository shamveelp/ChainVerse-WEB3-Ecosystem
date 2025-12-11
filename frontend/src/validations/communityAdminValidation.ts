interface FormData {
  email: string
  communityName: string
  username: string
  walletAddress: string
  description: string
  category: string
  whyChooseUs: string
  rules: string[]
  socialLinks: {
    twitter: string
    discord: string
    telegram: string
    website: string
  }
  logo: File | null
  banner: File | null
}

interface ValidationResult {
  isValid: boolean
  errors?: Record<string, string>
}

export function validateCommunityForm(formData: FormData): ValidationResult {
  const errors: Record<string, string> = {}

  // Email validation
  if (!formData.email || !formData.email.trim()) {
    errors.email = 'Email is required'
  } else if (!/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(formData.email.trim())) {
    errors.email = 'Please provide a valid email address'
  }

  // Community name validation
  if (!formData.communityName || !formData.communityName.trim()) {
    errors.communityName = 'Community name is required'
  } else if (formData.communityName.trim().length < 3) {
    errors.communityName = 'Community name must be at least 3 characters long'
  } else if (formData.communityName.trim().length > 50) {
    errors.communityName = 'Community name must be at most 50 characters long'
  }

  // Username validation
  if (!formData.username || !formData.username.trim()) {
    errors.username = 'Username is required'
  } else {
    const username = formData.username.trim()
    if (username.length < 4) {
      errors.username = 'Username must be at least 4 characters long'
    } else if (username.length > 20) {
      errors.username = 'Username must be at most 20 characters long'
    } else if (!/^[a-zA-Z0-9_]+$/.test(username)) {
      errors.username = 'Username can only contain letters, numbers, and underscores'
    }
  }

  // Wallet address validation
  if (!formData.walletAddress || !formData.walletAddress.trim()) {
    errors.walletAddress = 'Wallet address is required'
  } else if (!/^0x[a-fA-F0-9]{40}$/.test(formData.walletAddress.trim())) {
    errors.walletAddress = 'Please provide a valid Ethereum wallet address'
  }

  // Description validation
  if (!formData.description || !formData.description.trim()) {
    errors.description = 'Description is required'
  } else {
    const description = formData.description.trim()
    if (description.length < 50) {
      errors.description = 'Description must be at least 50 characters long'
    } else if (description.length > 500) {
      errors.description = 'Description must be at most 500 characters long'
    }
  }

  // Category validation
  if (!formData.category || !formData.category.trim()) {
    errors.category = 'Category is required'
  }

  // Why choose us validation
  if (!formData.whyChooseUs || !formData.whyChooseUs.trim()) {
    errors.whyChooseUs = 'Why choose us section is required'
  } else {
    const whyChooseUs = formData.whyChooseUs.trim()
    if (whyChooseUs.length < 30) {
      errors.whyChooseUs = 'Why choose us must be at least 30 characters long'
    } else if (whyChooseUs.length > 300) {
      errors.whyChooseUs = 'Why choose us must be at most 300 characters long'
    }
  }

  // Rules validation
  const validRules = formData.rules.filter(rule => rule.trim() !== '')
  if (validRules.length === 0) {
    errors.rules = 'At least one rule is required'
  } else if (validRules.length > 10) {
    errors.rules = 'Maximum 10 rules allowed'
  }

  // Website URL validation (if provided)
  if (formData.socialLinks.website && formData.socialLinks.website.trim() !== '') {
    try {
      const url = formData.socialLinks.website.trim()
      if (!url.startsWith('http://') && !url.startsWith('https://')) {
        // Add protocol if missing
        new URL('https://' + url)
      } else {
        new URL(url)
      }
    } catch {
      errors.website = 'Please provide a valid website URL'
    }
  }

  return {
    isValid: Object.keys(errors).length === 0,
    errors: Object.keys(errors).length > 0 ? errors : undefined
  }
}

// Additional utility functions for real-time validation
export function validateEmail(email: string): string | null {
  if (!email || !email.trim()) return 'Email is required'
  if (!/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(email.trim())) return 'Please provide a valid email address'
  return null
}

export function validateUsername(username: string): string | null {
  if (!username || !username.trim()) return 'Username is required'
  const trimmedUsername = username.trim()
  if (trimmedUsername.length < 4) return 'Username must be at least 4 characters long'
  if (trimmedUsername.length > 20) return 'Username must be at most 20 characters long'
  if (!/^[a-zA-Z0-9_]+$/.test(trimmedUsername)) return 'Username can only contain letters, numbers, and underscores'
  return null
}

export function validateWalletAddress(address: string): string | null {
  if (!address || !address.trim()) return 'Wallet address is required'
  if (!/^0x[a-fA-F0-9]{40}$/.test(address.trim())) return 'Please provide a valid Ethereum wallet address'
  return null
}

export function validateDescription(description: string): string | null {
  if (!description || !description.trim()) return 'Description is required'
  const trimmedDescription = description.trim()
  if (trimmedDescription.length < 50) return 'Description must be at least 50 characters long'
  if (trimmedDescription.length > 500) return 'Description must be at most 500 characters long'
  return null
}

export function validateWhyChooseUs(whyChooseUs: string): string | null {
  if (!whyChooseUs || !whyChooseUs.trim()) return 'Why choose us section is required'
  const trimmedWhyChooseUs = whyChooseUs.trim()
  if (trimmedWhyChooseUs.length < 30) return 'Why choose us must be at least 30 characters long'
  if (trimmedWhyChooseUs.length > 300) return 'Why choose us must be at most 300 characters long'
  return null
}

export function validateWebsiteUrl(url: string): string | null {
  if (!url || url.trim() === '') return null // Optional field

  try {
    const trimmedUrl = url.trim()
    if (!trimmedUrl.startsWith('http://') && !trimmedUrl.startsWith('https://')) {
      // Add protocol if missing for validation
      new URL('https://' + trimmedUrl)
    } else {
      new URL(trimmedUrl)
    }
    return null
  } catch {
    return 'Please provide a valid website URL'
  }
}

export function validatePassword(password: string): { isValid: boolean; error?: string } {
  if (!password || !password.trim()) {
    return { isValid: false, error: 'Password is required' };
  }

  const trimmedPassword = password.trim();

  if (trimmedPassword.length < 8) {
    return { isValid: false, error: 'Password must be at least 8 characters long' };
  }
  if (!/[A-Z]/.test(trimmedPassword)) {
    return { isValid: false, error: 'Password must contain at least one uppercase letter' };
  }
  if (!/[a-z]/.test(trimmedPassword)) {
    return { isValid: false, error: 'Password must contain at least one lowercase letter' };
  }
  if (!/[0-9]/.test(trimmedPassword)) {
    return { isValid: false, error: 'Password must contain at least one number' };
  }
  if (!/[^A-Za-z0-9]/.test(trimmedPassword)) {
    return { isValid: false, error: 'Password must contain at least one special character' };
  }

  return { isValid: true };
}


export function validateOtp(otp: string): { isValid: boolean; error?: string } {
  if (!otp || !otp.trim()) {
    return { isValid: false, error: 'OTP is required' };
  }

  const trimmedOtp = otp.trim();

  if (trimmedOtp.length !== 6) {
    return { isValid: false, error: 'OTP must be exactly 6 digits' };
  }

  if (!/^\d{6}$/.test(trimmedOtp)) {
    return { isValid: false, error: 'OTP must contain only digits' };
  }

  return { isValid: true };
}

export function validatePasswordMatch(password: string, confirmPassword: string): { isValid: boolean; error?: string } {
  if (!confirmPassword || !confirmPassword.trim()) {
    return { isValid: false, error: 'Please confirm your password' };
  }

  if (password !== confirmPassword) {
    return { isValid: false, error: 'Passwords do not match' };
  }

  return { isValid: true };
}