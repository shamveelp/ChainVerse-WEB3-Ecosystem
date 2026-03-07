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
        // Only run connection logic if user is present
        if (!currentUser) {
            if (connectedRef.current) {
                socketService.disconnect();
                connectedRef.current = false;
            }
            return;
        }

        const connectSocket = async () => {
            try {
                // If not connected, force connection with current state
                // Note: socketService.connect() handles picking up tokens from store/cookies automatically
                if (!socketService.isConnected()) {
                    await socketService.connect(token || undefined);
                    connectedRef.current = true;
                }
            } catch (error) {
                console.error("Global socket connection failed:", error);
            }
        };

        connectSocket();

        const isMessageProcessed = (messageId: string) => {
            if (processedMessageIds.current.has(messageId)) return true;
            processedMessageIds.current.add(messageId);
            setTimeout(() => processedMessageIds.current.delete(messageId), 10000);
            return false;
        };

        const showGlobalToast = (message: any, conversationId: string) => {
            if (!message || !message.sender) return;

            const sender = message.sender;
            const senderId = typeof sender === 'object' ? sender._id : sender;
            const senderUsername = typeof sender === 'object' ? (sender.username || sender.name) : 'User';
            const senderName = typeof sender === 'object' ? (sender.name || sender.username) : 'User';

            // Don't toast for own messages
            if (senderId === currentUser._id) return;
            if (isMessageProcessed(message._id)) return;

            const chatPath = `/user/community/messages/${senderUsername}`;

            // Check if already on the relevant chat page
            if (pathname === chatPath || pathname.endsWith(`/${senderUsername}`)) return;

            // Render native Sonner toast with rich styling
            toast.info(senderName, {
                id: `msg-${message._id}`, // Dedupes multiple sources for the same message
                description: message.content.length > 50 ? `${message.content.substring(0, 50)}...` : message.content,
                action: {
                    label: "Reply",
                    onClick: () => router.push(chatPath)
                },
                duration: 5000,
                icon: "💬",
            });
        };

        const handleNewMessage = (data: any) => {
            const { message, conversation } = data;
            showGlobalToast(message, conversation?._id || message.conversationId);
        };

        const handleConversationUpdated = (data: any) => {
            const { conversation } = data;
            if (conversation?.lastMessage) {
                showGlobalToast(conversation.lastMessage, conversation._id);
            }
        };

        const handleCommunityNotification = (data: any) => {
            const { title, message, link, messageId } = data;
            if (messageId && isMessageProcessed(messageId)) return;
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

        socketService.onNewMessage(handleNewMessage);
        socketService.onConversationUpdated(handleConversationUpdated);
        socketService.on('community_notification', handleCommunityNotification);

        return () => {
            socketService.offNewMessage(handleNewMessage);
            socketService.offConversationUpdated(handleConversationUpdated);
            socketService.off('community_notification', handleCommunityNotification);
        };
    }, [token, currentUser, pathname, router])

    return null
}
