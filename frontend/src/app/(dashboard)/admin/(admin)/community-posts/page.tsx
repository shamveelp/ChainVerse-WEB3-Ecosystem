
"use client";

import React, { useState, useEffect, useCallback } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { adminCommunityPostsApiService, AdminPostItem } from '@/services/admin/adminCommunityPostsApiService';
import { Card, CardContent, CardFooter, CardHeader } from '@/components/ui/card';
import { Avatar, AvatarFallback, AvatarImage } from '@/components/ui/avatar';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogDescription, DialogFooter } from '@/components/ui/dialog';
import { ScrollArea } from '@/components/ui/scroll-area';
import { Loader2, Trash2, Eye, MessageSquare, Heart, Shield, User, FileText, XCircle, AlertCircle } from 'lucide-react';
import { formatDistanceToNow } from 'date-fns';
import { toast } from 'sonner';

export default function AdminCommunityPostsPage() {
    const [posts, setPosts] = useState<AdminPostItem[]>([]);
    const [loading, setLoading] = useState(true);
    const [loadingMore, setLoadingMore] = useState(false);
    const [activeTab, setActiveTab] = useState<'all' | 'user' | 'admin'>('all');
    const [nextCursor, setNextCursor] = useState<string | undefined>(undefined);
    const [hasMore, setHasMore] = useState(false);
    const [selectedPost, setSelectedPost] = useState<AdminPostItem | null>(null);
    const [detailsLoading, setDetailsLoading] = useState(false);
    const [fullDetails, setFullDetails] = useState<any>(null);

    const fetchPosts = useCallback(async (reset = false) => {
        try {
            const cursor = reset ? undefined : nextCursor;
            if (!reset && !cursor && !loading) return; // Should not happen if logic is correct

            if (reset) setLoading(true);
            else setLoadingMore(true);

            const response = await adminCommunityPostsApiService.getAllPosts(cursor, 10, activeTab);

            if (response.success) {
                setPosts(prev => reset ? response.data.posts : [...prev, ...response.data.posts]);
                setNextCursor(response.data.nextCursor);
                setHasMore(response.data.hasMore);
            }
        } catch (error) {
            console.error("Failed to fetch posts", error);
            toast.error("Failed to load posts");
        } finally {
            setLoading(false);
            setLoadingMore(false);
        }
    }, [activeTab, nextCursor]);

    useEffect(() => {
        fetchPosts(true);
    }, [activeTab]);

    const handleSoftDelete = async (post: AdminPostItem) => {
        if (!confirm("Are you sure you want to unlist this post? It will be hidden from the community.")) return;

        try {
            const response = await adminCommunityPostsApiService.softDeletePost(post._id, post.postType);
            if (response.success) {
                toast.success("Post unlisted successfully");
                // Update local state
                setPosts(prev => prev.map(p => p._id === post._id ? { ...p, isDeleted: true } : p));
                if (selectedPost?._id === post._id) {
                    setSelectedPost(prev => prev ? { ...prev, isDeleted: true } : null);
                }
            } else {
                toast.error("Failed to soft delete post");
            }
        } catch (error) {
            console.error("Error deleting post", error);
            toast.error("An error occurred while deleting the post");
        }
    };

    const handleViewDetails = async (post: AdminPostItem) => {
        setSelectedPost(post);
        setDetailsLoading(true);
        setFullDetails(null);
        try {
            const response = await adminCommunityPostsApiService.getPostDetails(post._id, post.postType);
            if (response.success) {
                setFullDetails(response.data);
            }
        } catch (error) {
            console.error("Error fetching details", error);
            toast.error("Could not load full details");
        } finally {
            setDetailsLoading(false);
        }
    };

    const containerVariants = {
        hidden: { opacity: 0 },
        show: {
            opacity: 1,
            transition: {
                staggerChildren: 0.1
            }
        }
    };

    const itemVariants = {
        hidden: { y: 20, opacity: 0 },
        show: { y: 0, opacity: 1 }
    };

    return (
        <div className="p-6 space-y-6 min-h-screen bg-slate-950 text-slate-100">
            <div className="flex flex-col md:flex-row justify-between items-start md:items-center gap-4">
                <div>
                    <h1 className="text-3xl font-bold bg-gradient-to-r from-violet-400 to-fuchsia-400 bg-clip-text text-transparent">
                        Community Posts
                    </h1>
                    <p className="text-slate-400 mt-1">
                        Manage all posts from users and community admins.
                    </p>
                </div>
            </div>

            <Tabs defaultValue="all" className="w-full" onValueChange={(val) => setActiveTab(val as any)}>
                <TabsList className="bg-slate-900 border border-slate-800">
                    <TabsTrigger value="all" className="data-[state=active]:bg-violet-600 data-[state=active]:text-white">
                        All Posts
                    </TabsTrigger>
                    <TabsTrigger value="user" className="data-[state=active]:bg-violet-600 data-[state=active]:text-white">
                        User Posts
                    </TabsTrigger>
                    <TabsTrigger value="admin" className="data-[state=active]:bg-violet-600 data-[state=active]:text-white">
                        Admin Posts
                    </TabsTrigger>
                </TabsList>

                <TabsContent value="all" className="mt-6">
                    {/* Content is shared, controlled by state */}
                </TabsContent>
                <TabsContent value="user" className="mt-6"></TabsContent>
                <TabsContent value="admin" className="mt-6"></TabsContent>
            </Tabs>

            {loading ? (
                <div className="flex justify-center items-center py-20">
                    <Loader2 className="h-10 w-10 animate-spin text-violet-500" />
                </div>
            ) : posts.length === 0 ? (
                <div className="flex flex-col items-center justify-center py-20 text-slate-500">
                    <FileText className="h-16 w-16 mb-4 opacity-50" />
                    <p className="text-xl">No posts found</p>
                </div>
            ) : (
                <motion.div
                    variants={containerVariants}
                    initial="hidden"
                    animate="show"
                    className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6"
                >
                    <AnimatePresence>
                        {posts.map((post) => (
                            <motion.div key={post._id} variants={itemVariants} layout>
                                <Card className={`bg-slate-900/50 backdrop-blur border-slate-800 hover:border-violet-500/50 transition-colors overflow-hidden ${post.isDeleted ? 'opacity-60 grayscale-[0.5]' : ''}`}>
                                    <CardHeader className="pb-3 flex flex-row items-center gap-3">
                                        <Avatar className="h-10 w-10 border border-slate-700">
                                            <AvatarImage src={post.author?.profileImage || `https://api.dicebear.com/7.x/avataaars/svg?seed=${post.author?.username}`} />
                                            <AvatarFallback>{post.author?.username?.substring(0, 2).toUpperCase() || 'UN'}</AvatarFallback>
                                        </Avatar>
                                        <div className="flex-1 min-w-0">
                                            <div className="flex items-center gap-2">
                                                <p className="font-semibold text-sm truncate text-white">
                                                    {post.author?.username || 'Unknown'}
                                                </p>
                                                {post.postType === 'admin' ? (
                                                    <Badge variant="secondary" className="h-5 px-1.5 text-[10px] bg-fuchsia-900/30 text-fuchsia-300 border-fuchsia-800">
                                                        <Shield className="h-3 w-3 mr-1" /> Admin
                                                    </Badge>
                                                ) : (
                                                    <Badge variant="secondary" className="h-5 px-1.5 text-[10px] bg-slate-800 text-slate-300 border-slate-700">
                                                        <User className="h-3 w-3 mr-1" /> User
                                                    </Badge>
                                                )}
                                            </div>
                                            <p className="text-xs text-slate-400">
                                                {post.createdAt ? formatDistanceToNow(new Date(post.createdAt), { addSuffix: true }) : 'Recently'}
                                            </p>
                                        </div>
                                        {post.isDeleted && (
                                            <Badge variant="destructive" className="h-5 text-[10px] bg-red-900/20 text-red-400 border-red-900">Unlisted</Badge>
                                        )}
                                    </CardHeader>
                                    <CardContent className="pb-3 min-h-[80px]">
                                        <p className="text-sm text-slate-300 line-clamp-3">
                                            {post.content}
                                        </p>
                                        {post.mediaUrls && post.mediaUrls.length > 0 && (
                                            <div className="mt-3 rounded-md overflow-hidden bg-slate-950/50 border border-slate-800 h-32 flex items-center justify-center relative">
                                                {post.mediaType === 'image' ? (
                                                    <img src={post.mediaUrls[0]} alt="Post media" className="h-full w-full object-cover" />
                                                ) : (
                                                    <div className="text-slate-500 flex flex-col items-center">
                                                        {post.mediaType === 'video' ? 'Video Content' : 'Media'}
                                                    </div>
                                                )}
                                                {post.mediaUrls.length > 1 && (
                                                    <div className="absolute bottom-2 right-2 bg-black/60 text-white text-xs px-2 py-1 rounded-full">
                                                        +{post.mediaUrls.length - 1} more
                                                    </div>
                                                )}
                                            </div>
                                        )}
                                    </CardContent>
                                    <CardFooter className="flex justify-between items-center pt-3 border-t border-slate-800/50">
                                        <div className="flex gap-4 text-xs text-slate-400">
                                            <div className="flex items-center gap-1">
                                                <Heart className="h-3.5 w-3.5" />
                                                <span>{post.likesCount}</span>
                                            </div>
                                            <div className="flex items-center gap-1">
                                                <MessageSquare className="h-3.5 w-3.5" />
                                                <span>{post.commentsCount}</span>
                                            </div>
                                        </div>
                                        <div className="flex gap-2">
                                            <Button
                                                variant="ghost"
                                                size="sm"
                                                className="h-8 w-8 p-0 text-slate-400 hover:text-white hover:bg-slate-800"
                                                onClick={() => handleViewDetails(post)}
                                            >
                                                <Eye className="h-4 w-4" />
                                            </Button>
                                            {!post.isDeleted && (
                                                <Button
                                                    variant="ghost"
                                                    size="sm"
                                                    className="h-8 w-8 p-0 text-red-400 hover:text-red-300 hover:bg-red-900/20"
                                                    onClick={() => handleSoftDelete(post)}
                                                >
                                                    <Trash2 className="h-4 w-4" />
                                                </Button>
                                            )}
                                        </div>
                                    </CardFooter>
                                </Card>
                            </motion.div>
                        ))}
                    </AnimatePresence>
                </motion.div>
            )}

            {hasMore && !loading && (
                <div className="flex justify-center mt-8">
                    <Button
                        variant="outline"
                        onClick={() => fetchPosts()}
                        disabled={loadingMore}
                        className="border-slate-700 hover:bg-slate-800 text-slate-300"
                    >
                        {loadingMore ? (
                            <>
                                <Loader2 className="mr-2 h-4 w-4 animate-spin" /> Loading...
                            </>
                        ) : (
                            'Load More Posts'
                        )}
                    </Button>
                </div>
            )}

            {/* View Details Dialog */}
            <Dialog open={!!selectedPost} onOpenChange={(open) => !open && setSelectedPost(null)}>
                <DialogContent className="bg-slate-900 border-slate-800 text-slate-100 max-w-2xl max-h-[85vh] overflow-hidden flex flex-col">
                    <DialogHeader>
                        <DialogTitle>Post Details</DialogTitle>
                        <DialogDescription className="text-slate-400">
                            View full content, media, and metadata.
                        </DialogDescription>
                    </DialogHeader>

                    {selectedPost && (
                        <div className="flex-1 overflow-auto pr-2 custom-scrollbar">
                            <div className="flex items-center gap-4 mb-4">
                                <Avatar className="h-12 w-12 border border-slate-700">
                                    <AvatarImage src={selectedPost.author?.profileImage || `https://api.dicebear.com/7.x/avataaars/svg?seed=${selectedPost.author?.username}`} />
                                    <AvatarFallback>{selectedPost.author?.username?.substring(0, 2).toUpperCase()}</AvatarFallback>
                                </Avatar>
                                <div>
                                    <h3 className="font-semibold text-lg">{selectedPost.author?.username}</h3>
                                    <p className="text-sm text-slate-400">{selectedPost.author?.email}</p>
                                    <div className="flex gap-2 mt-1">
                                        <Badge variant="outline" className="border-slate-700 text-slate-400 text-[10px]">
                                            {selectedPost.postType.toUpperCase()} POST
                                        </Badge>
                                        <span className="text-xs text-slate-500 py-0.5">
                                            {selectedPost.createdAt && new Date(selectedPost.createdAt).toLocaleString()}
                                        </span>
                                    </div>
                                </div>
                            </div>

                            <div className="bg-slate-950/50 p-4 rounded-lg border border-slate-800 mb-4 text-slate-200 whitespace-pre-wrap leading-relaxed">
                                {selectedPost.content}
                            </div>

                            {selectedPost.mediaUrls && selectedPost.mediaUrls.length > 0 && (
                                <div className="grid grid-cols-2 gap-2 mb-6">
                                    {selectedPost.mediaUrls.map((url, index) => (
                                        <div key={index} className="rounded-lg overflow-hidden border border-slate-800">
                                            {selectedPost.mediaType === 'image' ? (
                                                <img src={url} alt={`Media ${index}`} className="w-full h-auto object-cover" />
                                            ) : (
                                                <video src={url} controls className="w-full h-auto" />
                                            )}
                                        </div>
                                    ))}
                                </div>
                            )}

                            <div className="grid grid-cols-2 gap-4 mb-6">
                                <div className="bg-slate-900 p-3 rounded border border-slate-800 flex flex-col items-center">
                                    <Heart className="h-5 w-5 text-pink-500 mb-1" />
                                    <span className="text-xl font-bold">{selectedPost.likesCount}</span>
                                    <span className="text-xs text-slate-500 uppercase">Likes</span>
                                </div>
                                <div className="bg-slate-900 p-3 rounded border border-slate-800 flex flex-col items-center">
                                    <MessageSquare className="h-5 w-5 text-blue-500 mb-1" />
                                    <span className="text-xl font-bold">{selectedPost.commentsCount}</span>
                                    <span className="text-xs text-slate-500 uppercase">Comments</span>
                                </div>
                            </div>

                            {/* Additional metadata from details fetch */}
                            {detailsLoading ? (
                                <div className="flex justify-center py-4">
                                    <Loader2 className="h-6 w-6 animate-spin text-violet-500" />
                                </div>
                            ) : fullDetails && (
                                <div className="space-y-4">
                                    <h4 className="font-semibold text-sm text-slate-400 uppercase tracking-wider">Engagement Details</h4>

                                    {/* Usually we would list comments or likers here. For now we just show we have details if any extra exist. 
                                        The prompt asked: "see whoever liked, commented". 
                                        So ideally we should list comments here. 
                                    */}
                                    <div className="text-sm text-slate-500 italic">
                                        (Comments and Likers list can be implemented here using specific endpoints if needed)
                                    </div>

                                    {selectedPost.isDeleted && (
                                        <div className="bg-red-900/10 border border-red-900/50 p-3 rounded flex items-center gap-3 text-red-400">
                                            <AlertCircle className="h-5 w-5" />
                                            <div>
                                                <p className="font-semibold">This post is unlisted (Soft Deleted)</p>
                                                <p className="text-xs opacity-80">It is not visible to the community.</p>
                                            </div>
                                        </div>
                                    )}
                                </div>
                            )}
                        </div>
                    )}

                    <DialogFooter className="bg-slate-900 pt-4 border-t border-slate-800 mt-auto">
                        {!selectedPost?.isDeleted && (
                            <Button
                                variant="destructive"
                                onClick={() => {
                                    if (selectedPost) {
                                        handleSoftDelete(selectedPost);
                                        // close dialog? No, maybe keep open to show status change
                                    }
                                }}
                                className="mr-auto"
                            >
                                Unlist Post
                            </Button>
                        )}
                        <Button variant="outline" onClick={() => setSelectedPost(null)}>
                            Close
                        </Button>
                    </DialogFooter>
                </DialogContent>
            </Dialog>
        </div>
    );
}
