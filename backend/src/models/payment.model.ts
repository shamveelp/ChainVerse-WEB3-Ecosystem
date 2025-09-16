import mongoose, { Schema, Document, Model, Types } from "mongoose";
import { ObjectId } from "mongodb";

export interface IPayment extends Document {
    _id: ObjectId;
    userId: Types.ObjectId;
    walletAddress: string;
    currency: 'INR' | 'USD' | 'RIY';
    amountInCurrency: number;
    estimatedEth: number;
    actualEthToSend: number;
    platformFee: number;
    totalFeePercentage: number;
    razorpayOrderId: string;
    razorpayPaymentId?: string;
    razorpaySignature?: string;
    status: 'pending' | 'success' | 'failed' | 'fulfilled' | 'rejected';
    transactionHash?: string;
    ethPriceAtTime: number;
    adminNote?: string;
    approvedBy?: Types.ObjectId;
    approvedAt?: Date;
    rejectedAt?: Date;
    fulfilledAt?: Date;
    createdAt: Date;
    updatedAt: Date;
}

const PaymentSchema: Schema<IPayment> = new Schema({
    userId: { type: Schema.Types.ObjectId, ref: 'User', required: true },
    walletAddress: { type: String, required: true },
    currency: { type: String, enum: ['INR', 'USD', 'RIY'], default: 'INR' },
    amountInCurrency: { type: Number, required: true },
    estimatedEth: { type: Number, required: true },
    actualEthToSend: { type: Number, required: true },
    platformFee: { type: Number, required: true },
    totalFeePercentage: { type: Number, default: 20 },
    razorpayOrderId: { type: String, required: true },
    razorpayPaymentId: { type: String },
    razorpaySignature: { type: String },
    status: { 
        type: String, 
        enum: ['pending', 'success', 'failed', 'fulfilled', 'rejected'], 
        default: 'pending' 
    },
    transactionHash: { type: String },
    ethPriceAtTime: { type: Number, required: true },
    adminNote: { type: String },
    approvedBy: { type: Types.ObjectId, ref: 'Admin' },
    approvedAt: { type: Date },
    rejectedAt: { type: Date },
    fulfilledAt: { type: Date },
}, {
    timestamps: true
});

PaymentSchema.index({ userId: 1, createdAt: -1 });
PaymentSchema.index({ status: 1, createdAt: -1 });
PaymentSchema.index({ razorpayOrderId: 1 });

export const PaymentModel: Model<IPayment> = mongoose.model<IPayment>('Payment', PaymentSchema);