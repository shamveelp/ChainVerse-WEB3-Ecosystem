"use client"

import { useState, useEffect } from 'react'
import { useRouter } from 'next/navigation'
import { Button } from "@/components/ui/button"
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"
import { CheckCircle, Home, Clock, Mail, Users, Sparkles } from 'lucide-react'

export default function ApplicationSubmittedPage() {
  const router = useRouter()
  const [mounted, setMounted] = useState(false)

  useEffect(() => {
    setMounted(true)
  }, [])

  if (!mounted) {
    return (
      <div className="min-h-screen bg-black flex items-center justify-center">
        <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-red-500"></div>
      </div>
    )
  }

  return (
    <div className="min-h-screen bg-black relative overflow-hidden">
      {/* Animated Background */}
      <div className="absolute inset-0">
        <div className="absolute inset-0 bg-gradient-to-br from-black via-red-950/20 to-black" />
        <div className="absolute top-1/4 left-1/4 w-96 h-96 bg-gradient-to-r from-green-600/10 to-red-800/10 rounded-full blur-3xl animate-pulse" />
        <div className="absolute bottom-1/4 right-1/4 w-64 h-64 bg-gradient-to-r from-red-500/5 to-green-700/5 rounded-full blur-3xl animate-pulse delay-1000" />
        <div className="absolute top-1/2 left-1/2 transform -translate-x-1/2 -translate-y-1/2 w-[600px] h-[600px] bg-gradient-to-r from-green-900/5 to-red-600/5 rounded-full blur-3xl animate-pulse delay-500" />
      </div>

      {/* Floating Success Particles */}
      <div className="absolute inset-0 overflow-hidden">
        {[...Array(15)].map((_, i) => (
          <div
            key={i}
            className="absolute w-2 h-2 bg-green-500/40 rounded-full animate-bounce"
            style={{
              left: `${Math.random() * 100}%`,
              top: `${Math.random() * 100}%`,
              animationDelay: `${Math.random() * 2}s`,
              animationDuration: `${1 + Math.random() * 2}s`
            }}
          />
        ))}
      </div>

      {/* Back Button */}
      <div className="absolute top-6 left-6 z-50">
        <Button
          onClick={() => router.push('/')}
          variant="ghost"
          className="text-red-400 hover:text-red-300 hover:bg-red-950/30 border border-red-800/30 backdrop-blur-sm"
        >
          <Home className="h-4 w-4 mr-2" />
          Home
        </Button>
      </div>

      {/* Main Content */}
      <div className="relative z-10 min-h-screen flex items-center justify-center px-4">
        <Card className="w-full max-w-2xl bg-black/80 backdrop-blur-xl border-green-800/30 shadow-2xl shadow-green-900/20">
          <CardHeader className="text-center space-y-6">
            {/* Success Animation */}
            <div className="flex justify-center">
              <div className="relative">
                <div className="w-24 h-24 bg-gradient-to-r from-green-600 to-green-700 rounded-full flex items-center justify-center animate-pulse">
                  <CheckCircle className="h-12 w-12 text-white" />
                </div>
                <div className="absolute -top-2 -right-2 w-8 h-8 bg-gradient-to-r from-green-400 to-green-600 rounded-full animate-bounce">
                  <Sparkles className="h-6 w-6 text-white m-1" />
                </div>
                {/* Ripple Effect */}
                <div className="absolute inset-0 w-24 h-24 border-4 border-green-400/30 rounded-full animate-ping"></div>
                <div className="absolute inset-0 w-24 h-24 border-2 border-green-400/20 rounded-full animate-ping delay-75"></div>
              </div>
            </div>

            <CardTitle className="text-4xl font-bold bg-gradient-to-r from-green-400 to-green-600 bg-clip-text text-transparent">
              Application Submitted!
            </CardTitle>
            
            <p className="text-xl text-gray-300 max-w-lg mx-auto">
              Congratulations! Your community application has been successfully submitted.
            </p>
          </CardHeader>

          <CardContent className="space-y-8">
            {/* Status Cards */}
            <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
              <div className="bg-green-950/30 border border-green-800/30 rounded-lg p-4 text-center">
                <Users className="h-8 w-8 text-green-400 mx-auto mb-2" />
                <h3 className="font-semibold text-green-400">Application Received</h3>
                <p className="text-sm text-gray-400 mt-1">Your details are being reviewed</p>
              </div>
              
              <div className="bg-orange-950/30 border border-orange-800/30 rounded-lg p-4 text-center">
                <Clock className="h-8 w-8 text-orange-400 mx-auto mb-2" />
                <h3 className="font-semibold text-orange-400">Under Review</h3>
                <p className="text-sm text-gray-400 mt-1">24-48 hours processing time</p>
              </div>
              
              <div className="bg-blue-950/30 border border-blue-800/30 rounded-lg p-4 text-center">
                <Mail className="h-8 w-8 text-blue-400 mx-auto mb-2" />
                <h3 className="font-semibold text-blue-400">Email Notification</h3>
                <p className="text-sm text-gray-400 mt-1">You'll receive updates via email</p>
              </div>
            </div>

            {/* Information Section */}
            <div className="bg-red-950/20 border border-red-800/30 rounded-lg p-6">
              <h3 className="text-xl font-semibold text-white mb-4 flex items-center gap-2">
                <Clock className="h-5 w-5 text-red-400" />
                What happens next?
              </h3>
              <div className="space-y-3 text-gray-300">
                <div className="flex items-start gap-3">
                  <div className="w-2 h-2 bg-red-400 rounded-full mt-2 flex-shrink-0"></div>
                  <p>Our team will review your application within <span className="text-red-400 font-semibold">24-48 hours</span></p>
                </div>
                <div className="flex items-start gap-3">
                  <div className="w-2 h-2 bg-red-400 rounded-full mt-2 flex-shrink-0"></div>
                  <p>You'll receive an email notification with the approval status</p>
                </div>
                <div className="flex items-start gap-3">
                  <div className="w-2 h-2 bg-red-400 rounded-full mt-2 flex-shrink-0"></div>
                  <p>Once approved, you can start building and managing your community</p>
                </div>
                <div className="flex items-start gap-3">
                  <div className="w-2 h-2 bg-red-400 rounded-full mt-2 flex-shrink-0"></div>
                  <p>Access to advanced community tools and analytics dashboard</p>
                </div>
              </div>
            </div>

            {/* Action Button */}
            <div className="text-center pt-4">
              <Button
                onClick={() => router.push('/')}
                className="bg-gradient-to-r from-red-600 to-red-700 hover:from-red-500 hover:to-red-600 text-white px-8 py-3 text-lg font-semibold rounded-xl shadow-lg shadow-red-900/30 hover:shadow-red-800/40 transition-all duration-300 transform hover:scale-105"
              >
                <Home className="h-5 w-5 mr-2" />
                Go to Home
              </Button>
            </div>

            {/* Footer Note */}
            <div className="text-center pt-6 border-t border-red-800/30">
              <p className="text-sm text-gray-400">
                Need help? Contact our support team at{' '}
                <span className="text-red-400 font-semibold">support@chainverse.com</span>
              </p>
            </div>
          </CardContent>
        </Card>
      </div>
    </div>
  )
}
