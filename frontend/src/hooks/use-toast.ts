"use client"

import * as React from "react"
import { toast as sonnerToast } from "sonner"
import type { ToastProps } from "@/components/ui/toast"

// Dummy types to maintain compatibility without full implementation
type ToasterToast = ToastProps & {
  id: string
  title?: React.ReactNode
  description?: React.ReactNode
  action?: any
}

function useToast() {
  return {
    toasts: [],
    toast: legacyToast,
    dismiss: (toastId?: string) => sonnerToast.dismiss(toastId),
  }
}

// Adapter to map Shadcn toast calls to Sonner
function legacyToast({ variant, title, description, action, ...props }: Omit<ToasterToast, "id">) {
  // Extract action props if available
  let actionProps: any = {}
  if (React.isValidElement(action)) {
    const { props: elementProps } = action as any
    if (elementProps) {
      // Try to get label and onClick from the action component (usually ToastAction)
      // If altText is present (common in ToastAction), use it as fallback label
      const label = elementProps.children || elementProps.altText || "Action"
      const onClick = elementProps.onClick

      if (label && onClick) {
        actionProps = {
          action: {
            label,
            onClick,
          }
        }
      }
    }
  }

  // Determine Sonner function based on variant
  const toasterFunc = variant === "destructive" ? sonnerToast.error : sonnerToast.success

  // Dispatch toast
  // If we have an action that we couldn't map to sonner's native action (e.g. no onClick),
  // we might want to append it to description or handle it differently.
  // For now, simple extraction covers common "Undo" / "Retry" cases.

  // Note: Sonner toasterFunc(message, data)
  const id = toasterFunc(title as string, {
    description: description,
    ...actionProps,
    ...props
  })

  return {
    id,
    dismiss: () => sonnerToast.dismiss(id),
    update: (props: ToasterToast) => {
      // Basic update support - usually just dismissing and showing new one is safer 
      // with pure sonner migration unless we implement complex ID tracking.
      // For now, no-op or re-toast could work, but let's leave it minimal.
    },
  }
}

// Export named toast for direct usage
export { useToast, legacyToast as toast }