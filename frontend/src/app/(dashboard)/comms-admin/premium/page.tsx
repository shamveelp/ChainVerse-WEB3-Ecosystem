"use client"

import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"
import { Button } from "@/components/ui/button"
import { Badge } from "@/components/ui/badge"
import { Progress } from "@/components/ui/progress"
import { Crown, Star, Zap, Users, ChartBar as BarChart3, Shield, Sparkles, Check, ArrowRight, TrendingUp, Award } from 'lucide-react'

const premiumFeatures = [
  {
    icon: Crown,
    title: "Advanced Analytics",
    description: "Deep insights into community engagement, member behavior, and growth trends",
    status: "available"
  },
  {
    icon: Zap,
    title: "Custom Branding",
    description: "Fully customize your community appearance with your own branding and themes",
    status: "available"
  },
  {
    icon: Shield,
    title: "Priority Support",
    description: "24/7 dedicated support with faster response times and direct access to our team",
    status: "available"
  },
  {
    icon: BarChart3,
    title: "Advanced Quest Builder",
    description: "Create complex multi-step quests with branching paths and advanced rewards",
    status: "available"
  },
  {
    icon: Users,
    title: "Unlimited Members",
    description: "Remove member limits and scale your community without restrictions",
    status: "available"
  },
  {
    icon: Sparkles,
    title: "AI-Powered Moderation",
    description: "Advanced AI tools for automatic content moderation and spam detection",
    status: "coming-soon"
  }
]

const currentPlan = {
  name: "Community Standard",
  price: "Free",
  limits: {
    members: { current: 1247, max: 2000 },
    quests: { current: 28, max: 50 },
    storage: { current: 2.1, max: 5 }, // in GB
    chainCasts: { current: 15, max: 25 }
  }
}

export default function PremiumPage() {
  return (
    <div className="space-y-6">
      {/* Page Header */}
      <div className="text-center space-y-4">
        <div className="flex items-center justify-center">
          <div className="w-16 h-16 bg-gradient-to-r from-yellow-600 to-yellow-800 rounded-full flex items-center justify-center animate-pulse">
            <Crown className="h-8 w-8 text-white" />
          </div>
        </div>
        <h1 className="text-4xl font-bold bg-gradient-to-r from-yellow-400 to-yellow-600 bg-clip-text text-transparent">
          Upgrade to Premium
        </h1>
        <p className="text-gray-400 text-lg max-w-2xl mx-auto">
          Unlock powerful features to grow and manage your community like a pro. 
          Scale without limits and access advanced tools.
        </p>
      </div>

      {/* Current Plan Status */}
      <Card className="bg-black/60 backdrop-blur-xl border-red-800/30">
        <CardHeader>
          <div className="flex items-center justify-between">
            <CardTitle className="text-xl font-semibold text-white">Current Plan</CardTitle>
            <Badge variant="outline" className="border-gray-600 text-gray-400">
              {currentPlan.name}
            </Badge>
          </div>
        </CardHeader>
        <CardContent>
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
            <div className="space-y-2">
              <div className="flex items-center justify-between text-sm">
                <span className="text-gray-400">Members</span>
                <span className="text-white">{currentPlan.limits.members.current.toLocaleString()}/{currentPlan.limits.members.max.toLocaleString()}</span>
              </div>
              <Progress value={(currentPlan.limits.members.current / currentPlan.limits.members.max) * 100} className="h-2" />
            </div>
            
            <div className="space-y-2">
              <div className="flex items-center justify-between text-sm">
                <span className="text-gray-400">Quests</span>
                <span className="text-white">{currentPlan.limits.quests.current}/{currentPlan.limits.quests.max}</span>
              </div>
              <Progress value={(currentPlan.limits.quests.current / currentPlan.limits.quests.max) * 100} className="h-2" />
            </div>
            
            <div className="space-y-2">
              <div className="flex items-center justify-between text-sm">
                <span className="text-gray-400">Storage</span>
                <span className="text-white">{currentPlan.limits.storage.current}GB/{currentPlan.limits.storage.max}GB</span>
              </div>
              <Progress value={(currentPlan.limits.storage.current / currentPlan.limits.storage.max) * 100} className="h-2" />
            </div>
            
            <div className="space-y-2">
              <div className="flex items-center justify-between text-sm">
                <span className="text-gray-400">ChainCasts</span>
                <span className="text-white">{currentPlan.limits.chainCasts.current}/{currentPlan.limits.chainCasts.max}</span>
              </div>
              <Progress value={(currentPlan.limits.chainCasts.current / currentPlan.limits.chainCasts.max) * 100} className="h-2" />
            </div>
          </div>
        </CardContent>
      </Card>

      {/* Pricing Plans */}
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        {/* Free Plan */}
        <Card className="bg-black/60 backdrop-blur-xl border-red-800/30">
          <CardContent className="p-6">
            <div className="text-center space-y-4">
              <h3 className="text-xl font-bold text-white">Community Standard</h3>
              <div className="space-y-1">
                <div className="text-3xl font-bold text-white">Free</div>
                <p className="text-sm text-gray-400">Forever</p>
              </div>
              <Badge variant="outline" className="border-green-500/30 text-green-400">
                Current Plan
              </Badge>
              
              <div className="space-y-3 text-left">
                <div className="flex items-center gap-2 text-sm">
                  <Check className="h-4 w-4 text-green-400" />
                  <span className="text-gray-300">Up to 2,000 members</span>
                </div>
                <div className="flex items-center gap-2 text-sm">
                  <Check className="h-4 w-4 text-green-400" />
                  <span className="text-gray-300">50 quests per month</span>
                </div>
                <div className="flex items-center gap-2 text-sm">
                  <Check className="h-4 w-4 text-green-400" />
                  <span className="text-gray-300">5GB storage</span>
                </div>
                <div className="flex items-center gap-2 text-sm">
                  <Check className="h-4 w-4 text-green-400" />
                  <span className="text-gray-300">Basic analytics</span>
                </div>
                <div className="flex items-center gap-2 text-sm">
                  <Check className="h-4 w-4 text-green-400" />
                  <span className="text-gray-300">Community support</span>
                </div>
              </div>
              
              <Button variant="outline" disabled className="w-full border-gray-600 text-gray-400">
                Current Plan
              </Button>
            </div>
          </CardContent>
        </Card>

        {/* Pro Plan */}
        <Card className="bg-gradient-to-b from-yellow-950/30 to-black/60 backdrop-blur-xl border-yellow-600/50 relative">
          <div className="absolute -top-3 left-1/2 transform -translate-x-1/2">
            <Badge className="bg-gradient-to-r from-yellow-600 to-yellow-700 text-white px-3 py-1">
              Most Popular
            </Badge>
          </div>
          <CardContent className="p-6">
            <div className="text-center space-y-4">
              <h3 className="text-xl font-bold text-white">Community Pro</h3>
              <div className="space-y-1">
                <div className="text-3xl font-bold bg-gradient-to-r from-yellow-400 to-yellow-600 bg-clip-text text-transparent">
                  $29
                </div>
                <p className="text-sm text-gray-400">per month</p>
              </div>
              
              <div className="space-y-3 text-left">
                <div className="flex items-center gap-2 text-sm">
                  <Check className="h-4 w-4 text-yellow-400" />
                  <span className="text-gray-300">Unlimited members</span>
                </div>
                <div className="flex items-center gap-2 text-sm">
                  <Check className="h-4 w-4 text-yellow-400" />
                  <span className="text-gray-300">Unlimited quests</span>
                </div>
                <div className="flex items-center gap-2 text-sm">
                  <Check className="h-4 w-4 text-yellow-400" />
                  <span className="text-gray-300">100GB storage</span>
                </div>
                <div className="flex items-center gap-2 text-sm">
                  <Check className="h-4 w-4 text-yellow-400" />
                  <span className="text-gray-300">Advanced analytics</span>
                </div>
                <div className="flex items-center gap-2 text-sm">
                  <Check className="h-4 w-4 text-yellow-400" />
                  <span className="text-gray-300">Custom branding</span>
                </div>
                <div className="flex items-center gap-2 text-sm">
                  <Check className="h-4 w-4 text-yellow-400" />
                  <span className="text-gray-300">Priority support</span>
                </div>
              </div>
              
              <Button className="w-full bg-gradient-to-r from-yellow-600 to-yellow-700 hover:from-yellow-500 hover:to-yellow-600 text-white">
                <Crown className="h-4 w-4 mr-2" />
                Upgrade to Pro
              </Button>
            </div>
          </CardContent>
        </Card>

        {/* Enterprise Plan */}
        <Card className="bg-black/60 backdrop-blur-xl border-red-800/30">
          <CardContent className="p-6">
            <div className="text-center space-y-4">
              <h3 className="text-xl font-bold text-white">Enterprise</h3>
              <div className="space-y-1">
                <div className="text-3xl font-bold text-white">Custom</div>
                <p className="text-sm text-gray-400">Contact us</p>
              </div>
              
              <div className="space-y-3 text-left">
                <div className="flex items-center gap-2 text-sm">
                  <Check className="h-4 w-4 text-blue-400" />
                  <span className="text-gray-300">Everything in Pro</span>
                </div>
                <div className="flex items-center gap-2 text-sm">
                  <Check className="h-4 w-4 text-blue-400" />
                  <span className="text-gray-300">Dedicated server</span>
                </div>
                <div className="flex items-center gap-2 text-sm">
                  <Check className="h-4 w-4 text-blue-400" />
                  <span className="text-gray-300">White-label solution</span>
                </div>
                <div className="flex items-center gap-2 text-sm">
                  <Check className="h-4 w-4 text-blue-400" />
                  <span className="text-gray-300">API access</span>
                </div>
                <div className="flex items-center gap-2 text-sm">
                  <Check className="h-4 w-4 text-blue-400" />
                  <span className="text-gray-300">24/7 phone support</span>
                </div>
              </div>
              
              <Button variant="outline" className="w-full border-red-600/50 text-red-400 hover:bg-red-950/30">
                Contact Sales
              </Button>
            </div>
          </CardContent>
        </Card>
      </div>

      {/* Premium Features */}
      <Card className="bg-black/60 backdrop-blur-xl border-red-800/30">
        <CardHeader>
          <CardTitle className="text-xl font-semibold text-white text-center flex items-center justify-center gap-2">
            <Sparkles className="h-5 w-5 text-yellow-400" />
            Premium Features
          </CardTitle>
        </CardHeader>
        <CardContent>
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
            {premiumFeatures.map((feature, index) => (
              <div key={index} className="space-y-3 p-4 rounded-lg hover:bg-red-950/20 transition-colors">
                <div className="flex items-center gap-3">
                  <div className="w-10 h-10 bg-gradient-to-r from-yellow-600/20 to-yellow-800/20 rounded-lg flex items-center justify-center">
                    <feature.icon className="h-5 w-5 text-yellow-400" />
                  </div>
                  <div className="flex-1">
                    <h4 className="font-semibold text-white">{feature.title}</h4>
                    {feature.status === 'coming-soon' && (
                      <Badge variant="outline" className="border-blue-500/30 text-blue-400 text-xs">
                        Coming Soon
                      </Badge>
                    )}
                  </div>
                </div>
                <p className="text-sm text-gray-400">{feature.description}</p>
              </div>
            ))}
          </div>
        </CardContent>
      </Card>

      {/* Success Stories */}
      <Card className="bg-black/60 backdrop-blur-xl border-red-800/30">
        <CardHeader>
          <CardTitle className="text-xl font-semibold text-white text-center flex items-center justify-center gap-2">
            <TrendingUp className="h-5 w-5 text-green-400" />
            Success Stories
          </CardTitle>
        </CardHeader>
        <CardContent>
          <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
            <div className="text-center space-y-2">
              <div className="text-3xl font-bold text-green-400">300%</div>
              <p className="text-gray-400">Average member growth after upgrading</p>
            </div>
            <div className="text-center space-y-2">
              <div className="text-3xl font-bold text-blue-400">85%</div>
              <p className="text-gray-400">Higher engagement with advanced features</p>
            </div>
            <div className="text-center space-y-2">
              <div className="text-3xl font-bold text-yellow-400">24/7</div>
              <p className="text-gray-400">Priority support response time</p>
            </div>
          </div>
        </CardContent>
      </Card>

      {/* CTA Section */}
      <Card className="bg-gradient-to-r from-yellow-950/30 to-red-950/30 backdrop-blur-xl border-yellow-600/30">
        <CardContent className="p-8 text-center">
          <h3 className="text-2xl font-bold text-white mb-4">Ready to supercharge your community?</h3>
          <p className="text-gray-400 mb-6 max-w-2xl mx-auto">
            Join thousands of community leaders who have upgraded to Premium and seen incredible results.
          </p>
          <div className="flex gap-4 justify-center">
            <Button className="bg-gradient-to-r from-yellow-600 to-yellow-700 hover:from-yellow-500 hover:to-yellow-600 text-white">
              <Crown className="h-4 w-4 mr-2" />
              Upgrade Now
            </Button>
            <Button variant="outline" className="border-red-600/50 text-red-400 hover:bg-red-950/30">
              Schedule Demo
              <ArrowRight className="h-4 w-4 ml-2" />
            </Button>
          </div>
        </CardContent>
      </Card>
    </div>
  )
}