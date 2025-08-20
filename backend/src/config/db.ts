import mongoose from "mongoose";
// import dotenv from "dotenv";
// dotenv.config();
import logger from "../utils/logger";

const connectDB = async () => {
    try {
        if(!process.env.MONGO_URI) {
            throw new Error("MONGO_URI is not defined in .env file");
        }
        const connect = await mongoose.connect(process.env.MONGO_URI)
        logger.info(`MongoDB connected: ${connect.connection.host}`);
    } catch (error) {
        logger.error(`Error connecting to MongoDB: ${error}`);
        process.exit(1);
    }
}

export default connectDB;



