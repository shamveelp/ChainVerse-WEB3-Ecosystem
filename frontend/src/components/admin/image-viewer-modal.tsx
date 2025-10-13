"use client";

import {
  Dialog,
  DialogContent,
  DialogTrigger,
  DialogTitle,
} from "@/components/ui/dialog";
import { VisuallyHidden } from "@radix-ui/react-visually-hidden";

interface ImageViewerModalProps {
  imageUrl: string;
  imageAlt: string;
  children: React.ReactNode;
}

export function ImageViewerModal({
  imageUrl,
  imageAlt,
  children,
}: ImageViewerModalProps) {
  return (
    <Dialog>
      <DialogTrigger asChild>{children}</DialogTrigger>
      <DialogContent className="max-w-4xl h-[80vh] bg-slate-900/80 backdrop-blur-xl border border-slate-700/50 p-4 flex flex-col items-center justify-center">
        {/* Hidden title for accessibility */}
        <VisuallyHidden>
          <DialogTitle>Image Viewer</DialogTitle>
        </VisuallyHidden>

        <img
          src={imageUrl}
          alt={imageAlt}
          className="max-w-full max-h-full object-contain rounded-lg"
        />
      </DialogContent>
    </Dialog>
  );
}
