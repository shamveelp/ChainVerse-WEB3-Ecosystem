import mongoose, {Schema, Document, Model, Types} from "mongoose";
import { ObjectId } from "mongodb";


export interface ICommunityRequest extends Document {
    _id: ObjectId;
    communityName: string;
    email: string;
    username: string;
    walletAddress: string;
    description: string;
    category: string;
    whyChooseUs: string;
    rules: [string];
    socialLinks: [object];
    logo: string;
    banner: string;
    status: string;
    createdAt: Date;
    updatedAt: Date;
}



const CommunityRequestSchema: Schema<ICommunityRequest> = new Schema({
    communityName: { type: String },
    email: { type: String },
    username: { type: String },
    walletAddress: { type: String },
    description: { type: String },
    category: { type: String },
    whyChooseUs: { type: String },
    rules: [{ type: String }],
    socialLinks: [{ type: Object }],
    logo: { type: String },
    banner: { type: String },
    status: { type: String, enum: ['pending', 'approved', 'rejected'], default: 'pending' },
    }, {
    timestamps: true
})


export const CommunityRequestModel: Model<ICommunityRequest> = mongoose.model<ICommunityRequest>('CommunityRequest', CommunityRequestSchema);
export default CommunityRequestModel;

