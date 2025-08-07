"use client"

import { useState, useEffect } from 'react'
import { Button } from "@/components/ui/button"
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"
import { Badge } from "@/components/ui/badge"
import { Input } from "@/components/ui/input"
import { Textarea } from "@/components/ui/textarea"
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogTrigger } from "@/components/ui/dialog"
import { Users, Search, Eye, Check, X, Clock, Mail, Globe, MessageSquare, ExternalLink } from 'lucide-react'
import { getAllCommunityRequests, approveCommunityRequest, rejectCommunityRequest } from '@/services/adminApiService'
import { toast } from '@/hooks/use-toast'

interface CommunityRequest {
  _id: string
  communityName: string
  email: string
  username: string
  walletAddress: string
  description: string
  category: string
  whyChooseUs: string
  rules: string[]
  socialLinks: {
    twitter?: string
    discord?: string
    telegram?: string
    website?: string
  }
  logo: string
  banner: string
  status: 'pending' | 'approved' | 'rejected'
  createdAt: string
}

export default function AdminDashboard() {
  const [requests, setRequests] = useState<CommunityRequest[]>([])
  const [loading, setLoading] = useState(true)
  const [search, setSearch] = useState('')
  const [selectedRequest, setSelectedRequest] = useState<CommunityRequest | null>(null)
  const [actionLoading, setActionLoading] = useState<string | null>(null)
  const [rejectReason, setRejectReason] = useState('')

  useEffect(() => {
    fetchRequests()
  }, [search])

  const fetchRequests = async () => {
    try {
      const result = await getAllCommunityRequests(1, 50, search)
      if (result.success) {
        setRequests(result.data || [])
      }
    } catch (error) {
      toast({
        title: "Error",
        description: "Failed to fetch community requests",
        variant: "destructive"
      })
    } finally {
      setLoading(false)
    }
  }

  const handleApprove = async (requestId: string) => {
    setActionLoading(requestId)
    try {
      const result = await approveCommunityRequest(requestId)
      if (result.success) {
        toast({
          title: "Success",
          description: "Community request approved successfully!",
        })
        fetchRequests()
      } else {
        toast({
          title: "Error",
          description: result.error || "Failed to approve request",
          variant: "destructive"
        })
      }
    } catch (error) {
      toast({
        title: "Error",
        description: "Something went wrong",
        variant: "destructive"
      })
    } finally {
      setActionLoading(null)
    }
  }

  const handleReject = async (requestId: string) => {
    if (!rejectReason.trim()) {
      toast({
        title: "Error",
        description: "Please provide a reason for rejection",
        variant: "destructive"
      })
      return
    }

    setActionLoading(requestId)
    try {
      const result = await rejectCommunityRequest(requestId, rejectReason)
      if (result.success) {
        toast({
          title: "Success",
          description: "Community request rejected successfully!",
        })
        setRejectReason('')
        fetchRequests()
      } else {
        toast({
          title: "Error",
          description: result.error || "Failed to reject request",
          variant: "destructive"
        })
      }
    } catch (error) {
      toast({
        title: "Error",
        description: "Something went wrong",
        variant: "destructive"
      })
    } finally {
      setActionLoading(null)
    }
  }

  const getStatusColor = (status: string) => {
    switch (status) {
      case 'pending': return 'bg-yellow-500/20 text-yellow-400 border-yellow-500/30'
      case 'approved': return 'bg-green-500/20 text-green-400 border-green-500/30'
      case 'rejected': return 'bg-red-500/20 text-red-400 border-red-500/30'
      default: return 'bg-gray-500/20 text-gray-400 border-gray-500/30'
    }
  }

  const getStatusIcon = (status: string) => {
    switch (status) {
      case 'pending': return <Clock className="h-4 w-4" />
      case 'approved': return <Check className="h-4 w-4" />
      case 'rejected': return <X className="h-4 w-4" />
      default: return <Clock className="h-4 w-4" />
    }
  }

  if (loading) {
    return (
      <div className="min-h-screen bg-black flex items-center justify-center">
        <div className="text-white">Loading...</div>
      </div>
    )
  }

  return (
    <div className="min-h-screen bg-black text-white p-6">
      <div className="max-w-7xl mx-auto">
        {/* Header */}
        <div className="mb-8">
          <h1 className="text-3xl font-bold bg-gradient-to-r from-red-400 to-orange-500 bg-clip-text text-transparent mb-2">
            Admin Dashboard
          </h1>
          <p className="text-gray-400">Manage community applications and requests</p>
        </div>

        {/* Search */}
        <div className="mb-6">
          <div className="relative max-w-md">
            <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 h-5 w-5 text-gray-400" />
            <Input
              value={search}
              onChange={(e) => setSearch(e.target.value)}
              placeholder="Search communities..."
              className="pl-10 bg-gray-900 border-gray-700 text-white"
            />
          </div>
        </div>

        {/* Stats */}
        <div className="grid grid-cols-1 md:grid-cols-4 gap-6 mb-8">
          <Card className="bg-gray-900 border-gray-700">
            <CardContent className="p-6">
              <div className="flex items-center gap-4">
                <div className="w-12 h-12 bg-yellow-500/20 rounded-lg flex items-center justify-center">
                  <Clock className="h-6 w-6 text-yellow-400" />
                </div>
                <div>
                  <p className="text-2xl font-bold text-white">
                    {requests.filter(r => r.status === 'pending').length}
                  </p>
                  <p className="text-gray-400 text-sm">Pending</p>
                </div>
              </div>
            </CardContent>
          </Card>
          <Card className="bg-gray-900 border-gray-700">
            <CardContent className="p-6">
              <div className="flex items-center gap-4">
                <div className="w-12 h-12 bg-green-500/20 rounded-lg flex items-center justify-center">
                  <Check className="h-6 w-6 text-green-400" />
                </div>
                <div>
                  <p className="text-2xl font-bold text-white">
                    {requests.filter(r => r.status === 'approved').length}
                  </p>
                  <p className="text-gray-400 text-sm">Approved</p>
                </div>
              </div>
            </CardContent>
          </Card>
          <Card className="bg-gray-900 border-gray-700">
            <CardContent className="p-6">
              <div className="flex items-center gap-4">
                <div className="w-12 h-12 bg-red-500/20 rounded-lg flex items-center justify-center">
                  <X className="h-6 w-6 text-red-400" />
                </div>
                <div>
                  <p className="text-2xl font-bold text-white">
                    {requests.filter(r => r.status === 'rejected').length}
                  </p>
                  <p className="text-gray-400 text-sm">Rejected</p>
                </div>
              </div>
            </CardContent>
          </Card>
          <Card className="bg-gray-900 border-gray-700">
            <CardContent className="p-6">
              <div className="flex items-center gap-4">
                <div className="w-12 h-12 bg-blue-500/20 rounded-lg flex items-center justify-center">
                  <Users className="h-6 w-6 text-blue-400" />
                </div>
                <div>
                  <p className="text-2xl font-bold text-white">{requests.length}</p>
                  <p className="text-gray-400 text-sm">Total</p>
                </div>
              </div>
            </CardContent>
          </Card>
        </div>

        {/* Requests List */}
        <div className="space-y-4">
          {requests.length === 0 ? (
            <Card className="bg-gray-900 border-gray-700">
              <CardContent className="p-8 text-center">
                <Users className="h-12 w-12 text-gray-400 mx-auto mb-4" />
                <p className="text-gray-400">No community requests found</p>
              </CardContent>
            </Card>
          ) : (
            requests.map((request) => (
              <Card key={request._id} className="bg-gray-900 border-gray-700">
                <CardContent className="p-6">
                  <div className="flex items-start justify-between">
                    <div className="flex-1">
                      <div className="flex items-center gap-3 mb-2">
                        <h3 className="text-xl font-semibold text-white">
                          {request.communityName}
                        </h3>
                        <Badge className={`${getStatusColor(request.status)} border`}>
                          <div className="flex items-center gap-1">
                            {getStatusIcon(request.status)}
                            {request.status.charAt(0).toUpperCase() + request.status.slice(1)}
                          </div>
                        </Badge>
                      </div>
                      <div className="grid grid-cols-1 md:grid-cols-2 gap-4 mb-4">
                        <div className="flex items-center gap-2 text-gray-400">
                          <Mail className="h-4 w-4" />
                          {request.email}
                        </div>
                        <div className="flex items-center gap-2 text-gray-400">
                          <Users className="h-4 w-4" />
                          @{request.username}
                        </div>
                      </div>
                      <p className="text-gray-300 mb-4 line-clamp-2">
                        {request.description}
                      </p>
                      <div className="flex items-center gap-2 text-sm text-gray-400">
                        <span>Category: {request.category}</span>
                        <span>•</span>
                        <span>Applied: {new Date(request.createdAt).toLocaleDateString()}</span>
                      </div>
                    </div>
                    <div className="flex items-center gap-2 ml-4">
                      <Dialog>
                        <DialogTrigger asChild>
                          <Button
                            variant="outline"
                            size="sm"
                            onClick={() => setSelectedRequest(request)}
                            className="border-gray-600 text-gray-300 hover:bg-gray-800"
                          >
                            <Eye className="h-4 w-4 mr-1" />
                            View
                          </Button>
                        </DialogTrigger>
                        <DialogContent className="bg-gray-900 border-gray-700 text-white max-w-4xl max-h-[80vh] overflow-y-auto">
                          <DialogHeader>
                            <DialogTitle className="text-xl font-bold">
                              {selectedRequest?.communityName}
                            </DialogTitle>
                          </DialogHeader>
                          {selectedRequest && (
                            <div className="space-y-6">
                              {/* Basic Info */}
                              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                                <div>
                                  <h4 className="font-semibold text-gray-300 mb-2">Contact Information</h4>
                                  <div className="space-y-2 text-sm">
                                    <p><span className="text-gray-400">Email:</span> {selectedRequest.email}</p>
                                    <p><span className="text-gray-400">Username:</span> @{selectedRequest.username}</p>
                                    <p><span className="text-gray-400">Wallet:</span> {selectedRequest.walletAddress || 'Not provided'}</p>
                                  </div>
                                </div>
                                <div>
                                  <h4 className="font-semibold text-gray-300 mb-2">Community Details</h4>
                                  <div className="space-y-2 text-sm">
                                    <p><span className="text-gray-400">Category:</span> {selectedRequest.category}</p>
                                    <p><span className="text-gray-400">Status:</span> 
                                      <Badge className={`ml-2 ${getStatusColor(selectedRequest.status)} border`}>
                                        {selectedRequest.status}
                                      </Badge>
                                    </p>
                                    <p><span className="text-gray-400">Applied:</span> {new Date(selectedRequest.createdAt).toLocaleDateString()}</p>
                                  </div>
                                </div>
                              </div>

                              {/* Description */}
                              <div>
                                <h4 className="font-semibold text-gray-300 mb-2">Description</h4>
                                <p className="text-gray-300 text-sm bg-gray-800 p-3 rounded-lg">
                                  {selectedRequest.description}
                                </p>
                              </div>

                              {/* Why Choose Us */}
                              {selectedRequest.whyChooseUs && (
                                <div>
                                  <h4 className="font-semibold text-gray-300 mb-2">Why Choose Us</h4>
                                  <p className="text-gray-300 text-sm bg-gray-800 p-3 rounded-lg">
                                    {selectedRequest.whyChooseUs}
                                  </p>
                                </div>
                              )}

                              {/* Rules */}
                              {selectedRequest.rules && selectedRequest.rules.length > 0 && (
                                <div>
                                  <h4 className="font-semibold text-gray-300 mb-2">Community Rules</h4>
                                  <ul className="space-y-1 text-sm">
                                    {selectedRequest.rules.map((rule, index) => (
                                      <li key={index} className="text-gray-300 bg-gray-800 p-2 rounded">
                                        {index + 1}. {rule}
                                      </li>
                                    ))}
                                  </ul>
                                </div>
                              )}

                              {/* Social Links */}
                              {selectedRequest.socialLinks && Object.keys(selectedRequest.socialLinks).some(key => selectedRequest.socialLinks[key as keyof typeof selectedRequest.socialLinks]) && (
                                <div>
                                  <h4 className="font-semibold text-gray-300 mb-2">Social Links</h4>
                                  <div className="grid grid-cols-2 gap-2 text-sm">
                                    {selectedRequest.socialLinks.twitter && (
                                      <a href={selectedRequest.socialLinks.twitter} target="_blank" rel="noopener noreferrer" 
                                         className="flex items-center gap-2 text-blue-400 hover:text-blue-300">
                                        <MessageSquare className="h-4 w-4" />
                                        Twitter
                                        <ExternalLink className="h-3 w-3" />
                                      </a>
                                    )}
                                    {selectedRequest.socialLinks.discord && (
                                      <a href={selectedRequest.socialLinks.discord} target="_blank" rel="noopener noreferrer"
                                         className="flex items-center gap-2 text-purple-400 hover:text-purple-300">
                                        <MessageSquare className="h-4 w-4" />
                                        Discord
                                        <ExternalLink className="h-3 w-3" />
                                      </a>
                                    )}
                                    {selectedRequest.socialLinks.telegram && (
                                      <a href={selectedRequest.socialLinks.telegram} target="_blank" rel="noopener noreferrer"
                                         className="flex items-center gap-2 text-blue-400 hover:text-blue-300">
                                        <MessageSquare className="h-4 w-4" />
                                        Telegram
                                        <ExternalLink className="h-3 w-3" />
                                      </a>
                                    )}
                                    {selectedRequest.socialLinks.website && (
                                      <a href={selectedRequest.socialLinks.website} target="_blank" rel="noopener noreferrer"
                                         className="flex items-center gap-2 text-green-400 hover:text-green-300">
                                        <Globe className="h-4 w-4" />
                                        Website
                                        <ExternalLink className="h-3 w-3" />
                                      </a>
                                    )}
                                  </div>
                                </div>
                              )}

                              {/* Images */}
                              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                                {selectedRequest.logo && (
                                  <div>
                                    <h4 className="font-semibold text-gray-300 mb-2">Logo</h4>
                                    <img src={selectedRequest.logo || "/placeholder.svg"} alt="Community Logo" 
                                         className="w-full h-32 object-cover rounded-lg bg-gray-800" />
                                  </div>
                                )}
                                {selectedRequest.banner && (
                                  <div>
                                    <h4 className="font-semibold text-gray-300 mb-2">Banner</h4>
                                    <img src={selectedRequest.banner || "/placeholder.svg"} alt="Community Banner" 
                                         className="w-full h-32 object-cover rounded-lg bg-gray-800" />
                                  </div>
                                )}
                              </div>

                              {/* Actions */}
                              {selectedRequest.status === 'pending' && (
                                <div className="flex gap-4 pt-4 border-t border-gray-700">
                                  <Button
                                    onClick={() => handleApprove(selectedRequest._id)}
                                    disabled={actionLoading === selectedRequest._id}
                                    className="bg-green-600 hover:bg-green-700 text-white"
                                  >
                                    <Check className="h-4 w-4 mr-2" />
                                    Approve
                                  </Button>
                                  <div className="flex-1 flex gap-2">
                                    <Textarea
                                      value={rejectReason}
                                      onChange={(e) => setRejectReason(e.target.value)}
                                      placeholder="Reason for rejection..."
                                      className="bg-gray-800 border-gray-600 text-white"
                                      rows={2}
                                    />
                                    <Button
                                      onClick={() => handleReject(selectedRequest._id)}
                                      disabled={actionLoading === selectedRequest._id || !rejectReason.trim()}
                                      variant="destructive"
                                    >
                                      <X className="h-4 w-4 mr-2" />
                                      Reject
                                    </Button>
                                  </div>
                                </div>
                              )}
                            </div>
                          )}
                        </DialogContent>
                      </Dialog>
                      
                      {request.status === 'pending' && (
                        <>
                          <Button
                            onClick={() => handleApprove(request._id)}
                            disabled={actionLoading === request._id}
                            size="sm"
                            className="bg-green-600 hover:bg-green-700 text-white"
                          >
                            <Check className="h-4 w-4 mr-1" />
                            Approve
                          </Button>
                          <Button
                            onClick={() => handleReject(request._id)}
                            disabled={actionLoading === request._id}
                            size="sm"
                            variant="destructive"
                          >
                            <X className="h-4 w-4 mr-1" />
                            Reject
                          </Button>
                        </>
                      )}
                    </div>
                  </div>
                </CardContent>
              </Card>
            ))
          )}
        </div>
      </div>
    </div>
  )
}
