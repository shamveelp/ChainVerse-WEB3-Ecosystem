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

        // Handle new message event (if user is in the conversation room)
        const handleNewMessage = (data: any) => {
            const { message, conversation } = data

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
        const handleConversationUpdated = (data: any) => {
            const { conversation } = data
            const lastMessage = conversation.lastMessage

            if (!lastMessage) return

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

            toast.info(`New message from ${lastMessage.sender.name || senderUsername}`, {
                description: lastMessage.content.length > 50 ? `${lastMessage.content.substring(0, 50)}...` : lastMessage.content,
                action: {
                    label: "Reply",
                    onClick: () => router.push(chatPath)
                },
                duration: 5000,
            })
        }

        socketService.onNewMessage(handleNewMessage)
        socketService.onConversationUpdated(handleConversationUpdated)

        return () => {
            socketService.offNewMessage(handleNewMessage)
            socketService.offConversationUpdated(handleConversationUpdated)
        }
    }, [token, currentUser, pathname, router])

    return null
}
