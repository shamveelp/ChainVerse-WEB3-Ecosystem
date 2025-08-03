export const jwtConfig = {
  accessTokenSecret: process.env.JWT_ACCESS_SECRET || "your-access-secret-key",
  refreshTokenSecret: process.env.JWT_REFRESH_SECRET || "your-refresh-secret-key",
  accessTokenExpiry: "15m",
  refreshTokenExpiry: "7d",
}
