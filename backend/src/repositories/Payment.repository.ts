import { injectable } from "inversify";
import { PaymentModel, IPayment } from "../models/payment.model";
import { IPaymentRepository, PaginatedPayments } from "../core/interfaces/repositories/IPayment.repository";
import logger from "../utils/logger";
import { Model, FilterQuery } from "mongoose";

@injectable()
export class PaymentRepository implements IPaymentRepository {
  private readonly model: Model<IPayment>;

  constructor() {
    this.model = PaymentModel;
  }

  async create(item: Partial<IPayment>): Promise<IPayment> {
    try {
      return await this.model.create(item);
    } catch (error) {
      logger.error("Error creating payment:", error);
      throw new Error("Database error");
    }
  }

  async findById(id: string): Promise<IPayment | null> {
    try {
      return await this.model.findById(id).exec();
    } catch (error) {
      logger.error("Error finding payment by ID:", error);
      throw new Error("Database error");
    }
  }

  async findByUserId(userId: string, page: number, limit: number): Promise<PaginatedPayments> {
    try {
      const skip = (page - 1) * limit;
      const payments = await this.model
        .find({ userId })
        .populate('userId', 'username email name')
        .populate('approvedBy', 'name email')
        .sort({ createdAt: -1 })
        .skip(skip)
        .limit(limit)
        .exec();

      const total = await this.model.countDocuments({ userId }).exec();
      const totalPages = Math.ceil(total / limit);

      return { payments, total, page, totalPages };
    } catch (error) {
      logger.error("Error finding payments by user ID:", error);
      throw new Error("Database error");
    }
  }

  async findByStatus(status: string, page: number, limit: number): Promise<PaginatedPayments> {
    try {
      const skip = (page - 1) * limit;
      const payments = await this.model
        .find({ status })
        .populate('userId', 'username email name')
        .populate('approvedBy', 'name email')
        .sort({ createdAt: -1 })
        .skip(skip)
        .limit(limit)
        .exec();

      const total = await this.model.countDocuments({ status }).exec();
      const totalPages = Math.ceil(total / limit);

      return { payments, total, page, totalPages };
    } catch (error) {
      logger.error("Error finding payments by status:", error);
      throw new Error("Database error");
    }
  }

  async findByRazorpayOrderId(orderId: string): Promise<IPayment | null> {
    try {
      return await this.model.findOne({ razorpayOrderId: orderId }).exec();
    } catch (error) {
      logger.error("Error finding payment by razorpay order ID:", error);
      throw new Error("Database error");
    }
  }

  async findAllWithPagination(page: number, limit: number, status?: string): Promise<PaginatedPayments> {
    try {
      const skip = (page - 1) * limit;
      const query: FilterQuery<IPayment> = status ? { status } : {};

      const payments = await this.model
        .find(query)
        .populate('userId', 'username email name')
        .populate('approvedBy', 'name email')
        .sort({ createdAt: -1 })
        .skip(skip)
        .limit(limit)
        .exec();

      const total = await this.model.countDocuments(query).exec();
      const totalPages = Math.ceil(total / limit);

      return { payments, total, page, totalPages };
    } catch (error) {
      logger.error("Error finding payments with pagination:", error);
      throw new Error("Database error");
    }
  }

  async updateStatus(id: string, status: string, updateData?: Partial<IPayment>): Promise<IPayment | null> {
    try {
      const updateObj: Record<string, unknown> = { status, ...updateData };

      if (status === 'fulfilled') {
        updateObj.fulfilledAt = new Date();
      } else if (status === 'rejected') {
        updateObj.rejectedAt = new Date();
      } else if (status === 'success') {
        updateObj.approvedAt = new Date();
      }

      return await this.model.findByIdAndUpdate(id, updateObj, { new: true }).exec();
    } catch (error) {
      logger.error("Error updating payment status:", error);
      throw new Error("Database error");
    }
  }

  async countByStatus(status: string): Promise<number> {
    try {
      return await this.model.countDocuments({ status }).exec();
    } catch (error) {
      logger.error("Error counting payments by status:", error);
      throw new Error("Database error");
    }
  }

  async findPendingPayments(): Promise<IPayment[]> {
    try {
      return await this.model
        .find({ status: 'success' })
        .populate('userId', 'username email name')
        .sort({ createdAt: -1 })
        .exec();
    } catch (error) {
      logger.error("Error finding pending payments:", error);
      throw new Error("Database error");
    }
  }

  async count(): Promise<number> {
    try {
      return await this.model.countDocuments().exec();
    } catch (error) {
      logger.error("Error counting all payments:", error);
      throw new Error("Database error");
    }
  }
}