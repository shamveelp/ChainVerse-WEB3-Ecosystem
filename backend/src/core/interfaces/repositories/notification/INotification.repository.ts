import { INotification } from "../../../../models/notification.model";

export interface INotificationRepository {
    createNotification(data: Partial<INotification>): Promise<INotification>;
    findNotificationsByUser(userId: string, skip: number, limit: number, unreadOnly?: boolean): Promise<{ notifications: INotification[], total: number }>;
    markAsRead(notificationId: string): Promise<boolean>;
    markAllAsRead(userId: string): Promise<boolean>;
    deleteNotification(notificationId: string): Promise<boolean>;
    countUnread(userId: string): Promise<number>;
}
