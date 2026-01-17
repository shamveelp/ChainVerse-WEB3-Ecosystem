"use client"

import { useEffect, useRef } from "react"
import { useSelector } from "react-redux"
import { useRouter, usePathname } from "next/navigation"
import { toast } from "sonner"
import { socketService } from "@/services/socketService"
import { RootState } from "@/redux/store"

export function GlobalChatListener() {
    const router = useRouter()
    const pathname = usePathname()
    const currentUser = useSelector((state: RootState) => state.userAuth?.user)
    const token = useSelector((state: RootState) => state.userAuth?.token)

    // Use a ref to track if we've already connected in this instance
    const connectedRef = useRef(false)
    // Use a ref to track processed message IDs to prevent duplicates
    const processedMessageIds = useRef<Set<string>>(new Set())

    useEffect(() => {
        if (!token || !currentUser) return

        const connectSocket = async () => {
            try {
                if (!socketService.isConnected()) {
                    await socketService.connect(token)
                    connectedRef.current = true
                }
            } catch (error) {
                console.error("Global socket connection failed:", error)
            }
        }

        connectSocket()

        // Helper to check and mark message as processed
        const isMessageProcessed = (messageId: string) => {
            if (processedMessageIds.current.has(messageId)) return true
            processedMessageIds.current.add(messageId)
            // Clear from set after 10 seconds to allow memory cleanup
            setTimeout(() => {
                processedMessageIds.current.delete(messageId)
            }, 10000)
            return false
        }

        // Handle new message event (if user is in the conversation room)
        const handleNewMessage = (data: unknown) => {
            const { message } = data as { message: { _id: string; sender: { _id: string; username: string; name?: string }; content: string } }

            if (isMessageProcessed(message._id)) return

            // Don't show toast for own messages
            if (message.sender._id === currentUser._id) return

            const senderUsername = message.sender.username
            const chatPath = `/user/community/messages/${senderUsername}`

            // Don't show toast if already on the chat page with this user
            if (pathname === chatPath) return

            toast.info(`New message from ${message.sender.name || senderUsername}`, {
                description: message.content.length > 50 ? `${message.content.substring(0, 50)}...` : message.content,
                action: {
                    label: "Reply",
                    onClick: () => router.push(chatPath)
                },
                duration: 5000,
            })
        }

        // Handle conversation updated event (if user is NOT in the conversation room but online)
        // This is broadcast to the user's personal room
        const handleConversationUpdated = (data: unknown) => {
            const { conversation } = data as { conversation: { lastMessage: { _id: string; sender: { _id: string; username: string; name?: string } | string; content: string } } }
            const lastMessage = conversation.lastMessage

            if (!lastMessage) return

            if (isMessageProcessed(lastMessage._id)) return

            // Don't show toast for own messages
            // Check if lastMessage.sender matches current user
            // lastMessage.sender might be an object or ID depending on population
            const senderId = typeof lastMessage.sender === 'object' ? lastMessage.sender._id : lastMessage.sender

            if (senderId === currentUser._id) return

            const senderUsername = typeof lastMessage.sender === 'object' ? lastMessage.sender.username : 'User' // Fallback if username missing
            const chatPath = `/user/community/messages/${senderUsername}`

            // Don't show toast if already on the chat page
            if (pathname === chatPath) return

            // Avoid duplicate toasts if we received both new_message and conversation_updated
            // Ideally check if a toast for this message ID was already shown? 
            // sonner doesn't easily return ID check, but we can rely on different event sources.
            // Usually you get `new_message` ONLY if you are in the room. `conversation_updated` always.
            // Wait, if I am in the room, I get new_message. If I am NOT in the room, I do NOT get new_message.
            // So checking pathname is enough to distinguish?
            // Actually `conversation_updated` is sent to `user:{userId}`.
            // If I am in the chat room, I am ALSO in `user:{userId}`. So I might get both.
            // But `handleNewMessage` is for `new_message` event which is emitted to `conversation:{id}`.
            // If I am in `conversation:{id}`, I get `new_message`.
            // `conversation_updated` is emitted to `user:{userId}`.

            // So if I am in the chat, I get both. 
            // If I am in the chat, `pathname === chatPath` will be true, so I suppress both.

            // If I am NOT in the chat:
            // I am NOT in `conversation:{id}`. So I DO NOT get `new_message`.
            // I AM in `user:{userId}`. So I DO get `conversation_updated`.

            // So I only need to handle `conversation_updated` for notifications when NOT in chat.
            // However, check if `socketService.onNewMessage` is global?
            // `socketService.joinConversation` is called by the chat page.
            // So if I am not on the chat page, I haven't joined the conversation room.
            // Thus I won't receive `new_message`.

            // So `handleConversationUpdated` is the key listener for global (out-of-chat) notifications.

            const senderName = typeof lastMessage.sender === 'object' ? lastMessage.sender.name : '';
            toast.info(`New message from ${senderName || senderUsername}`, {
                description: lastMessage.content.length > 50 ? `${lastMessage.content.substring(0, 50)}...` : lastMessage.content,
                action: {
                    label: "Reply",
                    onClick: () => router.push(chatPath)
                },
                duration: 5000,
            })
        }

        // Handle Community Notifications
        const handleCommunityNotification = (data: unknown) => {
            const { type, title, message, link, messageId, communityId } = data as { type: string; title: string; message: string; link?: string; messageId?: string; communityId?: string };

            if (messageId && isMessageProcessed(messageId)) return;

            // Don't show toast if on the relevant page
            if (link && pathname === link) return;

            toast.info(title, {
                description: message.length > 50 ? `${message.substring(0, 50)}...` : message,
                action: link ? {
                    label: "View",
                    onClick: () => router.push(link)
                } : undefined,
                duration: 5000,
            });
        };

        socketService.onNewMessage(handleNewMessage)
        socketService.onConversationUpdated(handleConversationUpdated)
        socketService.on('community_notification', handleCommunityNotification)

        return () => {
            socketService.offNewMessage(handleNewMessage)
            socketService.offConversationUpdated(handleConversationUpdated)
            socketService.off('community_notification', handleCommunityNotification)
        }
    }, [token, currentUser, pathname, router])

    return null
}
