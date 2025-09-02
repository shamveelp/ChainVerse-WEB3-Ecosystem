import { useDispatch } from 'react-redux'
import { useRouter } from 'next/navigation'
import { login, logout, setLoading, setApplicationStatus } from '@/redux/slices/communityAdminAuthSlice'
import { communityAdminApiService } from '@/services/communityAdminApiService'
import { toast } from '@/hooks/use-toast'

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
        
        toast({
          title: "Success",
          description: "Login successful! Welcome back.",
        })
        
        router.push('/comms-admin')
      } else {
        // Handle specific error cases
        if (result.error?.includes('under review')) {
          dispatch(setApplicationStatus('pending'))
          router.push('/comms-admin/application-submitted')
        } else if (result.error?.includes('rejected')) {
          dispatch(setApplicationStatus('rejected'))
          router.push('/comms-admin/create-community')
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
      router.push('/comms-admin/login')
      
      toast({
        title: "Success",
        description: "Logged out successfully",
      })
    } catch (error: any) {
      // Even if API call fails, clear local state
      dispatch(logout())
      router.push('/comms-admin/login')
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