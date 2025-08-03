export const refreshToken = async (): Promise<boolean> => {
  try {
    const response = await fetch(`${process.env.NEXT_PUBLIC_API_URL}/api/users/refresh-access-token`, {
      method: "POST",
      credentials: "include",
    })
    if (response.ok) {
      return true
    }
  } catch (error) {
    console.error("Token refresh failed:", error)
  }
  return false
}
