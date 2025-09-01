import { useDispatch } from 'react-redux'
import { useRouter } from 'next/navigation'
import { login as loginAction, logout as logoutAction, setLoading } from '@/redux/slices/communityAdminAuthSlice'
import { login as loginAPI, logout as logoutAPI } from '@/services/communityAdminApiService'
import { toast } from '@/hooks/use-toast'

export const useCommunityAdminAuthActions = () => {
  const dispatch = useDispatch()
  const router = useRouter()

  const login = async (email: string, password: string) => {
    dispatch(setLoading(true))
    try {
      const response = await loginAPI(email, password)
      
      if (response.success) {
        dispatch(loginAction({
          ...response.communityAdmin,
          token: response.token
        }))
        toast({
          title: "Login Successful",
          description: "Welcome to your community dashboard",
        })
        router.push("/dashboard/community-admin")
      } else {
        if (response.status === 403) {
          toast({
            title: "Application Under Review",
            description: response.error,
            variant: "destructive"
          })
        } else {
          toast({
            title: "Login Failed",
            description: response.error || "Invalid credentials",
            variant: "destructive"
          })
        }
      }
    } catch (error: any) {
      toast({
        title: "Error",
        description: error.message || "Something went wrong",
        variant: "destructive"
      })
    } finally {
      dispatch(setLoading(false))
    }
  }

  const logout = async () => {
    try {
      await logoutAPI()
      dispatch(logoutAction())
      toast({
        title: "Logged Out",
        description: "You have been logged out successfully",
      })
      router.push("/malare/login")
    } catch (error: any) {
      console.error("Logout error:", error)
      // Still logout locally even if API call fails
      dispatch(logoutAction())
      router.push("/malare/login")
    }
  }

  return { login, logout }
}