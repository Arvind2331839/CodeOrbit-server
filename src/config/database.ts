import mongoose from "mongoose";
import { env } from "./env.js";

export const connectDatabase = async (): Promise<typeof mongoose> => {
  try {
    const conn = await mongoose.connect(env.MONGODB_URI);

    console.log("[Database] MongoDB connected successfully");

    return conn;
  } catch (error) {
    console.error("[Database] MongoDB connection error:", error);
    throw error;
  }
};

export const disconnectDatabase = async (): Promise<void> => {
  if (mongoose.connection.readyState !== 0) {
    await mongoose.disconnect();
    console.log("[Database] MongoDB disconnected cleanly.");
  }
};

export default connectDatabase;
