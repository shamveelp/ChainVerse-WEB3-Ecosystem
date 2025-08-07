"use client"

import { useState } from 'react'
import { useRouter } from 'next/navigation'
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
import { Textarea } from "@/components/ui/textarea"
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select"
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"
import { Badge } from "@/components/ui/badge"
import { Home, Upload, Plus, Trash2, Users, Sparkles } from 'lucide-react'

export default function CreateCommunityPage() {
  const router = useRouter()
  const [currentStep, setCurrentStep] = useState(1)
  const [formData, setFormData] = useState({
    email: '',
    communityName: '',
    communityUsername: '',
    ethWallet: '',
    description: '',
    category: '',
    whyChooseUs: '',
    communityRules: [''],
    socialHandlers: {
      twitter: '',
      discord: '',
      telegram: '',
      website: ''
    },
    logo: null as File | null,
    banner: null as File | null
  })

  const totalSteps = 10
  const progress = (currentStep / totalSteps) * 100

  const categories = [
    'DeFi', 'GameFi', 'Trading', 'Education', 'NFTs', 'DAOs', 'Layer2', 'Others'
  ]

  const handleNext = () => {
    if (currentStep < totalSteps) {
      setCurrentStep(currentStep + 1)
    }
  }

  const handlePrevious = () => {
    if (currentStep > 1) {
      setCurrentStep(currentStep - 1)
    }
  }

  const handleSubmit = () => {
    router.push('/set-password')
  }

  const addRule = () => {
    setFormData({
      ...formData,
      communityRules: [...formData.communityRules, '']
    })
  }

  const removeRule = (index: number) => {
    const newRules = formData.communityRules.filter((_, i) => i !== index)
    setFormData({
      ...formData,
      communityRules: newRules.length > 0 ? newRules : ['']
    })
  }

  const updateRule = (index: number, value: string) => {
    const newRules = [...formData.communityRules]
    newRules[index] = value
    setFormData({
      ...formData,
      communityRules: newRules
    })
  }

  const renderStep = () => {
    switch (currentStep) {
      case 1:
        return (
          <div className="space-y-4">
            <Label htmlFor="email" className="text-orange-400 font-medium">What's your email?</Label>
            <Input
              id="email"
              type="email"
              value={formData.email}
              onChange={(e) => setFormData({...formData, email: e.target.value})}
              className="bg-red-950/20 border-red-800/30 text-white placeholder:text-gray-500 focus:border-orange-500 focus:ring-orange-500/20"
              placeholder="Enter your email address"
            />
          </div>
        )
      case 2:
        return (
          <div className="space-y-4">
            <Label htmlFor="communityName" className="text-orange-400 font-medium">What's your community name?</Label>
            <Input
              id="communityName"
              value={formData.communityName}
              onChange={(e) => setFormData({...formData, communityName: e.target.value})}
              className="bg-red-950/20 border-red-800/30 text-white placeholder:text-gray-500 focus:border-orange-500 focus:ring-orange-500/20"
              placeholder="Enter community name"
            />
          </div>
        )
      case 3:
        return (
          <div className="space-y-4">
            <Label htmlFor="communityUsername" className="text-orange-400 font-medium">Community Username</Label>
            <Input
              id="communityUsername"
              value={formData.communityUsername}
              onChange={(e) => setFormData({...formData, communityUsername: e.target.value})}
              className="bg-red-950/20 border-red-800/30 text-white placeholder:text-gray-500 focus:border-orange-500 focus:ring-orange-500/20"
              placeholder="@username"
            />
          </div>
        )
      case 4:
        return (
          <div className="space-y-4">
            <Label htmlFor="ethWallet" className="text-orange-400 font-medium">ETH Wallet Address</Label>
            <Input
              id="ethWallet"
              value={formData.ethWallet}
              onChange={(e) => setFormData({...formData, ethWallet: e.target.value})}
              className="bg-red-950/20 border-red-800/30 text-white placeholder:text-gray-500 focus:border-orange-500 focus:ring-orange-500/20"
              placeholder="0x..."
            />
          </div>
        )
      case 5:
        return (
          <div className="space-y-4">
            <Label htmlFor="description" className="text-orange-400 font-medium">Community Description</Label>
            <Textarea
              id="description"
              value={formData.description}
              onChange={(e) => setFormData({...formData, description: e.target.value})}
              className="bg-red-950/20 border-red-800/30 text-white placeholder:text-gray-500 focus:border-orange-500 focus:ring-orange-500/20 min-h-[120px]"
              placeholder="Describe your community..."
            />
          </div>
        )
      case 6:
        return (
          <div className="space-y-4">
            <Label className="text-orange-400 font-medium">Category</Label>
            <Select value={formData.category} onValueChange={(value: any) => setFormData({...formData, category: value})}>
              <SelectTrigger className="bg-red-950/20 border-red-800/30 text-white focus:border-orange-500 focus:ring-orange-500/20">
                <SelectValue placeholder="Select a category" />
              </SelectTrigger>
              <SelectContent className="bg-black border-red-800/30">
                {categories.map((category) => (
                  <SelectItem key={category} value={category} className="text-white hover:bg-red-950/30">
                    {category}
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>
          </div>
        )
      case 7:
        return (
          <div className="space-y-4">
            <Label htmlFor="whyChooseUs" className="text-orange-400 font-medium">Why did you choose us?</Label>
            <Textarea
              id="whyChooseUs"
              value={formData.whyChooseUs}
              onChange={(e) => setFormData({...formData, whyChooseUs: e.target.value})}
              className="bg-red-950/20 border-red-800/30 text-white placeholder:text-gray-500 focus:border-orange-500 focus:ring-orange-500/20 min-h-[120px]"
              placeholder="Tell us why you chose our platform..."
            />
          </div>
        )
      case 8:
        return (
          <div className="space-y-4">
            <div className="flex items-center justify-between">
              <Label className="text-orange-400 font-medium">Community Rules</Label>
              <Button
                type="button"
                onClick={addRule}
                variant="outline"
                size="sm"
                className="border-orange-500/30 text-orange-400 hover:bg-orange-950/30"
              >
                <Plus className="h-4 w-4 mr-1" />
                Add Rule
              </Button>
            </div>
            <div className="space-y-3">
              {formData.communityRules.map((rule, index) => (
                <div key={index} className="flex gap-2">
                  <Input
                    value={rule}
                    onChange={(e) => updateRule(index, e.target.value)}
                    className="bg-red-950/20 border-red-800/30 text-white placeholder:text-gray-500 focus:border-orange-500 focus:ring-orange-500/20"
                    placeholder={`Rule ${index + 1}`}
                  />
                  {formData.communityRules.length > 1 && (
                    <Button
                      type="button"
                      onClick={() => removeRule(index)}
                      variant="outline"
                      size="sm"
                      className="border-red-500/30 text-red-400 hover:bg-red-950/30"
                    >
                      <Trash2 className="h-4 w-4" />
                    </Button>
                  )}
                </div>
              ))}
            </div>
          </div>
        )
      case 9:
        return (
          <div className="space-y-4">
            <Label className="text-orange-400 font-medium">Social Handlers</Label>
            <div className="space-y-3">
              <Input
                value={formData.socialHandlers.twitter}
                onChange={(e) => setFormData({
                  ...formData,
                  socialHandlers: {...formData.socialHandlers, twitter: e.target.value}
                })}
                className="bg-red-950/20 border-red-800/30 text-white placeholder:text-gray-500 focus:border-orange-500 focus:ring-orange-500/20"
                placeholder="Twitter/X handle"
              />
              <Input
                value={formData.socialHandlers.discord}
                onChange={(e) => setFormData({
                  ...formData,
                  socialHandlers: {...formData.socialHandlers, discord: e.target.value}
                })}
                className="bg-red-950/20 border-red-800/30 text-white placeholder:text-gray-500 focus:border-orange-500 focus:ring-orange-500/20"
                placeholder="Discord server"
              />
              <Input
                value={formData.socialHandlers.telegram}
                onChange={(e) => setFormData({
                  ...formData,
                  socialHandlers: {...formData.socialHandlers, telegram: e.target.value}
                })}
                className="bg-red-950/20 border-red-800/30 text-white placeholder:text-gray-500 focus:border-orange-500 focus:ring-orange-500/20"
                placeholder="Telegram group"
              />
              <Input
                value={formData.socialHandlers.website}
                onChange={(e) => setFormData({
                  ...formData,
                  socialHandlers: {...formData.socialHandlers, website: e.target.value}
                })}
                className="bg-red-950/20 border-red-800/30 text-white placeholder:text-gray-500 focus:border-orange-500 focus:ring-orange-500/20"
                placeholder="Website URL"
              />
            </div>
          </div>
        )
      case 10:
        return (
          <div className="space-y-6">
            <div className="space-y-4">
              <Label className="text-orange-400 font-medium">Logo & Banner</Label>
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                <div className="space-y-2">
                  <Label className="text-sm text-gray-400">Community Logo</Label>
                  <div className="border-2 border-dashed border-red-800/30 rounded-lg p-6 text-center hover:border-orange-500/50 transition-colors">
                    <Upload className="h-8 w-8 text-gray-400 mx-auto mb-2" />
                    <p className="text-sm text-gray-400">Upload logo</p>
                    <input type="file" className="hidden" accept="image/*" />
                  </div>
                </div>
                <div className="space-y-2">
                  <Label className="text-sm text-gray-400">Community Banner</Label>
                  <div className="border-2 border-dashed border-red-800/30 rounded-lg p-6 text-center hover:border-orange-500/50 transition-colors">
                    <Upload className="h-8 w-8 text-gray-400 mx-auto mb-2" />
                    <p className="text-sm text-gray-400">Upload banner</p>
                    <input type="file" className="hidden" accept="image/*" />
                  </div>
                </div>
              </div>
            </div>
          </div>
        )
      default:
        return null
    }
  }

  return (
    <div className="min-h-screen bg-black relative overflow-hidden">
      {/* Animated Background */}
      <div className="absolute inset-0">
        <div className="absolute inset-0 bg-gradient-to-br from-black via-red-950/20 to-black" />
        <div className="absolute top-1/4 left-1/4 w-96 h-96 bg-gradient-to-r from-orange-600/10 to-red-800/10 rounded-full blur-3xl animate-pulse" />
        <div className="absolute bottom-1/4 right-1/4 w-64 h-64 bg-gradient-to-r from-red-500/5 to-orange-700/5 rounded-full blur-3xl animate-pulse delay-1000" />
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

      {/* Welcome Banner */}
      <div className="relative z-10 bg-gradient-to-r from-red-900/30 to-orange-900/30 backdrop-blur-sm border-b border-red-800/30">
        <div className="max-w-4xl mx-auto px-4 py-8 text-center">
          <div className="flex justify-center mb-4">
            <div className="w-16 h-16 bg-gradient-to-r from-orange-600 to-red-700 rounded-full flex items-center justify-center animate-pulse">
              <Users className="h-8 w-8 text-white" />
            </div>
          </div>
          <h1 className="text-4xl font-bold bg-gradient-to-r from-orange-400 to-red-500 bg-clip-text text-transparent mb-2">
            Create Your Community
          </h1>
          <p className="text-gray-300 text-lg">
            Welcome! Let's build something amazing together
          </p>
        </div>
      </div>

      {/* Progress Bar */}
      <div className="relative z-10 bg-black/50 backdrop-blur-sm border-b border-red-800/30">
        <div className="max-w-4xl mx-auto px-4 py-4">
          <div className="flex items-center justify-between mb-2">
            <span className="text-orange-400 font-medium">Progress</span>
            <span className="text-orange-400 font-medium">{Math.round(progress)}%</span>
          </div>
          <div className="w-full bg-red-950/30 rounded-full h-3">
            <div 
              className="bg-gradient-to-r from-orange-500 to-red-600 h-3 rounded-full transition-all duration-500 ease-out"
              style={{ width: `${progress}%` }}
            />
          </div>
          <div className="flex justify-between mt-2">
            <span className="text-sm text-gray-400">Step {currentStep} of {totalSteps}</span>
            <Badge className="bg-orange-500/20 text-orange-400 border-orange-500/30">
              {currentStep === totalSteps ? 'Final Step' : 'In Progress'}
            </Badge>
          </div>
        </div>
      </div>

      {/* Main Content */}
      <div className="relative z-10 min-h-screen flex items-center justify-center px-4 py-8">
        <Card className="w-full max-w-2xl bg-black/80 backdrop-blur-xl border-red-800/30 shadow-2xl shadow-red-900/20">
          <CardHeader className="text-center">
            <CardTitle className="text-2xl font-bold text-white flex items-center justify-center gap-2">
              <Sparkles className="h-6 w-6 text-orange-400" />
              Step {currentStep}
            </CardTitle>
          </CardHeader>

          <CardContent className="space-y-6">
            {renderStep()}

            <div className="flex justify-between pt-6">
              <Button
                onClick={handlePrevious}
                disabled={currentStep === 1}
                variant="outline"
                className="border-red-600/50 text-red-400 hover:text-red-300 hover:border-red-500 hover:bg-red-950/30 disabled:opacity-50 disabled:cursor-not-allowed"
              >
                Previous
              </Button>
              
              {currentStep === totalSteps ? (
                <Button
                  onClick={handleSubmit}
                  className="bg-gradient-to-r from-orange-600 to-red-700 hover:from-orange-500 hover:to-red-600 text-white px-8 font-semibold"
                >
                  Submit Application
                </Button>
              ) : (
                <Button
                  onClick={handleNext}
                  className="bg-gradient-to-r from-orange-600 to-red-700 hover:from-orange-500 hover:to-red-600 text-white px-8 font-semibold"
                >
                  Next
                </Button>
              )}
            </div>
          </CardContent>
        </Card>
      </div>
    </div>
  )
}
