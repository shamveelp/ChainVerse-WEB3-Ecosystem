"use client"

import { useState, useEffect } from "react"
import { useRouter } from "next/navigation"
import { useDispatch } from "react-redux" 
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Badge } from "@/components/ui/badge"
import { Search, Eye, ChevronLeft, ChevronRight, Loader2, Users, Wallet, Shield, Zap, Activity } from 'lucide-react'
import { getUsers, getUserById } from "@/services/adminApiService"
import { setTotalUsers, setActiveUsers, setBannedUsers } from "@/redux/slices/adminStatistics" 

interface IUser {
  _id: string
  username?: string
  name: string
  email: string
  password?: string
  phone?: string
  googleId?: string | null
  refferalCode?: string
  refferedBy?: string | null
  profilePic?: string
  role?: 'user'
  totalPoints?: number
  isBlocked?: boolean
  isBanned?: boolean
  isEmailVerified?: boolean
  isGoogleUser?: boolean
  dailyCheckin?: {
    lastCheckIn: Date
    streak: number
  }
  followersCount?: number
  followingCount?: number
  createdAt: Date
  updatedAt: Date
}

export default function UserManagement() {
  const [users, setUsers] = useState<IUser[]>([])
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState<string | null>(null)
  const [currentPage, setCurrentPage] = useState(1)
  const [totalPages, setTotalPages] = useState(1)
  const [total, setTotal] = useState(0)
  const [searchQuery, setSearchQuery] = useState("")
  const [searchInput, setSearchInput] = useState("")
  const usersPerPage = 15
  const router = useRouter()
  const dispatch = useDispatch() 

  useEffect(() => {
    const fetchUsers = async () => {
      setLoading(true)
      try {
        const response = await getUsers(currentPage, usersPerPage, searchQuery)
        const usersList = response.users?.users || []
        const totalCount = response.users?.total || 0
        
        setUsers(usersList)
        setTotal(totalCount)
        setTotalPages(response.totalPages || 1)
        setError(null)

        // Update Redux store with user statistics
        dispatch(setTotalUsers(totalCount))
        
        // Calculate active and banned users
        const activeUsers = usersList.filter((user: IUser) => !user.isBanned && !user.isBlocked).length
        const bannedUsers = usersList.filter((user: IUser) => user.isBanned).length
        
        dispatch(setActiveUsers(activeUsers))
        dispatch(setBannedUsers(bannedUsers))

      } catch (err: any) {
        console.error("Error fetching users:", err)
        setError(err.response?.data?.message || "Failed to fetch users. Please try again.")
        setUsers([])
        setTotalPages(1)
      } finally {
        setLoading(false)
      }
    }
    fetchUsers()
  }, [currentPage, searchQuery, dispatch]) // Add dispatch to dependencies

  const handleSearch = () => {
    setSearchQuery(searchInput)
    setCurrentPage(1)
  }

  const handleKeyPress = (e: React.KeyboardEvent) => {
    if (e.key === "Enter") {
      handleSearch()
    }
  }

  const handleViewUser = async (userId: string) => {
    try {
      const user = await getUserById(userId)
      router.push(`/admin/user-management/${userId}`)
    } catch (err) {
      console.error("Failed to fetch user details", err)
    }
  }

  const handlePageChange = (page: number) => {
    setCurrentPage(page)
  }

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div className="space-y-2">
          <h1 className="text-4xl font-bold bg-gradient-to-r from-cyan-400 via-purple-500 to-pink-600 bg-clip-text text-transparent flex items-center gap-3">
            <Users className="h-8 w-8 text-cyan-400" />
            User Management
          </h1>
          <p className="text-slate-400 text-lg">
            Manage and monitor all Web3 ecosystem users
          </p>
        </div>
        <div className="flex items-center gap-4">
          <div className="text-right">
            <p className="text-2xl font-bold text-white">{total.toLocaleString()}</p>
            <p className="text-sm text-slate-400">Total Users</p>
          </div>
        </div>
      </div>

      {/* Search and Filters */}
      <Card className="bg-slate-900/80 backdrop-blur-xl border-slate-700/50">
        <CardContent className="p-6">
          <div className="flex gap-4 items-center">
            <div className="flex-1 relative group">
              <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 h-5 w-5 text-cyan-400/70 group-focus-within:text-cyan-400 transition-colors" />
              <Input
                placeholder="Search users by name, email, or wallet..."
                value={searchInput}
                onChange={(e: React.ChangeEvent<HTMLInputElement>) => setSearchInput(e.target.value)}
                onKeyPress={handleKeyPress}
                className="pl-10 bg-slate-800/50 border-slate-600/50 text-slate-100 placeholder:text-slate-500 focus:border-cyan-400/50 focus:ring-cyan-400/20 backdrop-blur-sm transition-all duration-300"
              />
              <div className="absolute inset-0 rounded-md bg-gradient-to-r from-cyan-400/0 via-cyan-400/5 to-cyan-400/0 opacity-0 group-focus-within:opacity-100 transition-opacity pointer-events-none" />
            </div>
            <Button 
              onClick={handleSearch} 
              className="bg-gradient-to-r from-cyan-500 to-blue-600 hover:from-cyan-400 hover:to-blue-500 text-white font-semibold px-6 transition-all duration-300 shadow-lg hover:shadow-cyan-400/25"
            >
              <Search className="h-4 w-4 mr-2" />
              Search
            </Button>
          </div>
        </CardContent>
      </Card>

      {/* Users Table */}
      <Card className="bg-slate-900/80 backdrop-blur-xl border-slate-700/50">
        <CardHeader className="border-b border-slate-700/50">
          <CardTitle className="text-white flex items-center justify-between">
            <div className="flex items-center gap-2">
              <Activity className="h-5 w-5 text-cyan-400" />
              Active Users
            </div>
            <div className="text-sm text-slate-400 font-normal">
              Showing {Math.min(currentPage * usersPerPage, total)} of {total} users
            </div>
          </CardTitle>
        </CardHeader>
        <CardContent className="p-0">
          {loading ? (
            <div className="flex items-center justify-center py-12">
              <div className="text-center space-y-4">
                <Loader2 className="h-8 w-8 animate-spin text-cyan-400 mx-auto" />
                <span className="text-slate-400">Loading blockchain users...</span>
              </div>
            </div>
          ) : error ? (
            <div className="text-center py-12 space-y-4">
              <Shield className="h-12 w-12 text-red-400 mx-auto" />
              <p className="text-red-400 mb-4">{error}</p>
              <Button 
                onClick={() => window.location.reload()}
                className="bg-red-500/20 text-red-400 border-red-500/30 hover:bg-red-500/30"
              >
                Try Again
              </Button>
            </div>
          ) : users.length === 0 ? (
            <div className="text-center py-12 space-y-4">
              <Users className="h-12 w-12 text-slate-600 mx-auto" />
              <p className="text-slate-400">No users found in the ecosystem</p>
            </div>
          ) : (
            <>
              <div className="overflow-x-auto">
                <table className="w-full">
                  <thead>
                    <tr className="border-b border-slate-700/50 bg-slate-800/30">
                      <th className="text-left py-4 px-6 text-slate-400 font-medium">User</th>
                      <th className="text-left py-4 px-6 text-slate-400 font-medium">Contact</th>
                      <th className="text-left py-4 px-6 text-slate-400 font-medium">Status</th>
                      <th className="text-left py-4 px-6 text-slate-400 font-medium">Activity</th>
                      <th className="text-left py-4 px-6 text-slate-400 font-medium">Joined</th>
                      <th className="text-left py-4 px-6 text-slate-400 font-medium">Actions</th>
                    </tr>
                  </thead>
                  <tbody>
                    {users.map((user, index) => (
                      <tr 
                        key={user._id} 
                        className="border-b border-slate-800/50 hover:bg-slate-800/30 transition-colors group"
                      >
                        <td className="py-4 px-6">
                          <div className="flex items-center gap-3">
                            <div className="w-10 h-10 rounded-full bg-gradient-to-r from-cyan-400 to-purple-600 flex items-center justify-center text-slate-900 font-bold">
                              {user.name?.charAt(0)?.toUpperCase() || 'U'}
                            </div>
                            <div>
                              <p className="text-white font-medium flex items-center gap-2">
                                {user.name || 'Unknown User'}
                                {user.isGoogleUser && (
                                  <Badge className="bg-blue-500/20 text-blue-400 border-blue-500/30 text-xs">
                                    Google
                                  </Badge>
                                )}
                              </p>
                              <p className="text-sm text-slate-400">@{user.username || 'no-username'}</p>
                            </div>
                          </div>
                        </td>
                        <td className="py-4 px-6">
                          <div>
                            <p className="text-slate-300">{user.email}</p>
                            {user.phone && (
                              <p className="text-sm text-slate-400">{user.phone}</p>
                            )}
                          </div>
                        </td>
                        <td className="py-4 px-6">
                          <div className="flex flex-col gap-2">
                            {user.isBanned ? (
                              <Badge className="bg-red-500/20 text-red-400 border-red-500/30 w-fit">
                                Banned
                              </Badge>
                            ) : user.isBlocked ? (
                              <Badge className="bg-yellow-500/20 text-yellow-400 border-yellow-500/30 w-fit">
                                Blocked
                              </Badge>
                            ) : (
                              <Badge className="bg-green-500/20 text-green-400 border-green-500/30 w-fit">
                                Active
                              </Badge>
                            )}
                            {user.isEmailVerified && (
                              <Badge className="bg-cyan-500/20 text-cyan-400 border-cyan-500/30 w-fit text-xs">
                                Verified
                              </Badge>
                            )}
                          </div>
                        </td>
                        <td className="py-4 px-6">
                          <div className="space-y-1">
                            <div className="flex items-center gap-2">
                              <Zap className="h-3 w-3 text-yellow-400" />
                              <span className="text-sm text-slate-300">{user.totalPoints  || 0} Points</span>
                            </div>
                            <div className="flex items-center gap-2">
                              <Activity className="h-3 w-3 text-cyan-400" />
                              <span className="text-sm text-slate-400">Streak: {user.dailyCheckin?.streak || 0}</span>
                            </div>
                          </div>
                        </td>
                        <td className="py-4 px-6">
                          <div>
                            <p className="text-slate-300">{new Date(user.createdAt).toLocaleDateString()}</p>
                            <p className="text-xs text-slate-500">{new Date(user.createdAt).toLocaleTimeString()}</p>
                          </div>
                        </td>
                        <td className="py-4 px-6">
                          <Button
                            variant="outline"
                            onClick={() => handleViewUser(user._id)}
                            className="bg-slate-800/50 border-slate-600/50 hover:bg-slate-700/50 hover:border-cyan-400/50 text-slate-300 hover:text-cyan-400 transition-all duration-300"
                          >
                            <Eye className="h-4 w-4 mr-2" />
                            View
                          </Button>
                        </td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>

              {/* Pagination */}
              {totalPages > 1 && (
                <div className="flex items-center justify-between p-6 border-t border-slate-700/50 bg-slate-800/20">
                  <div className="text-sm text-slate-400">
                    Page {currentPage} of {totalPages}
                  </div>
                  <div className="flex items-center gap-2">
                    <Button
                      variant="outline"
                      onClick={() => handlePageChange(currentPage - 1)}
                      disabled={currentPage === 1}
                      className="bg-slate-800/50 border-slate-600/50 hover:bg-slate-700/50 hover:border-cyan-400/50 text-slate-300 hover:text-cyan-400 disabled:opacity-50 disabled:cursor-not-allowed"
                    >
                      <ChevronLeft className="h-4 w-4 mr-1" />
                      Previous
                    </Button>
                    
                    {/* Page numbers */}
                    <div className="flex items-center gap-1">
                      {Array.from({ length: Math.min(5, totalPages) }, (_, i) => {
                        const pageNum = Math.max(1, Math.min(totalPages - 4, currentPage - 2)) + i
                        return (
                          <Button
                            key={pageNum}
                            variant={currentPage === pageNum ? "default" : "outline"}
                            onClick={() => handlePageChange(pageNum)}
                            className={currentPage === pageNum 
                              ? "bg-gradient-to-r from-cyan-500 to-blue-600 text-white" 
                              : "bg-slate-800/50 border-slate-600/50 hover:bg-slate-700/50 hover:border-cyan-400/50 text-slate-300 hover:text-cyan-400"
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
                      className="bg-slate-800/50 border-slate-600/50 hover:bg-slate-700/50 hover:border-cyan-400/50 text-slate-300 hover:text-cyan-400 disabled:opacity-50 disabled:cursor-not-allowed"
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
