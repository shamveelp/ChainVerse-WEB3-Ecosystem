"use client"
import { useDispatch, useSelector } from "react-redux"
import { useEffect, useCallback } from "react"
import { RootState } from "@/redux/store"
import { useToast } from "@/hooks/use-toast"
import * as userApiService from "@/services/userApiServices"
import {
  setLoading,
  setProfile,
  updateProfile,
  setError,
  clearError,
  setUsernameChecking,
  setUsernameAvailable,
  clearUsernameCheck,
} from "@/redux/slices/userProfileSlice"
import { login } from "@/redux/slices/userAuthSlice"

export function useProfile() {
  const dispatch = useDispatch()
  const { toast } = useToast()
  
  const { profile, loading, error, usernameCheck } = useSelector((state: RootState) => state.userProfile)
  const { user, token } = useSelector((state: RootState) => state.userAuth)

  const fetchProfile = useCallback(async () => {
    if (!token) return
    
    dispatch(setLoading(true))
    dispatch(clearError())
    
    try {
      const response = await userApiService.getProfile()
      if (response.success && response.data) {
        dispatch(setProfile(response.data))
      } else {
        throw new Error(response.error || "Failed to fetch profile")
      }
    } catch (error: any) {
      dispatch(setError(error.message))
    } finally {
      dispatch(setLoading(false))
    }
  }, [dispatch, token])

  const updateUserProfile = async (profileData: {
    name: string
    username: string
    phone?: string
    profilePic?: string
  }) => {
    dispatch(setLoading(true))
    dispatch(clearError())
    
    try {
      const response = await userApiService.updateProfile(profileData)
      if (response.success && response.data) {
        dispatch(updateProfile(response.data))
        
        // Update the auth user data as well
        if (user) {
          dispatch(login({ 
            user: { 
              ...user, 
              name: response.data.name,
              profileImage: response.data.profilePic 
            }, 
            token: token! 
          }))
        }
        
        toast({
          title: "Profile Updated",
          description: "Your profile has been successfully updated.",
        })
        return true
      } else {
        throw new Error(response.error || "Failed to update profile")
      }
    } catch (error: any) {
      dispatch(setError(error.message))
      toast({
        title: "Update Failed",
        description: error.message || "Failed to update profile.",
        variant: "destructive",
      })
      return false
    } finally {
      dispatch(setLoading(false))
    }
  }

  const checkUsername = async (username: string) => {
    if (!username || username.length < 3) {
      dispatch(clearUsernameCheck())
      return
    }
    
    // Don't check if it's the current username
    if (profile && username === profile.username) {
      dispatch(setUsernameAvailable({ available: true, username }))
      return
    }
    
    // Don't check if we just checked this username
    if (usernameCheck.lastChecked === username) {
      return
    }
    
    dispatch(setUsernameChecking(true))
    
    try {
      const response = await userApiService.checkUsernameAvailability(username)
      if (response.success) {
        dispatch(setUsernameAvailable({ available: response.available, username }))
      }
    } catch (error) {
      dispatch(clearUsernameCheck())
    }
  }

  const uploadProfileImage = async (file: File) => {
    try {
      const response = await userApiService.uploadProfileImage(file)
      if (response.success && response.imageUrl) {
        return response.imageUrl
      } else {
        throw new Error(response.error || "Failed to upload image")
      }
    } catch (error: any) {
      toast({
        title: "Upload Failed",
        description: error.message || "Failed to upload profile image.",
        variant: "destructive",
      })
      throw error
    }
  }

  // Auto-fetch profile when component mounts and user is authenticated
  useEffect(() => {
    if (token && !profile && !loading) {
      fetchProfile()
    }
  }, [token, profile, loading, fetchProfile])

  return {
    profile,
    loading,
    error,
    usernameCheck,
    fetchProfile,
    updateUserProfile,
    checkUsername,
    uploadProfileImage,
    clearError: () => dispatch(clearError()),
  }
}