export interface LoginData {
  email: string
  password: string
}

export interface RegisterData {
  username: string
  email: string
  password: string
  confirmPassword: string
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

export const validateRegisterForm = (formData: RegisterData, agreeTerms: boolean): Partial<RegisterData> => {
  const errors: Partial<RegisterData> = {}

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
  } else if (!/^(?=.*[a-z])(?=.*[A-Z])(?=.*\d)(?=.*[@$!%*?&])[A-Za-z\d@$!%*?&]{8,}$/.test(formData.password)) {
    errors.password =
      "Password must contain at least one uppercase letter, one lowercase letter, one number, one special character, and be at least 8 characters long"
  }

  if (formData.password !== formData.confirmPassword) {
    errors.confirmPassword = "Passwords do not match"
  }

  if (!agreeTerms) {
    // note: TypeScript may complain since `agreeTerms` is not part of `RegisterData`
    // you can fix this by extending the interface or using a separate type for validation
    ;(errors as any).agreeTerms = "You must agree to the terms and conditions"
  }

  return errors
}
