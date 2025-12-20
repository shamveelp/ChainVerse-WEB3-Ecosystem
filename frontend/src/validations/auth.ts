export interface LoginData {
  email: string
  password: string
}

export interface RegisterData {
  name: string
  username: string
  email: string
  password: string
  confirmPassword: string
  referralCode?: string
}

type RegisterErrors = Partial<RegisterData> & {
  agreeTerms?: string
}


export const validateLoginForm = (formData: LoginData): Partial<LoginData> => {
  const errors: Partial<LoginData> = {}

  if (!formData.email.trim()) {
    errors.email = "Email is required"
  } else if (!/^[\w-.]+@([\w-]+\.)+[\w-]{2,4}$/.test(formData.email)) {
    errors.email = "Invalid email format"
  }

  if (!formData.password) {
    errors.password = "Password is required"
  }

  return errors
}

export const validateRegisterForm = (
  formData: RegisterData,
  agreeTerms: boolean
): RegisterErrors => {
  const errors: RegisterErrors = {}

  if (!formData.name.trim()) {
    errors.name = "Name is required"
  } else if (formData.name.length < 2) {
    errors.name = "Name must be at least 2 characters long"
  }

  if (!formData.username.trim()) {
    errors.username = "Username is required"
  } else if (formData.username.length < 4) {
    errors.username = "Username must be at least 4 characters long"
  } else if (!/^[a-zA-Z0-9_]+$/.test(formData.username)) {
    errors.username = "Username can only contain letters, numbers, and underscores"
  }

  if (!formData.email.trim()) {
    errors.email = "Email is required"
  } else if (!/^[\w-.]+@([\w-]+\.)+[\w-]{2,4}$/.test(formData.email)) {
    errors.email = "Invalid email format"
  }

  if (!formData.password) {
    errors.password = "Password is required"
  } else if (
    !/^(?=.*[a-z])(?=.*[A-Z])(?=.*\d)(?=.*[@$!%*?&])[A-Za-z\d@$!%*?&]{8,}$/.test(
      formData.password
    )
  ) {
    errors.password =
      "Password must contain at least one uppercase letter, one lowercase letter, one number, one special character, and be at least 8 characters long"
  }

  if (formData.password !== formData.confirmPassword) {
    errors.confirmPassword = "Passwords do not match"
  }

  if (
    formData.referralCode &&
    formData.referralCode.trim() &&
    !/^[a-zA-Z0-9]{8}$/.test(formData.referralCode)
  ) {
    errors.referralCode =
      "Referral code must be 8 characters long and contain only letters and numbers"
  }

  if (!agreeTerms) {
    errors.agreeTerms = "You must agree to the terms and conditions"
  }

  return errors
}