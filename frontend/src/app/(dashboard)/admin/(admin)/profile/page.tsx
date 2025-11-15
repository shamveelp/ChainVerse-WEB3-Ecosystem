"use client"

import { useState, useEffect } from 'react'
import { useSelector } from 'react-redux'
import { User, Mail, Shield, Calendar, Key, Edit, Save, X, CheckCircle } from 'lucide-react'
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card"
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogTrigger } from "@/components/ui/dialog"
import { Badge } from "@/components/ui/badge"
import { useToast } from "@/hooks/use-toast"
import { getAdminProfile, changeAdminPassword } from '@/services/adminApiService'
import type { RootState } from '@/redux/store'

export default function AdminProfile() {
  const { admin } = useSelector((state: RootState) => state.adminAuth)
  const [profileData, setProfileData] = useState<any>(null)
  const [loading, setLoading] = useState(true)
  const [changePasswordOpen, setChangePasswordOpen] = useState(false)
  const [passwordData, setPasswordData] = useState({
    currentPassword: '',
    newPassword: '',
    confirmPassword: ''
  })
  const [passwordLoading, setPasswordLoading] = useState(false)
  const { toast } = useToast()

  useEffect(() => {
    fetchProfile()
  }, [])

  const fetchProfile = async () => {
    try {
      const response = await getAdminProfile()
      if (response.success) {
        setProfileData(response.admin)
      }
    } catch (error) {
      toast({
        title: "Error",
        description: "Failed to load profile",
        variant: "destructive"
      })
    } finally {
      setLoading(false)
    }
  }

  const handleChangePassword = async (e: React.FormEvent) => {
    e.preventDefault()
    
    if (passwordData.newPassword !== passwordData.confirmPassword) {
      toast({
        title: "Error",
        description: "New passwords do not match",
        variant: "destructive"
      })
      return
    }

    setPasswordLoading(true)
    try {
      const response = await changeAdminPassword(
        passwordData.currentPassword,
        passwordData.newPassword
      )
      
      if (response.success) {
        toast({
          title: "Success",
          description: "Password changed successfully",
          className: "bg-green-900/90 border-green-500/50 text-green-100"
        })
        setPasswordData({ currentPassword: '', newPassword: '', confirmPassword: '' })
        setChangePasswordOpen(false)
      } else {
        toast({
          title: "Error",
          description: response.error || "Failed to change password",
          variant: "destructive"
        })
      }
    } catch (error: any) {
      toast({
        title: "Error",
        description: error.response?.data?.message || "Something went wrong",
        variant: "destructive"
      })
    } finally {
      setPasswordLoading(false)
    }
  }

  const passwordsMatch = passwordData.newPassword === passwordData.confirmPassword
  const isPasswordValid = passwordData.newPassword.length >= 8 && passwordsMatch && passwordData.currentPassword

  if (loading) {
    return (
      <div className="flex items-center justify-center min-h-[400px]">
        <div className="text-center space-y-4">
          <div className="h-8 w-8 border-2 border-cyan-400 border-t-transparent rounded-full animate-spin mx-auto" />
          <span className="text-slate-400">Loading profile...</span>
        </div>
      </div>
    )
  }

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div className="space-y-2">
          <h1 className="text-4xl font-bold bg-gradient-to-r from-cyan-400 via-purple-500 to-pink-600 bg-clip-text text-transparent flex items-center gap-3">
            <User className="h-8 w-8 text-cyan-400" />
            Admin Profile
          </h1>
          <p className="text-slate-400 text-lg">
            Manage your administrator account settings
          </p>
        </div>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        {/* Profile Information */}
        <Card className="lg:col-span-2 bg-slate-900/80 backdrop-blur-xl border-slate-700/50">
          <CardHeader className="border-b border-slate-700/50">
            <CardTitle className="text-white flex items-center gap-3">
              <div className="w-12 h-12 rounded-full bg-gradient-to-r from-cyan-400 to-purple-600 flex items-center justify-center text-slate-900 font-bold text-lg">
                {admin?.name?.charAt(0)?.toUpperCase() || 'A'}
              </div>
              <div>
                <h2 className="text-xl">{admin?.name || 'Administrator'}</h2>
                <p className="text-slate-400 text-sm">System Administrator</p>
              </div>
            </CardTitle>
          </CardHeader>
          <CardContent className="p-6 space-y-6">
            <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
              <div className="space-y-4">
                <div className="space-y-2">
                  <div className="flex items-center gap-2 text-slate-400">
                    <User className="h-4 w-4" />
                    <span className="text-sm">Full Name</span>
                  </div>
                  <p className="text-white text-lg">{profileData?.name || admin?.name}</p>
                </div>
                
                <div className="space-y-2">
                  <div className="flex items-center gap-2 text-slate-400">
                    <Mail className="h-4 w-4" />
                    <span className="text-sm">Email Address</span>
                  </div>
                  <p className="text-white text-lg">{profileData?.email || admin?.email}</p>
                </div>
              </div>

              <div className="space-y-4">
                <div className="space-y-2">
                  <div className="flex items-center gap-2 text-slate-400">
                    <Shield className="h-4 w-4" />
                    <span className="text-sm">Role</span>
                  </div>
                  <Badge className="bg-gradient-to-r from-cyan-500/20 to-purple-500/20 text-cyan-400 border-cyan-500/30 text-sm">
                    {profileData?.role || 'admin'}
                  </Badge>
                </div>
                
                <div className="space-y-2">
                  <div className="flex items-center gap-2 text-slate-400">
                    <Calendar className="h-4 w-4" />
                    <span className="text-sm">Last Login</span>
                  </div>
                  <p className="text-white">
                    {profileData?.lastLogin 
                      ? new Date(profileData.lastLogin).toLocaleString()
                      : 'Never'
                    }
                  </p>
                </div>
              </div>
            </div>

            <div className="pt-4 border-t border-slate-700/50">
              <div className="space-y-2">
                <div className="flex items-center gap-2 text-slate-400">
                  <Shield className="h-4 w-4" />
                  <span className="text-sm">Account Status</span>
                </div>
                <div className="flex gap-2">
                  <Badge className="bg-green-500/20 text-green-400 border-green-500/30">
                    {profileData?.isActive ? 'Active' : 'Inactive'}
                  </Badge>
                  <Badge className="bg-blue-500/20 text-blue-400 border-blue-500/30">
                    Verified
                  </Badge>
                </div>
              </div>
            </div>
          </CardContent>
        </Card>

        {/* Quick Actions */}
        <div className="space-y-6">
          <Card className="bg-slate-900/80 backdrop-blur-xl border-slate-700/50">
            <CardHeader>
              <CardTitle className="text-white flex items-center gap-2">
                <Key className="h-5 w-5 text-cyan-400" />
                Security
              </CardTitle>
            </CardHeader>
            <CardContent className="space-y-4">
              <Dialog open={changePasswordOpen} onOpenChange={setChangePasswordOpen}>
                <DialogTrigger asChild>
                  <Button className="w-full bg-gradient-to-r from-cyan-500/20 to-purple-500/20 text-cyan-400 border-cyan-500/30 hover:bg-cyan-500/30 transition-all duration-300">
                    <Key className="h-4 w-4 mr-2" />
                    Change Password
                  </Button>
                </DialogTrigger>
                <DialogContent className="bg-slate-900/95 backdrop-blur-xl border-slate-700/50 text-white">
                  <DialogHeader>
                    <DialogTitle className="text-xl bg-gradient-to-r from-cyan-400 to-purple-500 bg-clip-text text-transparent">
                      Change Password
                    </DialogTitle>
                  </DialogHeader>
                  <form onSubmit={handleChangePassword} className="space-y-4">
                    <div className="space-y-2">
                      <Label htmlFor="currentPassword" className="text-slate-300">Current Password</Label>
                      <Input
                        id="currentPassword"
                        type="password"
                        value={passwordData.currentPassword}
                        onChange={(e) => setPasswordData({...passwordData, currentPassword: e.target.value})}
                        className="bg-slate-800/50 border-slate-600/50 text-slate-100"
                        required
                      />
                    </div>
                    <div className="space-y-2">
                      <Label htmlFor="newPassword" className="text-slate-300">New Password</Label>
                      <Input
                        id="newPassword"
                        type="password"
                        value={passwordData.newPassword}
                        onChange={(e) => setPasswordData({...passwordData, newPassword: e.target.value})}
                        className="bg-slate-800/50 border-slate-600/50 text-slate-100"
                        required
                      />
                      {passwordData.newPassword && passwordData.newPassword.length < 8 && (
                        <p className="text-red-400 text-sm">Password must be at least 8 characters</p>
                      )}
                    </div>
                    <div className="space-y-2">
                      <Label htmlFor="confirmNewPassword" className="text-slate-300">Confirm New Password</Label>
                      <Input
                        id="confirmNewPassword"
                        type="password"
                        value={passwordData.confirmPassword}
                        onChange={(e) => setPasswordData({...passwordData, confirmPassword: e.target.value})}
                        className="bg-slate-800/50 border-slate-600/50 text-slate-100"
                        required
                      />
                      {passwordData.confirmPassword && !passwordsMatch && (
                        <p className="text-red-400 text-sm">Passwords do not match</p>
                      )}
                      {passwordData.confirmPassword && passwordsMatch && passwordData.newPassword.length >= 8 && (
                        <p className="text-green-400 text-sm flex items-center gap-1">
                          <CheckCircle className="h-4 w-4" />
                          Passwords match
                        </p>
                      )}
                    </div>
                    <div className="flex gap-3 pt-4">
                      <Button
                        type="button"
                        variant="outline"
                        onClick={() => setChangePasswordOpen(false)}
                        className="flex-1 border-slate-600 text-slate-300 hover:bg-slate-800/50"
                      >
                        <X className="h-4 w-4 mr-2" />
                        Cancel
                      </Button>
                      <Button
                        type="submit"
                        disabled={passwordLoading || !isPasswordValid}
                        className="flex-1 bg-gradient-to-r from-cyan-500 to-purple-600 hover:from-cyan-400 hover:to-purple-500"
                      >
                        {passwordLoading ? (
                          <>
                            <div className="h-4 w-4 border-2 border-white/30 border-t-white rounded-full animate-spin mr-2" />
                            Changing...
                          </>
                        ) : (
                          <>
                            <Save className="h-4 w-4 mr-2" />
                            Change Password
                          </>
                        )}
                      </Button>
                    </div>
                  </form>
                </DialogContent>
              </Dialog>
            </CardContent>
          </Card>

          {/* Account Info */}
          <Card className="bg-slate-900/80 backdrop-blur-xl border-slate-700/50">
            <CardHeader>
              <CardTitle className="text-white flex items-center gap-2">
                <Shield className="h-5 w-5 text-cyan-400" />
                Account Details
              </CardTitle>
            </CardHeader>
            <CardContent className="space-y-4">
              <div className="space-y-2">
                <span className="text-slate-400 text-sm">Account ID</span>
                <p className="text-white font-mono text-sm bg-slate-800/50 p-2 rounded">
                  {profileData?._id || admin?._id}
                </p>
              </div>
              <div className="space-y-2">
                <span className="text-slate-400 text-sm">Created</span>
                <p className="text-white">
                  {profileData?.createdAt 
                    ? new Date(profileData.createdAt).toLocaleDateString()
                    : 'Unknown'
                  }
                </p>
              </div>
            </CardContent>
          </Card>
        </div>
      </div>
    </div>
  )
}