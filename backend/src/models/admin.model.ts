import mongoose, {Schema, Document, Model} from "mongoose";
import { ObjectId } from "mongodb";

export interface IAdmin extends Document {
    _id: string;
    email: string;
    password: string;
    name: string;
    role: "admin";
    isActive: boolean;
    tokenVersion?: number;
    lastLogin: Date;
    createdAt: Date;
    updatedAt: Date;
}

const AdminSchema: Schema<IAdmin> = new Schema({
    email: { type: String, required: true, unique: true },
    password: { type: String, required: true },
    name: { type: String, required: true },
    role: { type: String, enum: ['admin'], default: 'admin' },
    isActive: { type: Boolean, default: true },
    tokenVersion: { type: Number, default: 0 },
    lastLogin: { type: Date, default: null },
}, {
    timestamps: true
});

export const AdminModel: Model<IAdmin> = mongoose.model<IAdmin>('Admin', AdminSchema);
export default AdminModel;
