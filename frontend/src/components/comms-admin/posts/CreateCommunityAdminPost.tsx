"use client";

import { useRef, useState } from "react";
import { Textarea } from "@/components/ui/textarea";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Upload, X, Image as ImageIcon, Video } from "lucide-react";
import { communityAdminPostApiService, type CreatePostData, type CommunityAdminPost } from "@/services/communityAdmin/communityAdminPostApiService";
import { toast } from "sonner";
import { cn } from "@/lib/utils";

interface CreateCommunityAdminPostProps {
  onPostCreated: (post: CommunityAdminPost) => void;
  onCancel: () => void;
}

export default function CreateCommunityAdminPost({ onPostCreated, onCancel }: CreateCommunityAdminPostProps) {
  const [content, setContent] = useState("");
  const [mediaFile, setMediaFile] = useState<File | null>(null);
  const [mediaPreview, setMediaPreview] = useState<string | null>(null);
  const [isSubmitting, setIsSubmitting] = useState(false);
  const fileInputRef = useRef<HTMLInputElement>(null);

  const handleMediaChange = (event: React.ChangeEvent<HTMLInputElement>) => {
    const file = event.target.files?.[0];
    if (!file) return;

    // Validate file type
    if (!file.type.startsWith('image/') && !file.type.startsWith('video/')) {
      toast.error("Please select an image or video file");
      return;
    }

    // Validate file size (10MB limit)
    if (file.size > 10 * 1024 * 1024) {
      toast.error("File size must be less than 10MB");
      return;
    }

    setMediaFile(file);
    setMediaPreview(URL.createObjectURL(file));
  };

  const removeMedia = () => {
    setMediaFile(null);
    setMediaPreview(null);
    if (fileInputRef.current) {
      fileInputRef.current.value = "";
    }
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!content.trim()) {
      toast.error("Post content cannot be empty");
      return;
    }

    setIsSubmitting(true);

    try {
      let mediaUrl: string | undefined;
      let mediaType: "image" | "video" | "none" = "none";

      // Upload media if present
      if (mediaFile) {
        const uploadResponse = await communityAdminPostApiService.uploadPostMedia(mediaFile);
        if (uploadResponse.success && uploadResponse.mediaUrl) {
          mediaUrl = uploadResponse.mediaUrl;
          mediaType = uploadResponse.mediaType || "image";
        } else {
          toast.error(uploadResponse.error || "Failed to upload media");
          setIsSubmitting(false);
          return;
        }
      }

      const postData: CreatePostData = {
        content: content.trim(),
        mediaUrls: mediaUrl ? [mediaUrl] : undefined,
        mediaType,
      };

      const response = await communityAdminPostApiService.createPost(postData);
      if (response.success && response.data) {
        onPostCreated(response.data);
        toast.success("Post created successfully!");
        setContent("");
        setMediaFile(null);
        setMediaPreview(null);
        if (fileInputRef.current) {
          fileInputRef.current.value = "";
        }
      } else {
        toast.error(response.error || "Failed to create post");
      }
    } catch (error: any) {
      console.error("Error creating post:", error);
      toast.error("Failed to create post");
    } finally {
      setIsSubmitting(false);
    }
  };

  return (
    <form onSubmit={handleSubmit} className="space-y-4">
      <Textarea
        value={content}
        onChange={(e) => setContent(e.target.value)}
        placeholder="What's on your mind?"
        className="bg-gray-800/50 border-gray-600/50 text-white placeholder-gray-400 min-h-[100px]"
      />

      {/* Media Preview */}
      {mediaPreview && (
        <div className="relative rounded-lg overflow-hidden">
          {mediaFile?.type.startsWith("image/") ? (
            <img src={mediaPreview} alt="Preview" className="w-full h-48 object-cover" />
          ) : (
            <video src={mediaPreview} controls className="w-full h-48 object-cover" />
          )}
          <Button
            type="button"
            onClick={removeMedia}
            className="absolute top-2 right-2 bg-red-600 hover:bg-red-700 p-1 rounded-full"
            size="sm"
          >
            <X className="w-4 h-4" />
          </Button>
        </div>
      )}

      {/* Media Upload */}
      <div className="flex items-center gap-2">
        <Button
          type="button"
          onClick={() => fileInputRef.current?.click()}
          variant="outline"
          className="border-gray-600/50 hover:bg-gray-800/50"
        >
          <Upload className="w-4 h-4 mr-2" />
          Upload Media
        </Button>
        <input
          ref={fileInputRef}
          type="file"
          accept="image/*,video/*"
          onChange={handleMediaChange}
          className="hidden"
        />
        {mediaFile && (
          <span className="text-sm text-gray-400">
            {mediaFile.type.startsWith("image/") ? (
              <ImageIcon className="w-4 h-4 inline mr-1" />
            ) : (
              <Video className="w-4 h-4 inline mr-1" />
            )}
            {mediaFile.name}
          </span>
        )}
      </div>

      <div className="flex justify-end gap-2">
        <Button
          type="button"
          variant="outline"
          onClick={onCancel}
          className="border-gray-600/50 hover:bg-gray-800/50"
        >
          Cancel
        </Button>
        <Button
          type="submit"
          disabled={isSubmitting}
          className="bg-gradient-to-r from-blue-600 to-purple-600 hover:from-blue-700 hover:to-purple-700"
        >
          {isSubmitting ? (
            <div className="w-4 h-4 border-2 border-white border-t-transparent rounded-full animate-spin mr-2" />
          ) : null}
          {isSubmitting ? "Posting..." : "Post"}
        </Button>
      </div>
    </form>
  );
}