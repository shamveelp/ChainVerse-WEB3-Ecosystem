export interface MessageData {
    receiverUsername: string;
    content: string;
    conversationId?: string;
}

export interface EditMessageData {
    messageId: string;
    content: string;
    conversationId: string;
}

export interface DeleteMessageData {
    messageId: string;
    conversationId: string;
}

export interface TypingData {
    conversationId: string;
}

export interface ReadMessagesData {
    conversationId: string;
}
