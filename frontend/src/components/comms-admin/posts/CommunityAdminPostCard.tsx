"use client";

import { useState, useRef } from "react";
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar";
import { Button } from "@/components/ui/button";
import { Textarea } from "@/components/ui/textarea";
import { Badge } from "@/components/ui/badge";
import { Heart, MessageCircle, Share, MoreHorizontal, Edit3, Trash2, Loader2, Image as ImageIcon, Video } from "lucide-react";
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogFooter } from "@/components/ui/dialog";
import { communityAdminPostApiService, type CommunityAdminPost } from "@/services/communityAdmin/communityAdminPostApiService";
import { toast } from "sonner";
import { cn } from "@/lib/utils";

interface CommunityAdminPostCardProps {
  post: CommunityAdminPost;
  onLikeToggle: (postId: string, isLiked: boolean, likesCount: number) => void;
  onPostUpdate: (post: CommunityAdminPost) => void;
  onPostDelete: (postId: string) => void;
}

export default function CommunityAdminPostCard({ post, onLikeToggle, onPostUpdate, onPostDelete }: CommunityAdminPostCardProps) {
  const [isEditing, setIsEditing] = useState(false);
  const [editContent, setEditContent] = useState(post.content);
  const [isSaving, setIsSaving] = useState(false);
  const [isDeleting, setIsDeleting] = useState(false);
  const [showDeleteDialog, setShowDeleteDialog] = useState(false);

  const handleLikeToggle = async () => {
    try {
      const response = await communityAdminPostApiService.togglePostLike(post._id);
      if (response.success && response.data) {
        onLikeToggle(post._id, response.data.isLiked, response.data.likesCount);
        toast.success(response.data.isLiked ? "Post liked!" : "Post unliked!");
      } else {
        toast.error(response.error || "Failed to toggle like");
      }
    } catch (error: any) {
      console.error("Error toggling like:", error);
      toast.error("Failed to toggle like");
    }
  };

  const handleEditSubmit = async () => {
    if (!editContent.trim()) {
      toast.error("Post content cannot be empty");
      return;
    }

    setIsSaving(true);
    try {
      const response = await communityAdminPostApiService.updatePost(post._id, {
        content: editContent.trim(),
        mediaUrls: post.mediaUrls,
      });
      if (response.success && response.data) {
        onPostUpdate(response.data);
        setIsEditing(false);
        toast.success("Post updated successfully!");
      } else {
        toast.error(response.error || "Failed to update post");
      }
    } catch (error: any) {
      console.error("Error updating post:", error);
      toast.error("Failed to update post");
    } finally {
      setIsSaving(false);
    }
  };

  const handleDelete = async () => {
    setIsDeleting(true);
    try {
      const response = await communityAdminPostApiService.deletePost(post._id);
      if (response.success) {
        onPostDelete(post._id);
        setShowDeleteDialog(false);
        toast.success("Post deleted successfully!");
      } else {
        toast.error(response.error || "Failed to delete post");
      }
    } catch (error: any) {
      console.error("Error deleting post:", error);
      toast.error("Failed to delete post");
    } finally {
      setIsDeleting(false);
    }
  };

  const formatTimeAgo = (date: Date | string) => {
    return communityAdminPostApiService.formatTimeAgo(date);
  };

  return (
    <div className="bg-gray-900/50 border border-gray-700/50 rounded-lg p-4 space-y-4">
      <div className="flex items-start gap-3">
        <Avatar className="w-10 h-10">
          <AvatarImage src={post.author.profilePic} alt={post.author.name} />
          <AvatarFallback>{post.author.name.charAt(0).toUpperCase()}</AvatarFallback>
        </Avatar>
        <div className="flex-1">
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-2">
              <span className="font-semibold text-white">{post.author.name}</span>
              {post.author.isVerified && (
                <Badge variant="outline" className="border-blue-500 text-blue-400">
                  Verified
                </Badge>
              )}
              <span className="text-gray-400 text-sm">{formatTimeAgo(post.createdAt)}</span>
            </div>
            {(post.canEdit || post.canDelete) && (
              <DropdownMenu>
                <DropdownMenuTrigger asChild>
                  <Button variant="ghost" size="sm" className="text-gray-400 hover:text-white">
                    <MoreHorizontal className="w-4 h-4" />
                  </Button>
                </DropdownMenuTrigger>
                <DropdownMenuContent className="bg-gray-800 border-gray-700">
                  {post.canEdit && (
                    <DropdownMenuItem onClick={() => setIsEditing(true)}>
                      <Edit3 className="w-4 h-4 mr-2" />
                      Edit Post
                    </DropdownMenuItem>
                  )}
                  {post.canDelete && (
                    <DropdownMenuItem onClick={() => setShowDeleteDialog(true)} className="text-red-400">
                      <Trash2 className="w-4 h-4 mr-2" />
                      Delete Post
                    </DropdownMenuItem>
                  )}
                </DropdownMenuContent>
              </DropdownMenu>
            )}
          </div>
          {post.author.communityName && (
            <p className="text-sm text-gray-400">{post.author.communityName}</p>
          )}
        </div>
      </div>

      {isEditing ? (
        <div className="space-y-3">
          <Textarea
            value={editContent}
            onChange={(e) => setEditContent(e.target.value)}
            className="bg-gray-800/50 border-gray-600/50 text-white"
            rows={4}
          />
          <div className="flex justify-end gap-2">
            <Button
              variant="outline"
              onClick={() => {
                setIsEditing(false);
                setEditContent(post.content);
              }}
              className="border-gray-600/50 hover:bg-gray-800/50"
            >
              Cancel
            </Button>
            <Button
              onClick={handleEditSubmit}
              disabled={isSaving}
              className="bg-gradient-to-r from-blue-600 to-purple-600 hover:from-blue-700 hover:to-purple-700"
            >
              {isSaving ? (
                <Loader2 className="w-4 h-4 mr-2 animate-spin" />
              ) : null}
              Save
            </Button>
          </div>
        </div>
      ) : (
        <>
          <p className="text-gray-200">{post.content}</p>
          {post.mediaUrls.length > 0 && post.mediaType !== "none" && (
            <div className="mt-2">
              {post.mediaType === "image" ? (
                <img
                  src={post.mediaUrls[0]}
                  alt="Post media"
                  className="w-full max-h-96 object-cover rounded-lg"
                />
              ) : (
                <video
                  src={post.mediaUrls[0]}
                  controls
                  className="w-full max-h-96 object-cover rounded-lg"
                />
              )}
            </div>
          )}
        </>
      )}

      <div className="flex items-center gap-4 text-gray-400">
        <Button
          variant="ghost"
          size="sm"
          onClick={handleLikeToggle}
          className={cn(post.isLiked ? "text-red-500" : "text-gray-400", "hover:text-red-400")}
        >
          <Heart className={cn("w-4 h-4 mr-2", post.isLiked ? "fill-red-500" : "")} />
          {communityAdminPostApiService.formatStats(post.likesCount)}
        </Button>
        <Button variant="ghost" size="sm" className="hover:text-blue-400">
          <MessageCircle className="w-4 h-4 mr-2" />
          {communityAdminPostApiService.formatStats(post.commentsCount)}
        </Button>
        <Button variant="ghost" size="sm" className="hover:text-green-400">
          <Share className="w-4 h-4 mr-2" />
          {communityAdminPostApiService.formatStats(post.sharesCount)}
        </Button>
      </div>

      {/* Delete Confirmation Dialog */}
      <Dialog open={showDeleteDialog} onOpenChange={setShowDeleteDialog}>
        <DialogContent className="bg-black/90 backdrop-blur-xl border-gray-700/50">
          <DialogHeader>
            <DialogTitle className="text-white">Delete Post</DialogTitle>
          </DialogHeader>
          <p className="text-gray-400">Are you sure you want to delete this post? This action cannot be undone.</p>
          <DialogFooter>
            <Button
              variant="outline"
              onClick={() => setShowDeleteDialog(false)}
              className="border-gray-600/50 hover:bg-gray-800/50"
            >
              Cancel
            </Button>
            <Button
              onClick={handleDelete}
              disabled={isDeleting}
              className="bg-red-600 hover:bg-red-700"
            >
              {isDeleting ? (
                <Loader2 className="w-4 h-4 mr-2 animate-spin" />
              ) : null}
              Delete
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </div>
  );
}