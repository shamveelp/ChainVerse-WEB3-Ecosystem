import Link from "next/link"
import { LoginForm } from "@/components/auth/login-form"
import { PreventLoggedIn } from "@/redirects/userRedirects"
import { COMMON_ROUTES } from "@/routes"

export default function LoginPage() {
  return (
    <PreventLoggedIn>
      <div className="min-h-screen bg-gradient-to-br from-gray-50 via-blue-50 to-gray-50 flex">
        {/* Left Side - Branding & Features */}
        <div className="hidden lg:flex lg:w-1/2 bg-gradient-to-br from-blue-600 via-blue-700 to-indigo-800 p-12 flex-col justify-between relative overflow-hidden">
          {/* Background Pattern */}
          <div className="absolute inset-0 opacity-10">
            <div className="absolute top-0 left-0 w-96 h-96 bg-white rounded-full blur-3xl -translate-x-1/2 -translate-y-1/2"></div>
            <div className="absolute bottom-0 right-0 w-96 h-96 bg-white rounded-full blur-3xl translate-x-1/2 translate-y-1/2"></div>
          </div>

          {/* Content */}
          <div className="relative z-10">
            <Link
              href={COMMON_ROUTES.HOME}
              className="inline-flex items-center gap-2 text-white"
            >
              <div className="w-10 h-10 bg-white/10 backdrop-blur-sm rounded-xl flex items-center justify-center border border-white/20">
                <span className="text-2xl font-bold">C</span>
              </div>
              <span className="text-2xl font-bold">ChainVerse</span>
            </Link>
          </div>

          <div className="relative z-10 space-y-8">
            <div>
              <h1 className="text-5xl font-bold text-white leading-tight mb-4">
                The Future of<br />Web3 Trading
              </h1>
              <p className="text-blue-100 text-lg leading-relaxed">
                Join thousands of traders and investors building the future of decentralized finance.
              </p>
            </div>

            {/* Feature List */}
            <div className="space-y-4">
              <div className="flex items-start gap-3">
                <div className="w-6 h-6 bg-white/10 backdrop-blur-sm rounded-lg flex items-center justify-center border border-white/20 mt-0.5">
                  <svg className="w-4 h-4 text-white" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M5 13l4 4L19 7" />
                  </svg>
                </div>
                <div>
                  <h3 className="text-white font-semibold">Secure & Transparent</h3>
                  <p className="text-blue-100 text-sm">Bank-grade security with blockchain verification</p>
                </div>
              </div>

              <div className="flex items-start gap-3">
                <div className="w-6 h-6 bg-white/10 backdrop-blur-sm rounded-lg flex items-center justify-center border border-white/20 mt-0.5">
                  <svg className="w-4 h-4 text-white" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M5 13l4 4L19 7" />
                  </svg>
                </div>
                <div>
                  <h3 className="text-white font-semibold">Real-time Analytics</h3>
                  <p className="text-blue-100 text-sm">Advanced trading tools and market insights</p>
                </div>
              </div>

              <div className="flex items-start gap-3">
                <div className="w-6 h-6 bg-white/10 backdrop-blur-sm rounded-lg flex items-center justify-center border border-white/20 mt-0.5">
                  <svg className="w-4 h-4 text-white" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M5 13l4 4L19 7" />
                  </svg>
                </div>
                <div>
                  <h3 className="text-white font-semibold">Community Driven</h3>
                  <p className="text-blue-100 text-sm">Connect with traders worldwide</p>
                </div>
              </div>
            </div>
          </div>

          {/* Footer */}
          <div className="relative z-10 flex items-center gap-6 text-blue-100 text-sm">
            <Link href="#" className="hover:text-white transition-colors">Privacy Policy</Link>
            <Link href="#" className="hover:text-white transition-colors">Terms of Service</Link>
            <Link href="#" className="hover:text-white transition-colors">Help Center</Link>
          </div>
        </div>

        {/* Right Side - Login Form */}
        <div className="w-full lg:w-1/2 flex items-center justify-center p-8">
          <div className="w-full max-w-md">
            {/* Mobile Logo */}
            <div className="lg:hidden text-center mb-8">
              <Link
                href={COMMON_ROUTES.HOME}
                className="inline-flex items-center gap-2 text-gray-900"
              >
                <div className="w-10 h-10 bg-blue-600 rounded-xl flex items-center justify-center">
                  <span className="text-xl font-bold text-white">C</span>
                </div>
                <span className="text-2xl font-bold">ChainVerse</span>
              </Link>
              <p className="text-gray-600 mt-2">Welcome back to Web3</p>
            </div>

            <LoginForm />

            {/* Mobile Footer */}
            <div className="lg:hidden mt-8 flex flex-wrap justify-center gap-4 text-gray-600 text-sm">
              <Link href="#" className="hover:text-gray-900 transition-colors">Privacy</Link>
              <span>•</span>
              <Link href="#" className="hover:text-gray-900 transition-colors">Terms</Link>
              <span>•</span>
              <Link href="#" className="hover:text-gray-900 transition-colors">Help</Link>
            </div>
          </div>
        </div>
      </div>
    </PreventLoggedIn>
  )
}