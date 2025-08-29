"use client"
import Link from "next/link"
import { RegisterForm } from "@/components/auth/register-form"
import { PreventLoggedIn } from "@/redirects/userRedirects"

export default function RegisterPage() {
  return (
    <PreventLoggedIn>
      <div className="min-h-screen bg-gradient-to-br from-gray-900 via-black to-gray-800 flex items-center justify-center p-4 relative overflow-hidden">
        {/* Animated Background Effects */}
        <div className="absolute inset-0 bg-[radial-gradient(circle_at_center,_rgba(59,130,246,0.2)_0%,_transparent_70%)] animate-pulse"></div>
        <div className="absolute top-10 left-10 w-72 h-72 bg-blue-500/10 rounded-full blur-3xl animate-spin-slow"></div>
        <div className="absolute bottom-10 right-10 w-72 h-72 bg-green-500/10 rounded-full blur-3xl animate-spin-slow"></div>
        <div className="relative w-full max-w-lg">
          {/* Logo and Branding */}
          <div className="text-center mb-10">
            <Link
              href="/"
              className="text-4xl font-extrabold bg-gradient-to-r from-blue-400 via-green-400 to-purple-400 bg-clip-text text-transparent animate-text-glow"
            >
              ChainVerse
            </Link>
            <p className="text-gray-300 mt-3 text-lg font-medium">Trade the Future of Finance</p>
          </div>
          <RegisterForm />
        </div>
      </div>
    </PreventLoggedIn>
  )
}