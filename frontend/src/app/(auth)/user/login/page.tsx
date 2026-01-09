"use client"
import Link from "next/link"
import { LoginForm } from "@/components/auth/login-form"
import { PreventLoggedIn } from "@/redirects/userRedirects"
import { COMMON_ROUTES } from "@/routes"
import { AuthVisuals } from "@/components/auth/auth-visuals"

export default function LoginPage() {
  return (
    <PreventLoggedIn>
      <div className="flex h-screen w-screen overflow-hidden bg-[#0a0a0f] text-white selection:bg-cyan-500/30 selection:text-cyan-200">
        {/* Left Side - Visuals */}
        <AuthVisuals />

        {/* Right Side - Login Form */}
        <div className="w-full lg:w-1/2 flex items-center justify-center p-6 relative z-10 bg-[#0a0a0f]">
          {/* Mobile Background Ambience */}
          <div className="lg:hidden absolute inset-0 overflow-hidden pointer-events-none">
            <div className="absolute top-[-20%] left-[-20%] w-[80vw] h-[80vw] bg-purple-600/10 rounded-full blur-[80px]" />
            <div className="absolute bottom-[-20%] right-[-20%] w-[80vw] h-[80vw] bg-cyan-600/10 rounded-full blur-[80px]" />
          </div>

          <div className="w-full max-w-md relative z-20">
            {/* Mobile Header */}
            <div className="lg:hidden text-center mb-10">
              <Link
                href={COMMON_ROUTES.HOME}
                className="inline-flex items-center gap-2 mb-4"
              >
                <div className="w-10 h-10 rounded-xl bg-gradient-to-tr from-cyan-500 to-blue-600 p-[1px]">
                  <div className="w-full h-full rounded-xl bg-black flex items-center justify-center">
                    <span className="text-xl font-bold text-white">C</span>
                  </div>
                </div>
                <span className="text-2xl font-bold text-white tracking-tight">ChainVerse</span>
              </Link>
            </div>

            <LoginForm />

            {/* Footer Links */}
            <div className="mt-8 flex justify-center items-center gap-6 text-sm text-gray-500">
              <Link href="#" className="hover:text-cyan-400 transition-colors">Privacy</Link>
              <span className="w-1 h-1 rounded-full bg-gray-700"></span>
              <Link href="#" className="hover:text-cyan-400 transition-colors">Terms</Link>
              <span className="w-1 h-1 rounded-full bg-gray-700"></span>
              <Link href="#" className="hover:text-cyan-400 transition-colors">Help</Link>
            </div>
          </div>
        </div>
      </div>
    </PreventLoggedIn>
  )
}
