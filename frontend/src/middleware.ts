import { NextResponse } from "next/server"
import type { NextRequest } from "next/server"
import { apiService } from "@/lib/api" // Assuming apiService can be used server-side or has a server-side equivalent

// Define paths that are considered authentication routes
const AUTH_ROUTES = [
  "/user/login",
  "/user/register",
  "/user/forgot-password",
  "/user/verify-otp",
  "/user/reset-password",
]

// Define paths that require authentication
const PROTECTED_ROUTES = ["/profile", "/dashboard", "/market", "/swap", "/bridge", "/buy", "/sell", "/nft", "/community", "/quests"] // Add all routes that should be protected

export async function middleware(request: NextRequest) {
  const { pathname } = request.nextUrl
  let isAuthenticated = false

  // Attempt to verify session using a server-side check (e.g., refresh token)
  // In a real application, this would involve checking an HTTP-only cookie
  // and validating it with your backend.
  try {
    // This is a simplified check. In a real scenario, you'd have a server-side
    // function that reads the session cookie and validates it.
    // For Next.js, we'll simulate by checking if a session cookie exists.
    const sessionCookie = request.cookies.get("session") // Replace "session" with your actual session cookie name
    if (sessionCookie) {
      // You might want to call a backend endpoint to validate the session cookie
      // For this example, we'll assume the presence of the cookie implies authentication
      // A more robust solution would involve a server-side API call to validate the session.
      // const response = await apiService.checkSessionServerSide(sessionCookie.value);
      // isAuthenticated = response.success;
      isAuthenticated = true // Simplified: assume cookie presence means authenticated
    }
  } catch (error) {
    console.error("Middleware auth check failed:", error)
    isAuthenticated = false
  }

  // Redirect authenticated users away from auth pages
  if (isAuthenticated && AUTH_ROUTES.includes(pathname)) {
    return NextResponse.redirect(new URL("/", request.url))
  }

  // Redirect unauthenticated users from protected routes to login
  if (!isAuthenticated && PROTECTED_ROUTES.some((route) => pathname.startsWith(route))) {
    return NextResponse.redirect(new URL("/user/login", request.url))
  }

  // Special handling for verify-otp and reset-password
  // These pages should only be accessible if a flow was initiated (e.g., registration or forgot password)
  // This is primarily handled client-side by checking sessionStorage, but middleware can add a layer.
  // For instance, if you had a temporary server-side token for these flows.
  // For now, the client-side logic in the pages themselves will manage this.

  return NextResponse.next()
}

export const config = {
  matcher: [
    /*
     * Match all request paths except for the ones starting with:
     * - _next/static (static files)
     * - _next/image (image optimization files)
     * - favicon.ico (favicon file)
     * - api (API routes, which handle their own auth)
     * - public (public assets)
     */
    "/((?!api|_next/static|_next/image|favicon.ico|public).*)",
  ],
}
