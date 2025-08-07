import { useDispatch } from 'react-redux'
import { useRouter } from 'next/navigation'
import { login as loginAction, logout as logoutAction, setLoading, setApplicationStatus } from '@/redux/slices/communityAdminAuthSlice'
import { login as loginAPI, logout as logoutAPI } from '@/services/communityAdminApiService'
import { toast } from '@/hooks/use-toast'

export const useCommunityAdminAuthActions = () => {
  const dispatch = useDispatch()
  const router = useRouter()

  const login = async (email: string, password: string) => {
    dispatch(setLoading(true))
    
    try {
      const result = await loginAPI(email, password)
      
      if (result.success) {
        dispatch(loginAction({
          ...result.communityAdmin,
          token: result.token
        }))
        
        toast({
          title: "Success",
          description: "Login successful!",
        })
        
        router.push('/malare/')
      } else {
        if (result.status === 401) {
          if (result.error?.includes('under review')) {
            dispatch(setApplicationStatus('pending'))
          } else if (result.error?.includes('rejected')) {
            dispatch(setApplicationStatus('rejected'))
          }
        }
        
        toast({
          title: "Error",
          description: result.error || "Login failed",
          variant: "destructive"
        })
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
      router.push('/malare/login')
      
      toast({
        title: "Success",
        description: "Logged out successfully",
      })
    } catch (error: any) {
      toast({
        title: "Error",
        description: error.message || "Logout failed",
        variant: "destructive"
      })
    }
  }

  return { login, logout }
}
