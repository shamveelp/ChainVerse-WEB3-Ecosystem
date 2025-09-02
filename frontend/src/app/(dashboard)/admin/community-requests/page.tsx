"use client"

import { useState, useEffect } from 'react'
import { Button } from "@/components/ui/button"
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"
import { Badge } from "@/components/ui/badge"
import { Input } from "@/components/ui/input"
import { Textarea } from "@/components/ui/textarea"
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogTrigger } from "@/components/ui/dialog"
import { Users, Search, Eye, Check, X, Clock, Mail, Globe, MessageSquare, ExternalLink, ChevronLeft, ChevronRight, Loader2, RefreshCw, Shield } from 'lucide-react'
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

export default function CommunityRequestsPage() {
  const [requests, setRequests] = useState<CommunityRequest[]>([])
  const [loading, setLoading] = useState(true)
  const [search, setSearch] = useState('')
  const [searchInput, setSearchInput] = useState('')
  const [selectedRequest, setSelectedRequest] = useState<CommunityRequest | null>(null)
  const [actionLoading, setActionLoading] = useState<string | null>(null)
  const [rejectReason, setRejectReason] = useState('')
  const [currentPage, setCurrentPage] = useState(1)
  const [totalPages, setTotalPages] = useState(1)
  const [total, setTotal] = useState(0)
  const limit = 10

  useEffect(() => {
    fetchRequests()
  }, [search, currentPage])

  const fetchRequests = async () => {
    setLoading(true)
    try {
      const result = await getAllCommunityRequests(currentPage, limit, search)
      if (result.success) {
        setRequests(result.data || [])
        setTotal(result.total || 0)
        setTotalPages(Math.ceil((result.total || 0) / limit))
      } else {
        throw new Error(result.error || "Failed to fetch requests")
      }
    } catch (error: any) {
      toast({
        title: "Error",
        description: error.message || "Failed to fetch community requests",
        variant: "destructive"
      })
      setRequests([])
    } finally {
      setLoading(false)
    }
  }

  const handleSearch = () => {
    setSearch(searchInput.trim())
    setCurrentPage(1)
  }

  const handleApprove = async (requestId: string) => {
    setActionLoading(requestId)
    try {
      const result = await approveCommunityRequest(requestId)
      if (result.success) {
        toast({
          title: "Success",
          description: "Community request approved successfully!",
          className: "bg-green-900/90 border-green-500/50 text-green-100"
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
          className: "bg-red-900/90 border-red-500/50 text-red-100"
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

  const handlePageChange = (page: number) => {
    if (page >= 1 && page <= totalPages) {
      setCurrentPage(page)
    }
  }

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div className="space-y-2">
          <h1 className="text-4xl font-bold bg-gradient-to-r from-red-400 via-orange-500 to-red-600 bg-clip-text text-transparent flex items-center gap-3">
            <Users className="h-8 w-8 text-red-400" />
            Community Requests
          </h1>
          <p className="text-slate-400 text-lg">
            Review and manage community applications
          </p>
        </div>
        <div className="flex items-center gap-4">
          <div className="text-right">
            <p className="text-2xl font-bold text-white">{total}</p>
            <p className="text-sm text-slate-400">Total Requests</p>
          </div>
          <Button
            onClick={fetchRequests}
            variant="outline"
            className="bg-slate-800/50 border-slate-600/50 hover:bg-slate-700/50 hover:border-red-400/50 text-slate-300 hover:text-red-400"
          >
            <RefreshCw className="h-4 w-4 mr-2" />
            Refresh
          </Button>
        </div>
      </div>

      {/* Search */}
      <Card className="bg-slate-900/80 backdrop-blur-xl border-slate-700/50">
        <CardContent className="p-6">
          <div className="flex gap-4 items-center">
            <div className="flex-1 relative group">
              <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 h-5 w-5 text-red-400/70 group-focus-within:text-red-400 transition-colors" />
              <Input
                value={searchInput}
                onChange={(e) => setSearchInput(e.target.value)}
                onKeyPress={(e) => e.key === 'Enter' && handleSearch()}
                placeholder="Search communities by name, email, or username..."
                className="pl-10 bg-slate-800/50 border-slate-600/50 text-slate-100 placeholder:text-slate-500 focus:border-red-400/50 focus:ring-red-400/20 backdrop-blur-sm transition-all duration-300"
              />
            </div>
            <Button 
              onClick={handleSearch}
              className="bg-gradient-to-r from-red-500 to-orange-600 hover:from-red-400 hover:to-orange-500 text-white font-semibold px-6 transition-all duration-300 shadow-lg hover:shadow-red-400/25"
            >
              <Search className="h-4 w-4 mr-2" />
              Search
            </Button>
          </div>
        </CardContent>
      </Card>

      {/* Stats */}
      <div className="grid grid-cols-1 md:grid-cols-4 gap-6">
        <Card className="bg-gradient-to-br from-yellow-950/50 to-yellow-900/30 border-yellow-800/30">
          <CardContent className="p-6">
            <div className="flex items-center gap-4">
              <div className="w-12 h-12 bg-yellow-500/20 rounded-lg flex items-center justify-center">
                <Clock className="h-6 w-6 text-yellow-400" />
              </div>
              <div>
                <p className="text-2xl font-bold text-white">
                  {requests.filter(r => r.status === 'pending').length}
                </p>
                <p className="text-yellow-400 text-sm font-medium">Pending Review</p>
              </div>
            </div>
          </CardContent>
        </Card>
        
        <Card className="bg-gradient-to-br from-green-950/50 to-green-900/30 border-green-800/30">
          <CardContent className="p-6">
            <div className="flex items-center gap-4">
              <div className="w-12 h-12 bg-green-500/20 rounded-lg flex items-center justify-center">
                <Check className="h-6 w-6 text-green-400" />
              </div>
              <div>
                <p className="text-2xl font-bold text-white">
                  {requests.filter(r => r.status === 'approved').length}
                </p>
                <p className="text-green-400 text-sm font-medium">Approved</p>
              </div>
            </div>
          </CardContent>
        </Card>
        
        <Card className="bg-gradient-to-br from-red-950/50 to-red-900/30 border-red-800/30">
          <CardContent className="p-6">
            <div className="flex items-center gap-4">
              <div className="w-12 h-12 bg-red-500/20 rounded-lg flex items-center justify-center">
                <X className="h-6 w-6 text-red-400" />
              </div>
              <div>
                <p className="text-2xl font-bold text-white">
                  {requests.filter(r => r.status === 'rejected').length}
                </p>
                <p className="text-red-400 text-sm font-medium">Rejected</p>
              </div>
            </div>
          </CardContent>
        </Card>
        
        <Card className="bg-gradient-to-br from-blue-950/50 to-blue-900/30 border-blue-800/30">
          <CardContent className="p-6">
            <div className="flex items-center gap-4">
              <div className="w-12 h-12 bg-blue-500/20 rounded-lg flex items-center justify-center">
                <Users className="h-6 w-6 text-blue-400" />
              </div>
              <div>
                <p className="text-2xl font-bold text-white">{total}</p>
                <p className="text-blue-400 text-sm font-medium">Total Applications</p>
              </div>
            </div>
          </CardContent>
        </Card>
      </div>

      {/* Requests List */}
      <Card className="bg-slate-900/80 backdrop-blur-xl border-slate-700/50">
        <CardHeader className="border-b border-slate-700/50">
          <CardTitle className="text-white flex items-center justify-between">
            <div className="flex items-center gap-2">
              <Users className="h-5 w-5 text-red-400" />
              Community Applications
            </div>
            <div className="text-sm text-slate-400 font-normal">
              {loading ? "Loading..." : `Page ${currentPage} of ${totalPages}`}
            </div>
          </CardTitle>
        </CardHeader>
        <CardContent className="p-0">
          {loading ? (
            <div className="flex items-center justify-center py-12">
              <div className="text-center space-y-4">
                <Loader2 className="h-8 w-8 animate-spin text-red-400 mx-auto" />
                <span className="text-slate-400">Loading community requests...</span>
              </div>
            </div>
          ) : requests.length === 0 ? (
            <div className="text-center py-12 space-y-4">
              <Users className="h-12 w-12 text-slate-600 mx-auto" />
              <p className="text-slate-400">
                {search ? `No requests found matching "${search}"` : "No community requests found"}
              </p>
            </div>
          ) : (
            <>
              <div className="divide-y divide-slate-800/50">
                {requests.map((request) => (
                  <div key={request._id} className="p-6 hover:bg-slate-800/30 transition-colors">
                    <div className="flex items-start justify-between">
                      <div className="flex-1">
                        <div className="flex items-center gap-3 mb-3">
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
                        
                        <div className="grid grid-cols-1 md:grid-cols-3 gap-4 mb-4">
                          <div className="flex items-center gap-2 text-slate-400">
                            <Mail className="h-4 w-4" />
                            <span className="text-sm">{request.email}</span>
                          </div>
                          <div className="flex items-center gap-2 text-slate-400">
                            <Users className="h-4 w-4" />
                            <span className="text-sm">@{request.username}</span>
                          </div>
                          <div className="flex items-center gap-2 text-slate-400">
                            <Clock className="h-4 w-4" />
                            <span className="text-sm">{new Date(request.createdAt).toLocaleDateString()}</span>
                          </div>
                        </div>
                        
                        <p className="text-slate-300 mb-3 line-clamp-2">
                          {request.description}
                        </p>
                        
                        <div className="flex items-center gap-4 text-sm">
                          <Badge variant="outline" className="border-slate-600 text-slate-400">
                            {request.category}
                          </Badge>
                          {request.walletAddress && (
                            <span className="text-slate-500 font-mono text-xs">
                              {request.walletAddress.slice(0, 6)}...{request.walletAddress.slice(-4)}
                            </span>
                          )}
                        </div>
                      </div>
                      
                      <div className="flex items-center gap-2 ml-4">
                        <Dialog>
                          <DialogTrigger asChild>
                            <Button
                              variant="outline"
                              size="sm"
                              onClick={() => setSelectedRequest(request)}
                              className="border-slate-600 text-slate-300 hover:bg-slate-800 hover:border-red-400/50 hover:text-red-400"
                            >
                              <Eye className="h-4 w-4 mr-1" />
                              View
                            </Button>
                          </DialogTrigger>
                          <DialogContent className="bg-slate-900/95 backdrop-blur-xl border-slate-700/50 text-white max-w-4xl max-h-[80vh] overflow-y-auto">
                            <DialogHeader>
                              <DialogTitle className="text-xl font-bold flex items-center gap-2">
                                <Users className="h-5 w-5 text-red-400" />
                                {selectedRequest?.communityName}
                              </DialogTitle>
                            </DialogHeader>
                            {selectedRequest && (
                              <div className="space-y-6">
                                {/* Basic Info */}
                                <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                                  <div className="space-y-4">
                                    <h4 className="font-semibold text-slate-300 border-b border-slate-700 pb-2">Contact Information</h4>
                                    <div className="space-y-3 text-sm">
                                      <div className="flex items-center gap-2">
                                        <Mail className="h-4 w-4 text-slate-400" />
                                        <span className="text-slate-400">Email:</span>
                                        <span className="text-white">{selectedRequest.email}</span>
                                      </div>
                                      <div className="flex items-center gap-2">
                                        <Users className="h-4 w-4 text-slate-400" />
                                        <span className="text-slate-400">Username:</span>
                                        <span className="text-white">@{selectedRequest.username}</span>
                                      </div>
                                      <div className="flex items-center gap-2">
                                        <Shield className="h-4 w-4 text-slate-400" />
                                        <span className="text-slate-400">Wallet:</span>
                                        <span className="text-white font-mono text-xs">{selectedRequest.walletAddress || 'Not provided'}</span>
                                      </div>
                                    </div>
                                  </div>
                                  <div className="space-y-4">
                                    <h4 className="font-semibold text-slate-300 border-b border-slate-700 pb-2">Application Details</h4>
                                    <div className="space-y-3 text-sm">
                                      <div>
                                        <span className="text-slate-400">Category:</span>
                                        <Badge className="ml-2 bg-blue-500/20 text-blue-400 border-blue-500/30">
                                          {selectedRequest.category}
                                        </Badge>
                                      </div>
                                      <div>
                                        <span className="text-slate-400">Status:</span>
                                        <Badge className={`ml-2 ${getStatusColor(selectedRequest.status)} border`}>
                                          {selectedRequest.status}
                                        </Badge>
                                      </div>
                                      <div>
                                        <span className="text-slate-400">Applied:</span>
                                        <span className="text-white ml-2">{new Date(selectedRequest.createdAt).toLocaleDateString()}</span>
                                      </div>
                                    </div>
                                  </div>
                                </div>

                                {/* Description */}
                                <div>
                                  <h4 className="font-semibold text-slate-300 mb-3 border-b border-slate-700 pb-2">Community Description</h4>
                                  <p className="text-slate-300 text-sm bg-slate-800/50 p-4 rounded-lg leading-relaxed">
                                    {selectedRequest.description}
                                  </p>
                                </div>

                                {/* Why Choose Us */}
                                {selectedRequest.whyChooseUs && (
                                  <div>
                                    <h4 className="font-semibold text-slate-300 mb-3 border-b border-slate-700 pb-2">Why They Chose Us</h4>
                                    <p className="text-slate-300 text-sm bg-slate-800/50 p-4 rounded-lg leading-relaxed">
                                      {selectedRequest.whyChooseUs}
                                    </p>
                                  </div>
                                )}

                                {/* Rules */}
                                {selectedRequest.rules && selectedRequest.rules.length > 0 && (
                                  <div>
                                    <h4 className="font-semibold text-slate-300 mb-3 border-b border-slate-700 pb-2">Community Rules</h4>
                                    <div className="space-y-2">
                                      {selectedRequest.rules.map((rule, index) => (
                                        <div key={index} className="text-sm text-slate-300 bg-slate-800/50 p-3 rounded-lg">
                                          <span className="text-red-400 font-medium">{index + 1}.</span> {rule}
                                        </div>
                                      ))}
                                    </div>
                                  </div>
                                )}

                                {/* Social Links */}
                                {selectedRequest.socialLinks && Object.keys(selectedRequest.socialLinks).some(key => selectedRequest.socialLinks[key as keyof typeof selectedRequest.socialLinks]) && (
                                  <div>
                                    <h4 className="font-semibold text-slate-300 mb-3 border-b border-slate-700 pb-2">Social Media Presence</h4>
                                    <div className="grid grid-cols-2 gap-3">
                                      {selectedRequest.socialLinks.twitter && (
                                        <a href={selectedRequest.socialLinks.twitter} target="_blank" rel="noopener noreferrer" 
                                           className="flex items-center gap-2 text-blue-400 hover:text-blue-300 bg-slate-800/50 p-3 rounded-lg transition-colors">
                                          <MessageSquare className="h-4 w-4" />
                                          Twitter/X
                                          <ExternalLink className="h-3 w-3" />
                                        </a>
                                      )}
                                      {selectedRequest.socialLinks.discord && (
                                        <a href={selectedRequest.socialLinks.discord} target="_blank" rel="noopener noreferrer"
                                           className="flex items-center gap-2 text-purple-400 hover:text-purple-300 bg-slate-800/50 p-3 rounded-lg transition-colors">
                                          <MessageSquare className="h-4 w-4" />
                                          Discord
                                          <ExternalLink className="h-3 w-3" />
                                        </a>
                                      )}
                                      {selectedRequest.socialLinks.telegram && (
                                        <a href={selectedRequest.socialLinks.telegram} target="_blank" rel="noopener noreferrer"
                                           className="flex items-center gap-2 text-blue-400 hover:text-blue-300 bg-slate-800/50 p-3 rounded-lg transition-colors">
                                          <MessageSquare className="h-4 w-4" />
                                          Telegram
                                          <ExternalLink className="h-3 w-3" />
                                        </a>
                                      )}
                                      {selectedRequest.socialLinks.website && (
                                        <a href={selectedRequest.socialLinks.website} target="_blank" rel="noopener noreferrer"
                                           className="flex items-center gap-2 text-green-400 hover:text-green-300 bg-slate-800/50 p-3 rounded-lg transition-colors">
                                          <Globe className="h-4 w-4" />
                                          Website
                                          <ExternalLink className="h-3 w-3" />
                                        </a>
                                      )}
                                    </div>
                                  </div>
                                )}

                                {/* Images */}
                                <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                                  {selectedRequest.logo && (
                                    <div>
                                      <h4 className="font-semibold text-slate-300 mb-3">Community Logo</h4>
                                      <img src={selectedRequest.logo} alt="Community Logo" 
                                           className="w-full h-40 object-cover rounded-lg bg-slate-800 border border-slate-700" />
                                    </div>
                                  )}
                                  {selectedRequest.banner && (
                                    <div>
                                      <h4 className="font-semibold text-slate-300 mb-3">Community Banner</h4>
                                      <img src={selectedRequest.banner} alt="Community Banner" 
                                           className="w-full h-40 object-cover rounded-lg bg-slate-800 border border-slate-700" />
                                    </div>
                                  )}
                                </div>

                                {/* Actions */}
                                {selectedRequest.status === 'pending' && (
                                  <div className="flex flex-col gap-4 pt-6 border-t border-slate-700">
                                    <div className="flex gap-4">
                                      <Button
                                        onClick={() => handleApprove(selectedRequest._id)}
                                        disabled={actionLoading === selectedRequest._id}
                                        className="bg-green-600 hover:bg-green-700 text-white flex-1"
                                      >
                                        {actionLoading === selectedRequest._id ? (
                                          <Loader2 className="h-4 w-4 mr-2 animate-spin" />
                                        ) : (
                                          <Check className="h-4 w-4 mr-2" />
                                        )}
                                        Approve Community
                                      </Button>
                                    </div>
                                    <div className="space-y-3">
                                      <Textarea
                                        value={rejectReason}
                                        onChange={(e) => setRejectReason(e.target.value)}
                                        placeholder="Please provide a detailed reason for rejection..."
                                        className="bg-slate-800/50 border-slate-600 text-white placeholder:text-slate-500 min-h-[100px]"
                                        rows={3}
                                      />
                                      <Button
                                        onClick={() => handleReject(selectedRequest._id)}
                                        disabled={actionLoading === selectedRequest._id || !rejectReason.trim()}
                                        variant="destructive"
                                        className="w-full"
                                      >
                                        {actionLoading === selectedRequest._id ? (
                                          <Loader2 className="h-4 w-4 mr-2 animate-spin" />
                                        ) : (
                                          <X className="h-4 w-4 mr-2" />
                                        )}
                                        Reject Application
                                      </Button>
                                    </div>
                                  </div>
                                )}
                              </div>
                            )}
                          </DialogContent>
                        </Dialog>
                        
                        {request.status === 'pending' && (
                          <div className="flex gap-2">
                            <Button
                              onClick={() => handleApprove(request._id)}
                              disabled={actionLoading === request._id}
                              size="sm"
                              className="bg-green-600 hover:bg-green-700 text-white"
                            >
                              {actionLoading === request._id ? (
                                <Loader2 className="h-4 w-4 animate-spin" />
                              ) : (
                                <Check className="h-4 w-4 mr-1" />
                              )}
                              Approve
                            </Button>
                          </div>
                        )}
                      </div>
                    </div>
                  </div>
                ))}
              </div>

              {/* Pagination */}
              {totalPages > 1 && (
                <div className="flex items-center justify-between p-6 border-t border-slate-700/50 bg-slate-800/20">
                  <div className="text-sm text-slate-400">
                    Page {currentPage} of {totalPages} • Total {total} requests
                  </div>
                  <div className="flex items-center gap-2">
                    <Button
                      variant="outline"
                      onClick={() => handlePageChange(currentPage - 1)}
                      disabled={currentPage === 1}
                      className="bg-slate-800/50 border-slate-600/50 hover:bg-slate-700/50 hover:border-red-400/50 text-slate-300 hover:text-red-400"
                    >
                      <ChevronLeft className="h-4 w-4 mr-1" />
                      Previous
                    </Button>
                    
                    <div className="flex items-center gap-1">
                      {Array.from({ length: Math.min(5, totalPages) }, (_, i) => {
                        const pageNum = Math.max(1, Math.min(totalPages - 4, currentPage - 2)) + i
                        return (
                          <Button
                            key={pageNum}
                            variant={currentPage === pageNum ? "default" : "outline"}
                            onClick={() => handlePageChange(pageNum)}
                            className={currentPage === pageNum 
                              ? "bg-gradient-to-r from-red-500 to-orange-600 text-white" 
                              : "bg-slate-800/50 border-slate-600/50 hover:bg-slate-700/50 hover:border-red-400/50 text-slate-300 hover:text-red-400"
                            }
                            size="sm"
                          >
                            {pageNum}
                          </Button>
                        )
                      })}
                    </div>

                    <Button
                      variant="outline"
                      onClick={() => handlePageChange(currentPage + 1)}
                      disabled={currentPage === totalPages}
                      className="bg-slate-800/50 border-slate-600/50 hover:bg-slate-700/50 hover:border-red-400/50 text-slate-300 hover:text-red-400"
                    >
                      Next
                      <ChevronRight className="h-4 w-4 ml-1" />
                    </Button>
                  </div>
                </div>
              )}
            </>
          )}
        </CardContent>
      </Card>
    </div>
  )
}