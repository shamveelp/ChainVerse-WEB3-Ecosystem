// "use client"

// import { GoogleOAuthProvider } from "@react-oauth/google"
// import { useEffect, type ReactNode } from "react"
// import { useAuthStore } from "@/stores/user-auth-store"

// export function Providers({ children }: { children: ReactNode }) {
//   const initializeAuth = useAuthStore((state) => state.initializeAuth)

//   useEffect(() => {
//     initializeAuth()
//   }, [initializeAuth])

//   return <GoogleOAuthProvider clientId={process.env.NEXT_PUBLIC_GOOGLE_CLIENT_ID || ""}>{children}</GoogleOAuthProvider>
// }
