import mongoose from "mongoose";
import { env } from "./env";

mongoose.set("strictQuery", true);

export async function connectDatabase(): Promise<void> {
  mongoose.connection.on("connected", () => {
    // eslint-disable-next-line no-console
    console.log("[db] connected");
  });

  mongoose.connection.on("error", (error) => {
    // eslint-disable-next-line no-console
    console.error("[db] connection error:", error.message);
  });

  mongoose.connection.on("disconnected", () => {
    // eslint-disable-next-line no-console
    console.warn("[db] disconnected");
  });

  await mongoose.connect(env.MONGODB_URI, {
    dbName: env.MONGODB_DATABASE,
    serverSelectionTimeoutMS: 10_000,
    maxPoolSize: 10,
  });
}

export async function disconnectDatabase(): Promise<void> {
  await mongoose.disconnect();
}
