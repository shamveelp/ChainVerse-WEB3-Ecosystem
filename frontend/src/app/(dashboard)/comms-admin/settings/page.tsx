"use client"

import { useState } from 'react'
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
import { Textarea } from "@/components/ui/textarea"
import { Switch } from "@/components/ui/switch"
import { Separator } from "@/components/ui/separator"
import { Badge } from "@/components/ui/badge"
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs"
import { Settings, Save, Upload, Bell, Shield, Users, Palette, Globe, Lock, Trash2, TriangleAlert as AlertTriangle } from 'lucide-react'

export default function SettingsPage() {
  const [communitySettings, setCommunitySettings] = useState({
    name: "ChainVerse Community",
    description: "A vibrant Web3 community focused on DeFi, NFTs, and blockchain innovation",
    website: "https://chainverse-community.com",
    twitter: "@chainverse_community",
    discord: "discord.gg/chainverse",
    telegram: "@chainverse_group",
    isPublic: true,
    allowInvites: true,
    moderationEnabled: true,
    autoApprove: false,
    requireEmailVerification: true,
  })

  const [notificationSettings, setNotificationSettings] = useState({
    newMember: true,
    questCompletion: true,
    newPost: true,
    directMessage: true,
    weeklyReport: true,
    systemUpdates: true,
  })

  const handleSaveSettings = () => {
    // Handle save API call
    
  }

  return (
    <div className="space-y-6">
      {/* Page Header */}
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-3xl font-bold bg-gradient-to-r from-red-400 to-red-600 bg-clip-text text-transparent">
            Community Settings
          </h1>
          <p className="text-gray-400 mt-2">Manage your community configuration and preferences</p>
        </div>
        <Button onClick={handleSaveSettings} className="bg-gradient-to-r from-red-600 to-red-700 hover:from-red-500 hover:to-red-600 text-white">
          <Save className="h-4 w-4 mr-2" />
          Save Changes
        </Button>
      </div>

      <Tabs defaultValue="general" className="space-y-6">
        <TabsList className="grid w-full grid-cols-5 bg-black/60 backdrop-blur-xl border border-red-800/30">
          <TabsTrigger 
            value="general" 
            className="data-[state=active]:bg-gradient-to-r data-[state=active]:from-red-600 data-[state=active]:to-red-700 data-[state=active]:text-white"
          >
            General
          </TabsTrigger>
          <TabsTrigger 
            value="appearance"
            className="data-[state=active]:bg-gradient-to-r data-[state=active]:from-red-600 data-[state=active]:to-red-700 data-[state=active]:text-white"
          >
            Appearance
          </TabsTrigger>
          <TabsTrigger 
            value="privacy"
            className="data-[state=active]:bg-gradient-to-r data-[state=active]:from-red-600 data-[state=active]:to-red-700 data-[state=active]:text-white"
          >
            Privacy
          </TabsTrigger>
          <TabsTrigger 
            value="notifications"
            className="data-[state=active]:bg-gradient-to-r data-[state=active]:from-red-600 data-[state=active]:to-red-700 data-[state=active]:text-white"
          >
            Notifications
          </TabsTrigger>
          <TabsTrigger 
            value="danger"
            className="data-[state=active]:bg-gradient-to-r data-[state=active]:from-red-600 data-[state=active]:to-red-700 data-[state=active]:text-white"
          >
            Advanced
          </TabsTrigger>
        </TabsList>

        {/* General Settings */}
        <TabsContent value="general" className="space-y-6">
          <Card className="bg-black/60 backdrop-blur-xl border-red-800/30">
            <CardHeader>
              <CardTitle className="text-xl font-semibold text-white flex items-center gap-2">
                <Settings className="h-5 w-5 text-red-400" />
                Basic Information
              </CardTitle>
            </CardHeader>
            <CardContent className="space-y-6">
              <div className="space-y-2">
                <Label htmlFor="communityName" className="text-red-400 font-medium">Community Name</Label>
                <Input
                  id="communityName"
                  value={communitySettings.name}
                  onChange={(e) => setCommunitySettings({...communitySettings, name: e.target.value})}
                  className="bg-red-950/20 border-red-800/30 text-white placeholder:text-gray-500 focus:border-red-600 focus:ring-red-600/20"
                />
              </div>

              <div className="space-y-2">
                <Label htmlFor="description" className="text-red-400 font-medium">Description</Label>
                <Textarea
                  id="description"
                  value={communitySettings.description}
                  onChange={(e) => setCommunitySettings({...communitySettings, description: e.target.value})}
                  className="bg-red-950/20 border-red-800/30 text-white placeholder:text-gray-500 focus:border-red-600 focus:ring-red-600/20 min-h-[100px] resize-none"
                  placeholder="Describe your community..."
                />
                <div className="text-right">
                  <span className="text-xs text-gray-400">{communitySettings.description.length}/500</span>
                </div>
              </div>
            </CardContent>
          </Card>

          <Card className="bg-black/60 backdrop-blur-xl border-red-800/30">
            <CardHeader>
              <CardTitle className="text-xl font-semibold text-white flex items-center gap-2">
                <Globe className="h-5 w-5 text-red-400" />
                Social Links
              </CardTitle>
            </CardHeader>
            <CardContent className="space-y-4">
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                <div className="space-y-2">
                  <Label htmlFor="website" className="text-red-400 font-medium">Website</Label>
                  <Input
                    id="website"
                    value={communitySettings.website}
                    onChange={(e) => setCommunitySettings({...communitySettings, website: e.target.value})}
                    className="bg-red-950/20 border-red-800/30 text-white placeholder:text-gray-500 focus:border-red-600 focus:ring-red-600/20"
                    placeholder="https://your-community.com"
                  />
                </div>
                <div className="space-y-2">
                  <Label htmlFor="twitter" className="text-red-400 font-medium">Twitter/X</Label>
                  <Input
                    id="twitter"
                    value={communitySettings.twitter}
                    onChange={(e) => setCommunitySettings({...communitySettings, twitter: e.target.value})}
                    className="bg-red-950/20 border-red-800/30 text-white placeholder:text-gray-500 focus:border-red-600 focus:ring-red-600/20"
                    placeholder="@username"
                  />
                </div>
                <div className="space-y-2">
                  <Label htmlFor="discord" className="text-red-400 font-medium">Discord</Label>
                  <Input
                    id="discord"
                    value={communitySettings.discord}
                    onChange={(e) => setCommunitySettings({...communitySettings, discord: e.target.value})}
                    className="bg-red-950/20 border-red-800/30 text-white placeholder:text-gray-500 focus:border-red-600 focus:ring-red-600/20"
                    placeholder="discord.gg/invite"
                  />
                </div>
                <div className="space-y-2">
                  <Label htmlFor="telegram" className="text-red-400 font-medium">Telegram</Label>
                  <Input
                    id="telegram"
                    value={communitySettings.telegram}
                    onChange={(e) => setCommunitySettings({...communitySettings, telegram: e.target.value})}
                    className="bg-red-950/20 border-red-800/30 text-white placeholder:text-gray-500 focus:border-red-600 focus:ring-red-600/20"
                    placeholder="@group_name"
                  />
                </div>
              </div>
            </CardContent>
          </Card>
        </TabsContent>

        {/* Appearance Settings */}
        <TabsContent value="appearance" className="space-y-6">
          <Card className="bg-black/60 backdrop-blur-xl border-red-800/30">
            <CardHeader>
              <CardTitle className="text-xl font-semibold text-white flex items-center gap-2">
                <Palette className="h-5 w-5 text-red-400" />
                Branding
              </CardTitle>
            </CardHeader>
            <CardContent className="space-y-6">
              <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                <div className="space-y-4">
                  <Label className="text-red-400 font-medium">Community Logo</Label>
                  <div className="border-2 border-dashed border-red-800/30 rounded-lg p-8 text-center hover:border-red-600/50 transition-colors">
                    <Upload className="h-12 w-12 text-gray-400 mx-auto mb-3" />
                    <p className="text-gray-400 font-medium">Upload Logo</p>
                    <p className="text-sm text-gray-500 mt-1">PNG, JPG or GIF (max 2MB)</p>
                  </div>
                </div>
                <div className="space-y-4">
                  <Label className="text-red-400 font-medium">Banner Image</Label>
                  <div className="border-2 border-dashed border-red-800/30 rounded-lg p-8 text-center hover:border-red-600/50 transition-colors">
                    <Upload className="h-12 w-12 text-gray-400 mx-auto mb-3" />
                    <p className="text-gray-400 font-medium">Upload Banner</p>
                    <p className="text-sm text-gray-500 mt-1">PNG, JPG or GIF (max 5MB)</p>
                  </div>
                </div>
              </div>
            </CardContent>
          </Card>
        </TabsContent>

        {/* Privacy Settings */}
        <TabsContent value="privacy" className="space-y-6">
          <Card className="bg-black/60 backdrop-blur-xl border-red-800/30">
            <CardHeader>
              <CardTitle className="text-xl font-semibold text-white flex items-center gap-2">
                <Shield className="h-5 w-5 text-red-400" />
                Privacy & Security
              </CardTitle>
            </CardHeader>
            <CardContent className="space-y-6">
              <div className="space-y-4">
                <div className="flex items-center justify-between">
                  <div className="space-y-1">
                    <h4 className="font-medium text-white">Public Community</h4>
                    <p className="text-sm text-gray-400">Allow anyone to discover and join your community</p>
                  </div>
                  <Switch 
                    checked={communitySettings.isPublic} 
                    onCheckedChange={(checked) => setCommunitySettings({...communitySettings, isPublic: checked})}
                  />
                </div>

                <Separator className="bg-red-800/20" />

                <div className="flex items-center justify-between">
                  <div className="space-y-1">
                    <h4 className="font-medium text-white">Member Invites</h4>
                    <p className="text-sm text-gray-400">Allow members to invite others</p>
                  </div>
                  <Switch 
                    checked={communitySettings.allowInvites} 
                    onCheckedChange={(checked) => setCommunitySettings({...communitySettings, allowInvites: checked})}
                  />
                </div>

                <Separator className="bg-red-800/20" />

                <div className="flex items-center justify-between">
                  <div className="space-y-1">
                    <h4 className="font-medium text-white">Content Moderation</h4>
                    <p className="text-sm text-gray-400">Enable automatic content filtering</p>
                  </div>
                  <Switch 
                    checked={communitySettings.moderationEnabled} 
                    onCheckedChange={(checked) => setCommunitySettings({...communitySettings, moderationEnabled: checked})}
                  />
                </div>

                <Separator className="bg-red-800/20" />

                <div className="flex items-center justify-between">
                  <div className="space-y-1">
                    <h4 className="font-medium text-white">Auto-approve Members</h4>
                    <p className="text-sm text-gray-400">Automatically approve new member requests</p>
                  </div>
                  <Switch 
                    checked={communitySettings.autoApprove} 
                    onCheckedChange={(checked) => setCommunitySettings({...communitySettings, autoApprove: checked})}
                  />
                </div>

                <Separator className="bg-red-800/20" />

                <div className="flex items-center justify-between">
                  <div className="space-y-1">
                    <h4 className="font-medium text-white">Email Verification</h4>
                    <p className="text-sm text-gray-400">Require email verification for new members</p>
                  </div>
                  <Switch 
                    checked={communitySettings.requireEmailVerification} 
                    onCheckedChange={(checked) => setCommunitySettings({...communitySettings, requireEmailVerification: checked})}
                  />
                </div>
              </div>
            </CardContent>
          </Card>
        </TabsContent>

        {/* Notification Settings */}
        <TabsContent value="notifications" className="space-y-6">
          <Card className="bg-black/60 backdrop-blur-xl border-red-800/30">
            <CardHeader>
              <CardTitle className="text-xl font-semibold text-white flex items-center gap-2">
                <Bell className="h-5 w-5 text-red-400" />
                Email Notifications
              </CardTitle>
            </CardHeader>
            <CardContent className="space-y-6">
              <div className="space-y-4">
                {[
                  { key: 'newMember', title: 'New Member Joined', desc: 'Get notified when someone joins your community' },
                  { key: 'questCompletion', title: 'Quest Completions', desc: 'Get notified when members complete quests' },
                  { key: 'newPost', title: 'New Posts', desc: 'Get notified about new community posts' },
                  { key: 'directMessage', title: 'Direct Messages', desc: 'Get notified when you receive direct messages' },
                  { key: 'weeklyReport', title: 'Weekly Report', desc: 'Receive weekly community activity summaries' },
                  { key: 'systemUpdates', title: 'System Updates', desc: 'Get notified about platform updates and maintenance' },
                ].map((notification) => (
                  <div key={notification.key}>
                    <div className="flex items-center justify-between">
                      <div className="space-y-1">
                        <h4 className="font-medium text-white">{notification.title}</h4>
                        <p className="text-sm text-gray-400">{notification.desc}</p>
                      </div>
                      <Switch 
                        checked={notificationSettings[notification.key as keyof typeof notificationSettings]} 
                        onCheckedChange={(checked) => setNotificationSettings({
                          ...notificationSettings, 
                          [notification.key]: checked
                        })}
                      />
                    </div>
                    {notification.key !== 'systemUpdates' && <Separator className="bg-red-800/20 mt-4" />}
                  </div>
                ))}
              </div>
            </CardContent>
          </Card>
        </TabsContent>

        {/* Advanced/Danger Settings */}
        <TabsContent value="danger" className="space-y-6">
          <Card className="bg-black/60 backdrop-blur-xl border-red-800/30">
            <CardHeader>
              <CardTitle className="text-xl font-semibold text-white flex items-center gap-2">
                <Lock className="h-5 w-5 text-red-400" />
                Security
              </CardTitle>
            </CardHeader>
            <CardContent className="space-y-4">
              <div className="space-y-4">
                <div className="flex items-center justify-between p-4 bg-blue-950/20 rounded-lg border border-blue-800/30">
                  <div>
                    <h4 className="font-medium text-white">Two-Factor Authentication</h4>
                    <p className="text-sm text-gray-400">Add an extra layer of security to your admin account</p>
                  </div>
                  <Badge className="bg-green-600 text-white">Enabled</Badge>
                </div>
                <div className="flex items-center justify-between p-4 bg-gray-950/20 rounded-lg border border-gray-800/30">
                  <div>
                    <h4 className="font-medium text-white">Login History</h4>
                    <p className="text-sm text-gray-400">View recent login activity and manage active sessions</p>
                  </div>
                  <Button variant="outline" size="sm" className="border-gray-600/50 text-gray-400 hover:bg-gray-800">
                    View History
                  </Button>
                </div>
              </div>
            </CardContent>
          </Card>

          <Card className="bg-black/60 backdrop-blur-xl border-red-800/30">
            <CardHeader>
              <CardTitle className="text-xl font-semibold text-red-400 flex items-center gap-2">
                <AlertTriangle className="h-5 w-5" />
                Danger Zone
              </CardTitle>
            </CardHeader>
            <CardContent className="space-y-4">
              <div className="space-y-4">
                <div className="p-4 bg-red-950/20 rounded-lg border border-red-800/30">
                  <h4 className="font-medium text-white mb-2">Transfer Community Ownership</h4>
                  <p className="text-sm text-gray-400 mb-4">
                    Transfer ownership of this community to another admin. This action cannot be undone.
                  </p>
                  <Button variant="outline" className="border-red-600/50 text-red-400 hover:bg-red-950/30">
                    Transfer Ownership
                  </Button>
                </div>

                <div className="p-4 bg-red-950/20 rounded-lg border border-red-800/30">
                  <h4 className="font-medium text-white mb-2">Delete Community</h4>
                  <p className="text-sm text-gray-400 mb-4">
                    Permanently delete your community and all associated data. This action cannot be undone.
                  </p>
                  <Button variant="destructive" className="bg-red-600 hover:bg-red-700 text-white">
                    <Trash2 className="h-4 w-4 mr-2" />
                    Delete Community
                  </Button>
                </div>
              </div>
            </CardContent>
          </Card>
        </TabsContent>
      </Tabs>
    </div>
  )
}