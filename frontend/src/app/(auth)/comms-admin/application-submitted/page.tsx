"use client"

import { useRouter } from 'next/navigation'
import { Button } from "@/components/ui/button"
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"
import { CheckCircle, Clock, Mail, Home, ArrowRight } from 'lucide-react'

export default function ApplicationSubmitted() {
  const router = useRouter()

  return (
    <div className="min-h-screen bg-black relative overflow-hidden">
      {/* Animated Background */}
      <div className="absolute inset-0">
        <div className="absolute inset-0 bg-gradient-to-br from-black via-green-950/20 to-black" />
        <div className="absolute top-1/4 left-1/4 w-96 h-96 bg-gradient-to-r from-green-600/10 to-green-800/10 rounded-full blur-3xl animate-pulse" />
        <div className="absolute bottom-1/4 right-1/4 w-64 h-64 bg-gradient-to-r from-green-500/5 to-green-700/5 rounded-full blur-3xl animate-pulse delay-1000" />
      </div>

      {/* Back Button */}
      <div className="absolute top-6 left-6 z-50">
        <Button
          onClick={() => router.push('/')}
          variant="ghost"
          className="text-green-400 hover:text-green-300 hover:bg-green-950/30 border border-green-800/30 backdrop-blur-sm"
        >
          <Home className="h-4 w-4 mr-2" />
          Home
        </Button>
      </div>

      {/* Main Content */}
      <div className="relative z-10 min-h-screen flex items-center justify-center px-4">
        <Card className="w-full max-w-lg bg-black/80 backdrop-blur-xl border-green-800/30 shadow-2xl shadow-green-900/20">
          <CardHeader className="text-center space-y-6 pb-8">
            <div className="flex justify-center">
              <div className="w-20 h-20 bg-gradient-to-r from-green-600 to-green-800 rounded-full flex items-center justify-center animate-pulse">
                <CheckCircle className="h-10 w-10 text-white" />
              </div>
            </div>
            <CardTitle className="text-3xl font-bold bg-gradient-to-r from-green-400 to-green-600 bg-clip-text text-transparent">
              Application Submitted!
            </CardTitle>
          </CardHeader>
          <CardContent className="space-y-6 text-center">
            <div className="space-y-4">
              <div className="bg-green-950/30 border border-green-800/30 rounded-lg p-6 space-y-4">
                <div className="flex items-center justify-center gap-3">
                  <Clock className="h-5 w-5 text-green-400" />
                  <span className="text-green-400 font-semibold">Under Review</span>
                </div>
                <p className="text-gray-300 leading-relaxed">
                  Thank you for applying to create a community on ChainVerse! 
                  Your application is now under review by our admin team.
                </p>
              </div>

              <div className="bg-blue-950/30 border border-blue-800/30 rounded-lg p-6 space-y-4">
                <div className="flex items-center justify-center gap-3">
                  <Mail className="h-5 w-5 text-blue-400" />
                  <span className="text-blue-400 font-semibold">Email Notification</span>
                </div>
                <p className="text-gray-300 leading-relaxed">
                  We'll notify you via email within <span className="text-blue-400 font-semibold">48 hours</span> 
                  regarding the status of your application - whether it's approved or if we need additional information.
                </p>
              </div>

              <div className="bg-purple-950/30 border border-purple-800/30 rounded-lg p-4">
                <p className="text-gray-300 text-sm">
                  <span className="text-purple-400 font-semibold">What's next?</span><br />
                  Once approved, you'll be able to access your community admin dashboard and start building your Web3 community.
                </p>
              </div>
            </div>

            <div className="pt-6 space-y-4">
              <Button
                onClick={() => router.push('/comms-admin/login')}
                className="w-full bg-gradient-to-r from-green-600 to-green-700 hover:from-green-500 hover:to-green-600 text-white py-3 font-semibold rounded-xl shadow-lg shadow-green-900/30 hover:shadow-green-800/40 transition-all duration-300"
              >
                Go to Login
                <ArrowRight className="h-4 w-4 ml-2" />
              </Button>
              
              <Button
                onClick={() => router.push('/')}
                variant="outline"
                className="w-full border-green-600/50 text-green-400 hover:text-green-300 hover:border-green-500 hover:bg-green-950/30 backdrop-blur-sm"
              >
                Back to Home
              </Button>
            </div>
          </CardContent>
        </Card>
      </div>
    </div>
  )
}