import { ForgotPasswordForm } from "@/components/auth/forgot-password-form"
import { PreventLoggedIn } from "@/redirects/userRedirects"

export default function ForgotPasswordPage() {
  return (
    <PreventLoggedIn>
      <div className="min-h-screen bg-gradient-to-br from-slate-900 via-blue-900 to-slate-900 flex items-center justify-center p-4">
        {/* Background Effects */}
        <div className="absolute inset-0 bg-gradient-to-r from-blue-600/10 to-purple-600/10 blur-3xl"></div>
        <div className="absolute top-1/4 left-1/4 w-96 h-96 bg-blue-500/5 rounded-full blur-3xl"></div>
        <div className="absolute bottom-1/4 right-1/4 w-96 h-96 bg-purple-500/5 rounded-full blur-3xl"></div>
        <ForgotPasswordForm />
      </div>
    </PreventLoggedIn>
  )
}
