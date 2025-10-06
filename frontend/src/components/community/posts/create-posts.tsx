"use client"

import { useState, useRef } from 'react'
import { Card } from "@/components/ui/card"
import { Button } from "@/components/ui/button"
import { Textarea } from "@/components/ui/textarea"
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar"
import { Image, Video, Smile, Calendar, MapPin, Hash, X, Loader2, Upload } from 'lucide-react'
import { useSelector } from 'react-redux'
import { RootState } from '@/redux/store'
import { usePosts } from '@/hooks/usePosts'
import { postsApiService } from '@/services/postsApiService'
import { toast } from 'sonner'
import { cn } from '@/lib/utils'

interface CreatePostProps {
  onPostCreated?: () => void;
  className?: string;
}

export default function CreatePost({ onPostCreated, className }: CreatePostProps) {
  const [content, setContent] = useState('')
  const [mediaUrls, setMediaUrls] = useState<string[]>([])
  const [mediaType, setMediaType] = useState<'none' | 'image' | 'video'>('none')
  const [isUploading, setIsUploading] = useState(false)
  const fileInputRef = useRef<HTMLInputElement>(null)
  
  const currentUser = useSelector((state: RootState) => state.userAuth?.user)
  const profile = useSelector((state: RootState) => state.communityProfile?.profile)
  const { createPost, loading } = usePosts()

  const handleFileUpload = async (file: File) => {
    if (!file) return

    // Validate file type
    const allowedImageTypes = ['image/jpeg', 'image/jpg', 'image/png', 'image/gif']
    const allowedVideoTypes = ['video/mp4', 'video/mpeg', 'video/quicktime']
    const allowedTypes = [...allowedImageTypes, ...allowedVideoTypes]

    if (!allowedTypes.includes(file.type)) {
      toast.error('Invalid file type', {
        description: 'Only images (JPEG, PNG, GIF) and videos (MP4, MPEG, QuickTime) are allowed'
      })
      return
    }

    // Validate file size (10MB limit)
    const maxSize = 10 * 1024 * 1024 // 10MB
    if (file.size > maxSize) {
      toast.error('File too large', {
        description: 'Maximum file size is 10MB'
      })
      return
    }

    setIsUploading(true)
    try {
      const response = await postsApiService.uploadMedia(file)
      if (response.success && response.mediaUrl) {
        setMediaUrls(prev => [...prev, response.mediaUrl!])
        setMediaType(response.mediaType || 'image')
        toast.success('Media uploaded successfully!')
      }
    } catch (error: any) {
      toast.error('Failed to upload media', {
        description: error.message || 'Please try again'
      })
    } finally {
      setIsUploading(false)
    }
  }

  const handleMediaClick = (type: 'image' | 'video') => {
    if (fileInputRef.current) {
      fileInputRef.current.accept = type === 'image' 
        ? 'image/jpeg,image/jpg,image/png,image/gif' 
        : 'video/mp4,video/mpeg,video/quicktime'
      fileInputRef.current.click()
    }
  }

  const removeMedia = (index: number) => {
    setMediaUrls(prev => prev.filter((_, i) => i !== index))
    if (mediaUrls.length === 1) {
      setMediaType('none')
    }
  }

  const handlePost = async () => {
    if (!content.trim() && mediaUrls.length === 0) {
      toast.error('Please add some content or media to your post')
      return
    }

    if (content.length > 2000) {
      toast.error('Post is too long', {
        description: 'Maximum 2000 characters allowed'
      })
      return
    }

    const postData = {
      content: content.trim(),
      mediaUrls,
      mediaType: mediaUrls.length > 0 ? mediaType : 'none'
    }

    const success = await createPost(postData)
    if (success) {
      setContent('')
      setMediaUrls([])
      setMediaType('none')
      onPostCreated?.()
    }
  }

  const getCharacterCountColor = () => {
    const length = content.length
    if (length > 1800) return 'text-red-500'
    if (length > 1500) return 'text-orange-500'
    if (length > 1000) return 'text-yellow-500'
    return 'text-slate-400'
  }

  return (
    <Card className={cn("bg-slate-900/50 backdrop-blur-sm border-slate-700/50 p-4 sm:p-6", className)}>
      <div className="flex gap-3 sm:gap-4">
        <Avatar className="w-10 sm:w-12 h-10 sm:h-12 ring-2 ring-slate-700/50 flex-shrink-0">
          <AvatarImage 
            src={profile?.profilePic || currentUser?.profileImage || ''} 
            alt={profile?.name || currentUser?.name || currentUser?.username || 'User'} 
          />
          <AvatarFallback className="bg-gradient-to-r from-cyan-500 to-purple-600 text-white">
            {(profile?.name || currentUser?.name || currentUser?.username)?.charAt(0)?.toUpperCase() || 'U'}
          </AvatarFallback>
        </Avatar>

        <div className="flex-1 min-w-0">
          <Textarea
            placeholder="What's happening in Web3?"
            value={content}
            onChange={(e) => setContent(e.target.value)}
            className="min-h-[100px] sm:min-h-[120px] resize-none border-0 bg-transparent text-lg sm:text-xl placeholder:text-slate-500 focus-visible:ring-0 focus-visible:ring-offset-0 p-0"
            maxLength={2000}
          />

          {/* Media Preview */}
          {mediaUrls.length > 0 && (
            <div className="mt-4 space-y-2">
              {mediaUrls.map((url, index) => (
                <div key={index} className="relative rounded-xl overflow-hidden border border-slate-700/50">
                  <button
                    onClick={() => removeMedia(index)}
                    className="absolute top-2 right-2 z-10 w-8 h-8 bg-black/60 hover:bg-black/80 rounded-full flex items-center justify-center transition-colors"
                  >
                    <X className="w-4 h-4 text-white" />
                  </button>
                  {mediaType === 'image' ? (
                    <img
                      src={url}
                      alt={`Upload ${index + 1}`}
                      className="w-full h-auto object-cover max-h-96"
                    />
                  ) : (
                    <video
                      src={url}
                      controls
                      className="w-full h-auto object-cover max-h-96"
                    />
                  )}
                </div>
              ))}
            </div>
          )}

          <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4 mt-4 pt-4 border-t border-slate-700/50">
            <div className="flex items-center gap-2 sm:gap-4 overflow-x-auto">
              <Button 
                variant="ghost" 
                size="icon" 
                className="text-cyan-400 hover:text-cyan-300 hover:bg-cyan-400/10 flex-shrink-0"
                onClick={() => handleMediaClick('image')}
                disabled={isUploading || loading}
              >
                <Image className="h-4 sm:h-5 w-4 sm:w-5" />
              </Button>
              <Button 
                variant="ghost" 
                size="icon" 
                className="text-cyan-400 hover:text-cyan-300 hover:bg-cyan-400/10 flex-shrink-0"
                onClick={() => handleMediaClick('video')}
                disabled={isUploading || loading}
              >
                <Video className="h-4 sm:h-5 w-4 sm:w-5" />
              </Button>
              <Button 
                variant="ghost" 
                size="icon" 
                className="text-cyan-400 hover:text-cyan-300 hover:bg-cyan-400/10 flex-shrink-0"
                disabled={isUploading || loading}
              >
                <Hash className="h-4 sm:h-5 w-4 sm:w-5" />
              </Button>
              <Button 
                variant="ghost" 
                size="icon" 
                className="text-cyan-400 hover:text-cyan-300 hover:bg-cyan-400/10 flex-shrink-0"
                disabled={isUploading || loading}
              >
                <Smile className="h-4 sm:h-5 w-4 sm:w-5" />
              </Button>
              <Button 
                variant="ghost" 
                size="icon" 
                className="text-cyan-400 hover:text-cyan-300 hover:bg-cyan-400/10 flex-shrink-0"
                disabled={isUploading || loading}
              >
                <Calendar className="h-4 sm:h-5 w-4 sm:w-5" />
              </Button>
              <Button 
                variant="ghost" 
                size="icon" 
                className="text-cyan-400 hover:text-cyan-300 hover:bg-cyan-400/10 flex-shrink-0"
                disabled={isUploading || loading}
              >
                <MapPin className="h-4 sm:h-5 w-4 sm:w-5" />
              </Button>

              {isUploading && (
                <div className="flex items-center gap-2 text-slate-400">
                  <Loader2 className="h-4 w-4 animate-spin" />
                  <span className="text-sm">Uploading...</span>
                </div>
              )}
            </div>

            <div className="flex items-center justify-between sm:justify-end gap-3">
              <div className={cn("text-sm", getCharacterCountColor())}>
                {content.length}/2000
              </div>
              <Button
                onClick={handlePost}
                disabled={(!content.trim() && mediaUrls.length === 0) || loading || isUploading || content.length > 2000}
                className="bg-gradient-to-r from-cyan-500 to-blue-600 hover:from-cyan-400 hover:to-blue-500 text-white px-4 sm:px-6 rounded-full disabled:opacity-50"
              >
                {loading && <Loader2 className="w-4 h-4 mr-2 animate-spin" />}
                Post
              </Button>
            </div>
          </div>
        </div>
      </div>

      {/* Hidden file input */}
      <input
        ref={fileInputRef}
        type="file"
        className="hidden"
        onChange={(e) => {
          const file = e.target.files?.[0]
          if (file) {
            handleFileUpload(file)
          }
        }}
      />
    </Card>
  )
}