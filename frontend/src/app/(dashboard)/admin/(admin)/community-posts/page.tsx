
"use client";

import React, { useState, useEffect, useCallback } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { adminCommunityPostsApiService, AdminPostItem } from '@/services/admin/adminCommunityPostsApiService';
import { Card, CardContent, CardFooter, CardHeader } from '@/components/ui/card';
import { Avatar, AvatarFallback, AvatarImage } from '@/components/ui/avatar';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogDescription, DialogFooter } from '@/components/ui/dialog';
import { ScrollArea } from '@/components/ui/scroll-area';
import { Loader2, Trash2, RotateCcw, Eye, MessageSquare, Heart, Shield, User, FileText, AlertCircle, ExternalLink, Search } from 'lucide-react';
import { formatDistanceToNow } from 'date-fns';
import { toast } from 'sonner';
import Link from 'next/link';
import { useDebounce } from 'use-debounce';

export default function AdminCommunityPostsPage() {
    const [posts, setPosts] = useState<AdminPostItem[]>([]);
    const [loading, setLoading] = useState(true);
    const [loadingMore, setLoadingMore] = useState(false);
    const [activeTab, setActiveTab] = useState<'all' | 'user' | 'admin'>('all');
    const [nextCursor, setNextCursor] = useState<string | undefined>(undefined);
    const [hasMore, setHasMore] = useState(false);
    const [searchQuery, setSearchQuery] = useState('');
    const [debouncedSearch] = useDebounce(searchQuery, 500);

    // Details Dialog State
    const [selectedPost, setSelectedPost] = useState<AdminPostItem | null>(null);
    const [detailsTab, setDetailsTab] = useState('overview');

    // Comments State
    const [comments, setComments] = useState<any[]>([]);
    const [commentsLoading, setCommentsLoading] = useState(false);
    const [commentsCursor, setCommentsCursor] = useState<string | undefined>(undefined);
    const [commentsHasMore, setCommentsHasMore] = useState(false);

    // Likers State
    const [likers, setLikers] = useState<any[]>([]);
    const [likersLoading, setLikersLoading] = useState(false);
    const [likersCursor, setLikersCursor] = useState<string | undefined>(undefined);
    const [likersHasMore, setLikersHasMore] = useState(false);

    const fetchPosts = useCallback(async (reset = false) => {
        try {
            const cursor = reset ? undefined : nextCursor;
            if (!reset && !cursor && !loading) return;

            if (reset) setLoading(true);
            else setLoadingMore(true);

            // Pass debouncedSearch to API
            const response = await adminCommunityPostsApiService.getAllPosts(cursor, 10, activeTab, debouncedSearch);

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
    }, [activeTab, nextCursor, debouncedSearch]);

    useEffect(() => {
        setNextCursor(undefined);
        setPosts([]);
        fetchPosts(true);
    }, [activeTab, debouncedSearch]); // Trigger on tab change or search change

    // Fetch Details (Comments/Likers)
    const fetchComments = async (reset = false) => {
        if (!selectedPost) return;
        try {
            const cursor = reset ? undefined : commentsCursor;
            setCommentsLoading(true);
            const response = await adminCommunityPostsApiService.getPostComments(selectedPost._id, selectedPost.postType, cursor, 10);
            if (response.success) {
                setComments(prev => reset ? response.data.comments : [...prev, ...response.data.comments]);
                setCommentsCursor(response.data.nextCursor);
                setCommentsHasMore(response.data.hasMore);
            }
        } catch (error) {
            console.error("Failed to fetch comments", error);
        } finally {
            setCommentsLoading(false);
        }
    };

    const fetchLikers = async (reset = false) => {
        if (!selectedPost) return;
        try {
            const cursor = reset ? undefined : likersCursor;
            setLikersLoading(true);
            const response = await adminCommunityPostsApiService.getPostLikers(selectedPost._id, selectedPost.postType, cursor, 10);
            if (response.success) {
                setLikers(prev => reset ? response.data.likers : [...prev, ...response.data.likers]);
                setLikersCursor(response.data.nextCursor);
                setLikersHasMore(response.data.hasMore);
            }
        } catch (error) {
            console.error("Failed to fetch likers", error);
        } finally {
            setLikersLoading(false);
        }
    };

    // Reset details state when dialog opens/closes
    useEffect(() => {
        if (selectedPost) {
            setDetailsTab('overview');
            setComments([]);
            setLikers([]);
            setCommentsCursor(undefined);
            setLikersCursor(undefined);
        }
    }, [selectedPost]);

    // Load data when tabs change
    useEffect(() => {
        if (detailsTab === 'comments' && comments.length === 0 && selectedPost) {
            fetchComments(true);
        } else if (detailsTab === 'likes' && likers.length === 0 && selectedPost) {
            fetchLikers(true);
        }
    }, [detailsTab, selectedPost]);


    const handleSoftDelete = async (post: AdminPostItem) => {
        if (!confirm("Are you sure you want to unlist this post? It will be hidden from the community.")) return;

        try {
            const response = await adminCommunityPostsApiService.softDeletePost(post._id, post.postType);
            if (response.success) {
                toast.success("Post unlisted successfully");
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

    const handleRestorePost = async (post: AdminPostItem) => {
        if (!confirm("Are you sure you want to restore this post? It will be visible to the community again.")) return;

        try {
            const response = await adminCommunityPostsApiService.restorePost(post._id, post.postType);
            if (response.success) {
                toast.success("Post restored successfully");
                setPosts(prev => prev.map(p => p._id === post._id ? { ...p, isDeleted: false } : p));
                if (selectedPost?._id === post._id) {
                    setSelectedPost(prev => prev ? { ...prev, isDeleted: false } : null);
                }
            } else {
                toast.error("Failed to restore post");
            }
        } catch (error) {
            console.error("Error restoring post", error);
            toast.error("An error occurred while restoring the post");
        }
    };

    // Animation Variants
    const containerVariants = {
        hidden: { opacity: 0 },
        show: { opacity: 1, transition: { staggerChildren: 0.1 } }
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

            <div className="flex flex-col sm:flex-row gap-4 items-center justify-between">
                <Tabs defaultValue="all" className="w-full sm:w-auto" onValueChange={(val) => setActiveTab(val as any)}>
                    <TabsList className="bg-slate-900 border border-slate-800">
                        <TabsTrigger value="all" className="data-[state=active]:bg-violet-600 data-[state=active]:text-white">All Posts</TabsTrigger>
                        <TabsTrigger value="user" className="data-[state=active]:bg-violet-600 data-[state=active]:text-white">User Posts</TabsTrigger>
                        <TabsTrigger value="admin" className="data-[state=active]:bg-violet-600 data-[state=active]:text-white">Admin Posts</TabsTrigger>
                    </TabsList>
                </Tabs>
                <div className="relative w-full sm:w-72">
                    <Search className="absolute left-2 top-2.5 h-4 w-4 text-slate-500" />
                    <Input
                        placeholder="Search posts, hashtags, users..."
                        className="pl-8 bg-slate-900 border-slate-800 focus:border-violet-500 text-slate-200"
                        value={searchQuery}
                        onChange={(e) => setSearchQuery(e.target.value)}
                    />
                </div>
            </div>

            {loading ? (
                <div className="flex justify-center items-center py-20">
                    <Loader2 className="h-10 w-10 animate-spin text-violet-500" />
                </div>
            ) : posts.length === 0 ? (
                <div className="flex flex-col items-center justify-center py-20 text-slate-500">
                    <FileText className="h-16 w-16 mb-4 opacity-50" />
                    <p className="text-xl">No posts found</p>
                    {searchQuery && <p className="text-sm mt-2 opacity-70">Try using different keywords</p>}
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
                                <Card className={`bg-slate-900/50 backdrop-blur border-slate-800 hover:border-violet-500/50 transition-colors overflow-hidden flex flex-col h-full ${post.isDeleted ? 'opacity-60 grayscale-[0.5]' : ''}`}>
                                    <CardHeader className="pb-3 flex flex-row items-center gap-3">
                                        <Avatar className="h-10 w-10 border border-slate-700">
                                            <AvatarImage src={post.author?.profileImage || `https://api.dicebear.com/7.x/avataaars/svg?seed=${post.author?.username}`} />
                                            <AvatarFallback>{post.author?.username?.substring(0, 2).toUpperCase() || 'UN'}</AvatarFallback>
                                        </Avatar>
                                        <div className="flex-1 min-w-0">
                                            <div className="flex items-center gap-2">
                                                <Link href={`/admin/user-management/${post.author?._id}`} className="hover:underline hover:text-violet-400 transition-colors" onClick={(e) => e.stopPropagation()}>
                                                    <p className="font-semibold text-sm truncate text-white">
                                                        {post.author?.username || 'Unknown'}
                                                    </p>
                                                </Link>
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
                                    <CardContent className="pb-3 flex-1">
                                        <p className="text-sm text-slate-300 line-clamp-3 mb-2">
                                            {post.content}
                                        </p>
                                        {post.mediaUrls && post.mediaUrls.length > 0 && (
                                            <div className="rounded-md overflow-hidden bg-slate-950/50 border border-slate-800 h-32 flex items-center justify-center relative">
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
                                    <CardFooter className="flex justify-between items-center pt-3 border-t border-slate-800/50 mt-auto">
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
                                                onClick={() => setSelectedPost(post)}
                                            >
                                                <Eye className="h-4 w-4" />
                                            </Button>

                                            {!post.isDeleted ? (
                                                <Button
                                                    variant="ghost"
                                                    size="sm"
                                                    className="h-8 w-8 p-0 text-red-400 hover:text-red-300 hover:bg-red-900/20"
                                                    onClick={() => handleSoftDelete(post)}
                                                    title="Unlist Post"
                                                >
                                                    <Trash2 className="h-4 w-4" />
                                                </Button>
                                            ) : (
                                                <Button
                                                    variant="ghost"
                                                    size="sm"
                                                    className="h-8 w-8 p-0 text-green-400 hover:text-green-300 hover:bg-green-900/20"
                                                    onClick={() => handleRestorePost(post)}
                                                    title="Restore Post"
                                                >
                                                    <RotateCcw className="h-4 w-4" />
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
                        {loadingMore ? (<><Loader2 className="mr-2 h-4 w-4 animate-spin" /> Loading...</>) : 'Load More Posts'}
                    </Button>
                </div>
            )}

            {/* View Details Dialog */}
            <Dialog open={!!selectedPost} onOpenChange={(open) => !open && setSelectedPost(null)}>
                <DialogContent className="bg-slate-900 border-slate-800 text-slate-100 max-w-3xl max-h-[85vh] h-[800px] flex flex-col p-0 gap-0 overflow-hidden">
                    <DialogHeader className="p-6 pb-2 border-b border-slate-800 bg-slate-950">
                        <DialogTitle>Post Details</DialogTitle>
                        <DialogDescription className="text-slate-400">
                            Details for {selectedPost?.author?.username || 'user'}
                        </DialogDescription>
                        {selectedPost && (
                            <div className="flex items-center gap-2 mt-2">
                                <Avatar className="h-8 w-8 border border-slate-700">
                                    <AvatarImage src={selectedPost.author?.profileImage} />
                                    <AvatarFallback>{selectedPost.author?.username?.substring(0, 2).toUpperCase()}</AvatarFallback>
                                </Avatar>
                                <span className="text-slate-200 font-medium">{selectedPost.author?.username}</span>
                                <span className="text-slate-600">•</span>
                                <span className="text-xs">{formatDistanceToNow(new Date(selectedPost.createdAt), { addSuffix: true })}</span>
                            </div>
                        )}
                    </DialogHeader>

                    {selectedPost && (
                        <Tabs value={detailsTab} onValueChange={setDetailsTab} className="flex-1 flex flex-col">
                            <div className="px-6 pt-2 bg-slate-950 border-b border-slate-800">
                                <TabsList className="bg-slate-900 border border-slate-800">
                                    <TabsTrigger value="overview" className="data-[state=active]:bg-violet-600 data-[state=active]:text-white">Overview</TabsTrigger>
                                    <TabsTrigger value="comments" className="data-[state=active]:bg-violet-600 data-[state=active]:text-white">
                                        Comments ({selectedPost.commentsCount})
                                    </TabsTrigger>
                                    <TabsTrigger value="likes" className="data-[state=active]:bg-violet-600 data-[state=active]:text-white">
                                        Likes ({selectedPost.likesCount})
                                    </TabsTrigger>
                                </TabsList>
                            </div>

                            <div className="flex-1 overflow-auto bg-slate-900 relative">
                                <TabsContent value="overview" className="p-6 m-0 h-full overflow-y-auto">
                                    <div className="space-y-6">
                                        <div className="bg-slate-950/50 p-4 rounded-lg border border-slate-800 text-slate-200 whitespace-pre-wrap leading-relaxed">
                                            {selectedPost.content}
                                        </div>

                                        {selectedPost.mediaUrls && selectedPost.mediaUrls.length > 0 && (
                                            <div className="grid grid-cols-2 gap-3">
                                                {selectedPost.mediaUrls.map((url, index) => (
                                                    <div key={index} className="rounded-lg overflow-hidden border border-slate-800 relative group aspect-video">
                                                        {selectedPost.mediaType === 'image' ? (
                                                            <img src={url} alt={`Media ${index}`} className="w-full h-full object-cover" />
                                                        ) : (
                                                            <video src={url} controls className="w-full h-full bg-black" />
                                                        )}
                                                        <a href={url} target="_blank" rel="noopener noreferrer" className="absolute top-2 right-2 bg-black/50 p-1.5 rounded-full text-white opacity-0 group-hover:opacity-100 transition-opacity">
                                                            <ExternalLink className="h-4 w-4" />
                                                        </a>
                                                    </div>
                                                ))}
                                            </div>
                                        )}

                                        <div className="grid grid-cols-2 gap-4">
                                            <div className="bg-slate-800/50 p-4 rounded-lg border border-slate-700/50 flex flex-col items-center justify-center">
                                                <Heart className="h-6 w-6 text-pink-500 mb-2" />
                                                <span className="text-2xl font-bold">{selectedPost.likesCount}</span>
                                                <span className="text-sm text-slate-400">Total Likes</span>
                                            </div>
                                            <div className="bg-slate-800/50 p-4 rounded-lg border border-slate-700/50 flex flex-col items-center justify-center">
                                                <MessageSquare className="h-6 w-6 text-blue-500 mb-2" />
                                                <span className="text-2xl font-bold">{selectedPost.commentsCount}</span>
                                                <span className="text-sm text-slate-400">Total Comments</span>
                                            </div>
                                        </div>

                                        {selectedPost.isDeleted && (
                                            <div className="bg-red-900/10 border border-red-900/50 p-4 rounded-lg flex items-start gap-3 mt-4">
                                                <AlertCircle className="h-5 w-5 text-red-500 shrink-0 mt-0.5" />
                                                <div>
                                                    <h4 className="font-semibold text-red-400">Post Unlisted</h4>
                                                    <p className="text-sm text-red-300/70 mt-1">
                                                        This post has been soft-deleted by an admin. It is no longer visible to the community.
                                                    </p>
                                                </div>
                                            </div>
                                        )}
                                    </div>
                                </TabsContent>

                                <TabsContent value="comments" className="p-0 m-0 h-full flex flex-col">
                                    {commentsLoading && comments.length === 0 ? (
                                        <div className="flex-1 flex justify-center items-center">
                                            <Loader2 className="h-8 w-8 animate-spin text-violet-500" />
                                        </div>
                                    ) : comments.length === 0 ? (
                                        <div className="flex-1 flex flex-col justify-center items-center text-slate-500">
                                            <MessageSquare className="h-12 w-12 mb-2 opacity-50" />
                                            <p>No comments yet</p>
                                        </div>
                                    ) : (
                                        <ScrollArea className="flex-1">
                                            <div className="p-6 space-y-4">
                                                {comments.map((comment) => (
                                                    <div key={comment._id} className="flex gap-4 p-4 rounded-lg bg-slate-950/30 border border-slate-800/50">
                                                        <Link href={`/admin/user-management/${comment.author?._id}`}>
                                                            <Avatar className="h-8 w-8 border border-slate-700 cursor-pointer hover:border-violet-500">
                                                                <AvatarImage src={comment.author?.profileImage} />
                                                                <AvatarFallback>{comment.author?.username?.substring(0, 2).toUpperCase() || 'UN'}</AvatarFallback>
                                                            </Avatar>
                                                        </Link>
                                                        <div className="flex-1">
                                                            <div className="flex justify-between items-start">
                                                                <Link href={`/admin/user-management/${comment.author?._id}`} className="hover:underline hover:text-violet-400">
                                                                    <h4 className="font-medium text-sm text-slate-200">{comment.author?.username || 'Unknown'}</h4>
                                                                </Link>
                                                                <span className="text-xs text-slate-500">{formatDistanceToNow(new Date(comment.createdAt), { addSuffix: true })}</span>
                                                            </div>
                                                            <p className="text-slate-400 text-sm mt-1">{comment.content}</p>
                                                        </div>
                                                    </div>
                                                ))}
                                                {commentsHasMore && (
                                                    <div className="flex justify-center pt-2">
                                                        <Button variant="ghost" size="sm" onClick={() => fetchComments()} disabled={commentsLoading} className="text-slate-400">
                                                            {commentsLoading ? <Loader2 className="h-3 w-3 animate-spin mr-2" /> : null}
                                                            Load More Comments
                                                        </Button>
                                                    </div>
                                                )}
                                            </div>
                                        </ScrollArea>
                                    )}
                                </TabsContent>

                                <TabsContent value="likes" className="p-0 m-0 h-full flex flex-col">
                                    {likersLoading && likers.length === 0 ? (
                                        <div className="flex-1 flex justify-center items-center">
                                            <Loader2 className="h-8 w-8 animate-spin text-violet-500" />
                                        </div>
                                    ) : likers.length === 0 ? (
                                        <div className="flex-1 flex flex-col justify-center items-center text-slate-500">
                                            <Heart className="h-12 w-12 mb-2 opacity-50" />
                                            <p>No likes yet</p>
                                        </div>
                                    ) : (
                                        <ScrollArea className="flex-1">
                                            <div className="p-6 grid grid-cols-1 sm:grid-cols-2 gap-3">
                                                {likers.map((like) => (
                                                    <Link key={like._id} href={`/admin/user-management/${like.user?._id}`}>
                                                        <div className="flex items-center gap-3 p-3 rounded-lg bg-slate-950/30 border border-slate-800/50 hover:bg-slate-800/50 hover:border-violet-500/30 transition-all cursor-pointer group">
                                                            <Avatar className="h-10 w-10 border border-slate-700 group-hover:border-violet-500/50">
                                                                <AvatarImage src={like.user?.profileImage} />
                                                                <AvatarFallback>{like.user?.username?.substring(0, 2).toUpperCase() || 'UN'}</AvatarFallback>
                                                            </Avatar>
                                                            <div>
                                                                <h4 className="font-medium text-sm text-slate-200 group-hover:text-violet-400">{like.user?.username || 'Unknown'}</h4>
                                                                <span className="text-xs text-slate-500">{like.user?.email}</span>
                                                            </div>
                                                        </div>
                                                    </Link>
                                                ))}
                                            </div>
                                            {likersHasMore && (
                                                <div className="flex justify-center p-4">
                                                    <Button variant="ghost" size="sm" onClick={() => fetchLikers()} disabled={likersLoading} className="text-slate-400">
                                                        {likersLoading ? <Loader2 className="h-3 w-3 animate-spin mr-2" /> : null}
                                                        Load More Likers
                                                    </Button>
                                                </div>
                                            )}
                                        </ScrollArea>
                                    )}
                                </TabsContent>
                            </div>
                        </Tabs>
                    )}

                    <DialogFooter className="p-4 border-t border-slate-800 bg-slate-950 flex justify-between items-center w-full">
                        {!selectedPost?.isDeleted ? (
                            <Button
                                variant="destructive"
                                size="sm"
                                onClick={() => selectedPost && handleSoftDelete(selectedPost)}
                            >
                                Unlist Post
                            </Button>
                        ) : (
                            <Button
                                variant="outline"
                                size="sm"
                                className="text-green-400 border-green-900/50 hover:bg-green-900/20 hover:text-green-300"
                                onClick={() => selectedPost && handleRestorePost(selectedPost)}
                            >
                                Restore Post
                            </Button>
                        )}
                        <Button variant="outline" size="sm" onClick={() => setSelectedPost(null)}>
                            Close
                        </Button>
                    </DialogFooter>
                </DialogContent>
            </Dialog>
        </div>
    );
}
