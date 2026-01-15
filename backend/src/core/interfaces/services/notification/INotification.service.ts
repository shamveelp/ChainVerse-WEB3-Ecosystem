import { INotification } from "../../../../models/notification.model";

export interface INotificationService {
    createNotification(
        recipientId: string,
        type: string,
        title: string,
        message: string,
        link?: string,
        metadata?: Record<string, unknown>
    ): Promise<INotification>;

    getUserNotifications(
        userId: string,
        query: { page?: number; limit?: number; unreadOnly?: boolean }
    ): Promise<{ notifications: INotification[], total: number, unreadCount: number }>;

    markAsRead(userId: string, notificationId: string): Promise<boolean>;

    markAllAsRead(userId: string): Promise<boolean>;

    deleteNotification(userId: string, notificationId: string): Promise<boolean>;
}
