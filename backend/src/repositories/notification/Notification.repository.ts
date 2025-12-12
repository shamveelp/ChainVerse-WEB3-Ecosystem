import { injectable } from "inversify";
import { INotificationRepository } from "../../core/interfaces/repositories/notification/INotification.repository";
import NotificationModel, { INotification } from "../../models/notification.model";

@injectable()
export class NotificationRepository implements INotificationRepository {
    async createNotification(data: Partial<INotification>): Promise<INotification> {
        const notification = new NotificationModel(data);
        return await notification.save();
    }

    async findNotificationsByUser(
        userId: string,
        skip: number,
        limit: number,
        unreadOnly?: boolean
    ): Promise<{ notifications: INotification[], total: number }> {
        const query: any = { recipient: userId };
        if (unreadOnly) {
            query.read = false;
        }

        const [notifications, total] = await Promise.all([
            NotificationModel.find(query)
                .sort({ createdAt: -1 })
                .skip(skip)
                .limit(limit)
                .lean(),
            NotificationModel.countDocuments(query)
        ]);

        return { notifications, total };
    }

    async markAsRead(notificationId: string): Promise<boolean> {
        const result = await NotificationModel.findByIdAndUpdate(
            notificationId,
            { read: true },
            { new: true }
        );
        return !!result;
    }

    async markAllAsRead(userId: string): Promise<boolean> {
        const result = await NotificationModel.updateMany(
            { recipient: userId, read: false },
            { read: true }
        );
        return result.acknowledged;
    }

    async deleteNotification(notificationId: string): Promise<boolean> {
        const result = await NotificationModel.findByIdAndDelete(notificationId);
        return !!result;
    }

    async countUnread(userId: string): Promise<number> {
        return await NotificationModel.countDocuments({ recipient: userId, read: false });
    }
}
