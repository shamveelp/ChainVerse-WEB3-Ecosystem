"use client";

import { useState } from "react";
import {
  Dialog,
  DialogContent,
  DialogTrigger,
  DialogTitle,
} from "@/components/ui/dialog";
import { VisuallyHidden } from "@radix-ui/react-visually-hidden";
import { Button } from "@/components/ui/button";
import { ZoomIn, ZoomOut } from "lucide-react";
import Image from "next/image";

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
  const [zoom, setZoom] = useState(1);

  const handleZoomIn = () => setZoom((z) => Math.min(z + 0.25, 3)); // max 3x
  const handleZoomOut = () => setZoom((z) => Math.max(z - 0.25, 0.5)); // min 0.5x
  const handleReset = () => setZoom(1);

  return (
    <Dialog onOpenChange={(open) => !open && handleReset()}>
      <DialogTrigger asChild>{children}</DialogTrigger>

      <DialogContent
        className="
          max-w-5xl
          w-[90vw]
          h-[80vh]
          bg-slate-900/90
          backdrop-blur-xl
          border border-slate-700/50
          p-4
          flex
          items-center
          justify-center
          overflow-hidden
          rounded-2xl
          shadow-2xl
          top-[50%] left-[50%]
          -translate-x-1/2 -translate-y-1/2
          fixed
        "
      >
        <VisuallyHidden>
          <DialogTitle>Image Viewer</DialogTitle>
        </VisuallyHidden>

        {/* Zoom Controls on Left */}
        <div className="absolute top-4 left-4 flex gap-2 z-10">
          <Button size="icon" variant="secondary" onClick={handleZoomOut}>
            <ZoomOut className="w-4 h-4" />
          </Button>
          <Button size="icon" variant="secondary" onClick={handleZoomIn}>
            <ZoomIn className="w-4 h-4" />
          </Button>
        </div>

        {/* Image */}
        <div className="flex items-center justify-center w-full h-full overflow-auto">
          <Image
            src={imageUrl}
            alt={imageAlt}
            style={{
              transform: `scale(${zoom})`,
              transition: "transform 0.3s ease",
            }}
            className="max-w-full max-h-full object-contain select-none"
          />
        </div>
      </DialogContent>
    </Dialog>
  );
}
