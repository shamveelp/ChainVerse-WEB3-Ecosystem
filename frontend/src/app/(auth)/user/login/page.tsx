import Link from "next/link"
import { LoginForm } from "@/components/auth/login-form"
import { PreventLoggedIn } from "@/redirects/userRedirects"
import { COMMON_ROUTES } from "@/routes"

export default function LoginPage() {
  return (
    <PreventLoggedIn>
      <div className="min-h-screen bg-gradient-to-br from-slate-900 via-blue-900 to-slate-900 flex items-center justify-center p-4">
        {/* Background Effects */}
        <div className="absolute inset-0 bg-gradient-to-r from-blue-600/10 to-purple-600/10 blur-3xl"></div>
        <div className="absolute top-1/4 left-1/4 w-96 h-96 bg-blue-500/5 rounded-full blur-3xl"></div>
        <div className="absolute bottom-1/4 right-1/4 w-96 h-96 bg-purple-500/5 rounded-full blur-3xl"></div>
        <div className="relative w-full max-w-md">
          {/* Logo */}
          <div className="text-center mb-8">
            <Link
              href={COMMON_ROUTES.HOME}
              className="text-3xl font-bold bg-gradient-to-r from-blue-400 to-purple-400 bg-clip-text text-transparent"
            >
              ChainVerse
            </Link>
            <p className="text-gray-400 mt-2">Welcome back to Web3</p>
          </div>
          <LoginForm />
        </div>
      </div>
    </PreventLoggedIn>
  )
}