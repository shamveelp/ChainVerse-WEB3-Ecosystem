"use client"

import { useState, useRef } from 'react'
import { Card } from "@/components/ui/card"
import { Button } from "@/components/ui/button"
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar"
import { Image, Video, Smile, Calendar, MapPin, Hash, X, Loader2, Upload, Sparkles } from 'lucide-react'
import { useSelector } from 'react-redux'
import { RootState } from '@/redux/store'
import { usePosts } from '@/hooks/usePosts'
import { postsApiService } from '@/services/postsApiService'
import { toast } from 'sonner'
import { cn } from '@/lib/utils'
import MentionTextarea from './mention-textarea'

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
        toast.success('Media uploaded successfully!', {
          description: 'Your media has been added to the post'
        })
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
    toast.success('Media removed')
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
      toast.success('Post created successfully!', {
        description: 'Your post has been shared with the community'
      })
    }
  }

  const getCharacterCountColor = () => {
    const length = content.length
    if (length > 1800) return 'text-red-500'
    if (length > 1500) return 'text-orange-500'
    if (length > 1000) return 'text-yellow-500'
    return 'text-slate-400'
  }

  const getCharacterCountWidth = () => {
    const percentage = (content.length / 2000) * 100
    return Math.min(percentage, 100)
  }

  return (
    <Card className={cn("bg-gradient-to-br from-slate-900/70 to-slate-800/70 backdrop-blur-xl border border-slate-700/50 shadow-2xl", className)}>
      <div className="p-6 sm:p-8">
        {/* Header */}
        <div className="flex items-center gap-2 mb-6">
          <Sparkles className="h-5 w-5 text-cyan-400" />
          <h3 className="text-lg font-semibold text-white">What's happening in Web3?</h3>
        </div>

        <div className="flex gap-4">
          <Avatar className="w-12 h-12 ring-2 ring-gradient-to-r from-cyan-400 to-purple-500 flex-shrink-0">
            <AvatarImage
              src={profile?.profilePic || currentUser?.profileImage || ''}
              alt={profile?.name || currentUser?.name || currentUser?.username || 'User'}
            />
            <AvatarFallback className="bg-gradient-to-r from-cyan-500 to-purple-600 text-white font-semibold">
              {(profile?.name || currentUser?.name || currentUser?.username)?.charAt(0)?.toUpperCase() || 'U'}
            </AvatarFallback>
          </Avatar>

          <div className="flex-1 min-w-0">
            <MentionTextarea
              value={content}
              onChange={setContent}
              placeholder="Share your thoughts, insights, or ask the community..."
              className="min-h-[120px] text-lg placeholder:text-slate-500 bg-transparent border-0 focus-visible:ring-0"
              maxLength={2000}
            />

            {/* Media Preview */}
            {mediaUrls.length > 0 && (
              <div className="mt-6 space-y-3">
                {mediaUrls.map((url, index) => (
                  <div key={index} className="relative rounded-xl overflow-hidden border border-slate-700/50 shadow-lg group">
                    <button
                      onClick={() => removeMedia(index)}
                      className="absolute top-3 right-3 z-10 w-8 h-8 bg-black/70 hover:bg-black/90 rounded-full flex items-center justify-center transition-all duration-200 group-hover:scale-110"
                    >
                      <X className="w-4 h-4 text-white" />
                    </button>
                    {mediaType === 'image' ? (
                      <img
                        src={url}
                        alt={`Upload ${index + 1}`}
                        className="w-full h-auto object-cover max-h-96 transition-transform duration-300 group-hover:scale-105"
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

            {/* Character Count Progress */}
            <div className="mt-4 mb-6">
              <div className="flex items-center justify-between mb-2">
                <div className="flex-1 bg-slate-800/50 rounded-full h-1 overflow-hidden">
                  <div 
                    className={cn(
                      "h-full transition-all duration-300",
                      content.length > 1800 ? "bg-red-500" :
                      content.length > 1500 ? "bg-orange-500" :
                      content.length > 1000 ? "bg-yellow-500" :
                      "bg-gradient-to-r from-cyan-500 to-blue-500"
                    )}
                    style={{ width: `${getCharacterCountWidth()}%` }}
                  />
                </div>
                <div className={cn("text-sm font-medium ml-3", getCharacterCountColor())}>
                  {content.length}/2000
                </div>
              </div>
            </div>

            {/* Action Bar */}
            <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4 pt-4 border-t border-slate-700/50">
              <div className="flex items-center gap-2 flex-wrap">
                <Button
                  variant="ghost"
                  size="sm"
                  className="text-cyan-400 hover:text-cyan-300 hover:bg-cyan-400/10 rounded-full px-3 py-2 transition-all"
                  onClick={() => handleMediaClick('image')}
                  disabled={isUploading || loading}
                >
                  <Image className="h-5 w-5 mr-2" />
                  <span className="hidden sm:inline">Photo</span>
                </Button>
                
                <Button
                  variant="ghost"
                  size="sm"
                  className="text-cyan-400 hover:text-cyan-300 hover:bg-cyan-400/10 rounded-full px-3 py-2 transition-all"
                  onClick={() => handleMediaClick('video')}
                  disabled={isUploading || loading}
                >
                  <Video className="h-5 w-5 mr-2" />
                  <span className="hidden sm:inline">Video</span>
                </Button>

                <Button
                  variant="ghost"
                  size="sm"
                  className="text-cyan-400 hover:text-cyan-300 hover:bg-cyan-400/10 rounded-full px-3 py-2 transition-all"
                  disabled={isUploading || loading}
                >
                  <Hash className="h-5 w-5" />
                </Button>

                <Button
                  variant="ghost"
                  size="sm"
                  className="text-cyan-400 hover:text-cyan-300 hover:bg-cyan-400/10 rounded-full px-3 py-2 transition-all"
                  disabled={isUploading || loading}
                >
                  <Smile className="h-5 w-5" />
                </Button>

                {isUploading && (
                  <div className="flex items-center gap-2 text-slate-400 bg-slate-800/50 px-3 py-1 rounded-full">
                    <Loader2 className="h-4 w-4 animate-spin" />
                    <span className="text-sm">Uploading...</span>
                  </div>
                )}
              </div>

              <Button
                onClick={handlePost}
                disabled={(!content.trim() && mediaUrls.length === 0) || loading || isUploading || content.length > 2000}
                className="bg-gradient-to-r from-cyan-500 to-blue-600 hover:from-cyan-400 hover:to-blue-500 text-white px-8 py-3 rounded-full font-semibold shadow-lg hover:shadow-xl transition-all disabled:opacity-50 disabled:cursor-not-allowed"
              >
                {loading && <Loader2 className="w-4 h-4 mr-2 animate-spin" />}
                {loading ? 'Posting...' : 'Post'}
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