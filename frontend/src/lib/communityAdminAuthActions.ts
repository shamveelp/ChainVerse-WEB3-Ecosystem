import { useDispatch } from 'react-redux'
import { useRouter } from 'next/navigation'
import { login, logout, setLoading, setApplicationStatus, setSubscription } from '@/redux/slices/communityAdminAuthSlice'
import { communityAdminApiService } from '@/services/communityAdminApiService'
import { communityAdminSubscriptionApiService } from '@/services/communityAdmin/communityAdminSubscriptionApiService'
import { toast } from '@/hooks/use-toast'
import { COMMUNITY_ADMIN_ROUTES } from '@/routes'

export const useCommunityAdminAuthActions = () => {
  const dispatch = useDispatch()
  const router = useRouter()

  const handleLogin = async (email: string, password: string) => {
    dispatch(setLoading(true))
    
    try {
      const result = await communityAdminApiService.login(email, password)
      
      if (result.success && result.data) {
        dispatch(login({
          ...result.data.communityAdmin,
          token: result.data.token
        }))
        
        // Fetch subscription immediately after login to set premium access
        try {
          const subscriptionResult = await communityAdminSubscriptionApiService.getSubscription()
          if (subscriptionResult.success && subscriptionResult.data) {
            dispatch(setSubscription(subscriptionResult.data))
          } else {
            // No subscription found, set to null (access will be false)
            dispatch(setSubscription(null))
          }
        } catch (subError) {
          // If subscription fetch fails, set to null (access will be false)
          console.error('Failed to fetch subscription after login:', subError)
          dispatch(setSubscription(null))
        }
        
        toast({
          title: "Success",
          description: "Login successful! Welcome back.",
        })
        
        router.push(COMMUNITY_ADMIN_ROUTES.DASHBOARD)
      } else {
        // Handle specific error cases
        if (result.error?.includes('under review')) {
          dispatch(setApplicationStatus('pending'))
          router.push(COMMUNITY_ADMIN_ROUTES.APPLICATION_SUBMITTED)
        } else if (result.error?.includes('rejected')) {
          dispatch(setApplicationStatus('rejected'))
          router.push(COMMUNITY_ADMIN_ROUTES.CREATE_COMMUNITY)
        } else {
          toast({
            title: "Login Failed",
            description: result.error || "Invalid credentials",
            variant: "destructive"
          })
        }
      }
    } catch (error: any) {
      toast({
        title: "Error",
        description: error.message || "Something went wrong during login",
        variant: "destructive"
      })
    } finally {
      dispatch(setLoading(false))
    }
  }

  const handleLogout = async () => {
    try {
      await communityAdminApiService.logout()
      dispatch(logout())
      router.push(COMMUNITY_ADMIN_ROUTES.LOGIN)
      
      toast({
        title: "Success",
        description: "Logged out successfully",
      })
    } catch (error: any) {
      // Even if API call fails, clear local state
      dispatch(logout())
      router.push(COMMUNITY_ADMIN_ROUTES.LOGIN)
    }
  }

  const checkAuthStatus = async () => {
    try {
      const result = await communityAdminApiService.getProfile()
      
      if (result.success && result.data) {
        dispatch(login({
          ...result.data.communityAdmin,
          token: 'existing' // Token is in cookies
        }))
        
        // Fetch subscription when checking auth status
        try {
          const subscriptionResult = await communityAdminSubscriptionApiService.getSubscription()
          if (subscriptionResult.success && subscriptionResult.data) {
            dispatch(setSubscription(subscriptionResult.data))
          } else {
            dispatch(setSubscription(null))
          }
        } catch (subError) {
          console.error('Failed to fetch subscription during auth check:', subError)
          dispatch(setSubscription(null))
        }
        
        return true
      } else {
        dispatch(logout())
        return false
      }
    } catch (error) {
      dispatch(logout())
      return false
    }
  }

  return {
    login: handleLogin,
    logout: handleLogout,
    checkAuthStatus
  }
} 