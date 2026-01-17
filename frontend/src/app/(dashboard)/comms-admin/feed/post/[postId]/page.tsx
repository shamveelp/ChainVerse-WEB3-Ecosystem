"use client"

import { useState, useEffect, useRef, useCallback } from "react"
import { useParams, useRouter } from "next/navigation"
import { toast } from "sonner"
import { Loader2, ArrowLeft, MessageSquare, Send, Heart, Share, MoreHorizontal, Pin, Trash2, MessageCircle } from "lucide-react"
import { Button } from "@/components/ui/button"
import { Card, CardContent } from "@/components/ui/card"
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar"
import { Textarea } from "@/components/ui/textarea"
import { Badge } from "@/components/ui/badge"
import { Separator } from "@/components/ui/separator"
import { cn } from "@/lib/utils"
// import communityAdminFeedApiService from "@/services/communityAdmin/communityAdminFeedApiService"
import { DropdownMenu, DropdownMenuContent, DropdownMenuItem, DropdownMenuTrigger } from "@/components/ui/dropdown-menu"
import { Dialog, DialogContent, DialogDescription, DialogFooter, DialogHeader, DialogTitle } from "@/components/ui/dialog"
import communityAdminFeedApiService from "@/services/communityAdmin/communityAdminFeedApiService"

// Types (should match service)
interface PostAuthor {
    _id: string;
    username: string;
    name: string;
    profilePic: string;
    isVerified: boolean;
    isCommunityMember: boolean;
}

interface CommunityPost {
    _id: string;
    author: PostAuthor;
    content: string;
    mediaUrls: string[];
    mediaType: 'none' | 'image' | 'video';
    hashtags: string[];
    mentions: string[];
    likesCount: number;
    commentsCount: number;
    sharesCount: number;
    isLiked: boolean;
    isOwnPost: boolean;
    canModerate: boolean;
    createdAt: Date | string;
    updatedAt: Date | string;
    editedAt?: Date | string;
}

interface Comment {
    _id: string;
    author: {
        _id: string;
        username: string;
        name: string;
        profilePic: string;
        isVerified: boolean;
    };
    content: string;
    createdAt: string;
    likesCount: number;
    isLiked: boolean;
    postedAsCommunity: boolean;
    community?: {
        _id: string;
        username: string;
        name: string; // Assuming community has a name
        profilePic: string; // Assuming community has a logo/profilePic
    };
}


export default function CommunityAdminPostDetails() {
    const { postId } = useParams()
    const router = useRouter()

    const [post, setPost] = useState<CommunityPost | null>(null)
    const [loading, setLoading] = useState(true)
    const [comments, setComments] = useState<Comment[]>([])
    const [loadingComments, setLoadingComments] = useState(false)
    const [commentsCursor, setCommentsCursor] = useState<string | undefined>(undefined)
    const [hasMoreComments, setHasMoreComments] = useState(true)
    const [newComment, setNewComment] = useState("")
    const [submittingComment, setSubmittingComment] = useState(false)

    // Infinite scroll for comments
    const observerRef = useRef<IntersectionObserver>(null)
    const lastCommentRef = useCallback((node: HTMLDivElement) => {
        if (loadingComments) return
        if (observerRef.current) observerRef.current.disconnect()

        observerRef.current = new IntersectionObserver(entries => {
            if (entries[0].isIntersecting && hasMoreComments) {
                loadComments()
            }
        })

        if (node) observerRef.current.observe(node)
    }, [loadingComments, hasMoreComments])


    useEffect(() => {
        if (postId) {
            loadPost()
            loadComments(true)
        }
    }, [postId])

    const loadPost = async () => {
        try {
            const response = await communityAdminFeedApiService.getPostById(postId as string)
            if (response.success && response.data) {
                setPost(response.data)
            } else {
                toast.error(response.error || "Failed to load post")
            }
        } catch (error) {
            console.error("Error loading post:", error)
            toast.error("An error occurred while loading the post")
        } finally {
            setLoading(false)
        }
    }

    const loadComments = async (isInitial = false) => {
        try {
            if (!isInitial && !hasMoreComments) return;
            setLoadingComments(true)
            const response = await communityAdminFeedApiService.getPostComments(postId as string, isInitial ? undefined : commentsCursor)
            if (response.success && response.data) {
                const data = response.data as any
                if (isInitial) {
                    setComments(data.comments)
                } else {
                    setComments(prev => [...prev, ...data.comments])
                }
                setCommentsCursor(data.nextCursor)
                setHasMoreComments(data.hasMore)
            }
        } catch (error) {
            console.error("Error loading comments:", error)
        } finally {
            setLoadingComments(false)
        }
    }


    const handleCreateComment = async () => {
        if (!newComment.trim()) return

        setSubmittingComment(true)
        try {
            const response = await communityAdminFeedApiService.createComment({
                postId: postId as string,
                content: newComment,
            })

            if (response.success) {
                toast.success("Comment posted successfully")
                setNewComment("")
                // Reload comments or append locally
                // For simplicity, reload first page
                loadComments(true)
                // Update post comment count
                if (post) {
                    setPost({ ...post, commentsCount: post.commentsCount + 1 })
                }
            } else {
                toast.error(response.error || "Failed to post comment")
            }
        } catch (error) {
            console.error("Error creating comment:", error)
            toast.error("Failed to post comment")
        } finally {
            setSubmittingComment(false)
        }
    }

    const renderContent = (content: string) => {
        // Basic hashtag/mention rendering
        return <p className="text-gray-200 whitespace-pre-wrap">{content}</p>
    }

    const renderMedia = (post: CommunityPost) => {
        if (post.mediaType === 'none' || !post.mediaUrls.length) return null;

        return (
            <div className="mt-3 grid gap-2">
                {post.mediaUrls.map((url, i) => (
                    <div key={i} className="relative rounded-lg overflow-hidden bg-gray-900 border border-red-900/20">
                        {post.mediaType === 'image' ? (
                            <img src={url} alt="Post media" className="w-full h-auto object-contain max-h-[500px]" />
                        ) : (
                            <video src={url} controls className="w-full h-auto max-h-[500px]" />
                        )}
                    </div>
                ))}
            </div>
        )
    }

    if (loading) {
        return (
            <div className="flex items-center justify-center min-h-screen">
                <Loader2 className="w-8 h-8 animate-spin text-red-500" />
            </div>
        )
    }

    if (!post) {
        return (
            <div className="text-center py-12">
                <h3 className="text-lg font-semibold text-white mb-2">Post not found</h3>
                <Button onClick={() => router.back()} variant="outline">Go Back</Button>
            </div>
        )
    }

    return (
        <div className="max-w-3xl mx-auto space-y-6 pb-20">
            <Button
                variant="ghost"
                className="text-gray-400 hover:text-white mb-4 pl-0 hover:bg-transparent"
                onClick={() => router.back()}
            >
                <ArrowLeft className="w-4 h-4 mr-2" />
                Back to Feed
            </Button>

            <Card className="bg-black/60 backdrop-blur-xl border-red-800/30">
                <div className="p-6">
                    {/* Header */}
                    <div className="flex items-start justify-between mb-4">
                        <div className="flex items-center gap-3">
                            <Avatar className="w-12 h-12 ring-2 ring-red-700/50">
                                <AvatarImage src={post.author.profilePic} />
                                <AvatarFallback>{post.author.name[0]}</AvatarFallback>
                            </Avatar>
                            <div>
                                <div className="flex items-center gap-2">
                                    <h3 className="font-semibold text-white">{post.author.name}</h3>
                                    {post.author.isVerified && (
                                        <Badge variant="secondary" className="bg-blue-500/20 text-blue-300 hover:bg-blue-500/30">
                                            Verified
                                        </Badge>
                                    )}
                                </div>
                                <p className="text-sm text-gray-400">@{post.author.username} · {communityAdminFeedApiService.formatTimeAgo(post.createdAt)}</p>
                            </div>
                        </div>
                    </div>

                    {/* Content & Media */}
                    <div className="mb-6">
                        {renderContent(post.content)}
                        {renderMedia(post)}
                    </div>

                    <Separator className="bg-red-800/30 my-4" />

                    {/* Comment Input */}
                    <div className="flex gap-4 mb-8">
                        <div className="flex-1">
                            <Textarea
                                value={newComment}
                                onChange={(e) => setNewComment(e.target.value)}
                                placeholder="Write a comment as Community..."
                                className="bg-black/40 border-red-800/30 min-h-[80px] text-white resize-none focus:ring-red-500/50"
                            />
                            <div className="flex justify-between items-center mt-2">
                                <p className="text-xs text-gray-500">Posting as Community Admin</p>
                                <Button
                                    onClick={handleCreateComment}
                                    disabled={!newComment.trim() || submittingComment}
                                    className="bg-red-600 hover:bg-red-700 text-white"
                                >
                                    {submittingComment ? <Loader2 className="w-4 h-4 animate-spin mr-2" /> : <Send className="w-4 h-4 mr-2" />}
                                    Post Comment
                                </Button>
                            </div>
                        </div>
                    </div>

                    {/* Comments List */}
                    <div className="space-y-4">
                        <h3 className="text-lg font-semibold text-white mb-4">Comments ({post.commentsCount})</h3>
                        {comments.length === 0 ? (
                            <p className="text-gray-500 text-center py-8">No comments yet. Be the first to comment!</p>
                        ) : (
                            comments.map((comment, idx) => (
                                <div key={comment._id} ref={idx === comments.length - 1 ? lastCommentRef : undefined} className="flex gap-3">
                                    <Avatar className="w-8 h-8 ring-1 ring-red-800/30">
                                        <AvatarImage src={comment.postedAsCommunity ? comment.community?.profilePic : comment.author.profilePic} />
                                        <AvatarFallback>{comment.postedAsCommunity ? "C" : comment.author.name[0]}</AvatarFallback>
                                    </Avatar>
                                    <div className="flex-1 bg-white/5 rounded-lg p-3 border border-red-800/10">
                                        <div className="flex justify-between items-start mb-1">
                                            <div className="flex items-center gap-2">
                                                <span className={cn("font-medium text-sm", comment.postedAsCommunity ? "text-red-400" : "text-white")}>
                                                    {comment.postedAsCommunity ? comment.community?.name || "Community" : comment.author.name}
                                                </span>
                                                {comment.postedAsCommunity && <Badge variant="outline" className="text-[10px] h-4 px-1 border-red-500/50 text-red-500">Community</Badge>}
                                                <span className="text-xs text-gray-500">{communityAdminFeedApiService.formatTimeAgo(comment.createdAt)}</span>
                                            </div>
                                        </div>
                                        <p className="text-gray-300 text-sm whitespace-pre-wrap">{comment.content}</p>
                                    </div>
                                </div>
                            ))
                        )}
                        {loadingComments && (
                            <div className="flex justify-center py-4">
                                <Loader2 className="w-5 h-5 animate-spin text-red-500" />
                            </div>
                        )}
                    </div>
                </div>
            </Card>
        </div>
    )
}
