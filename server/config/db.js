import mongoose from "mongoose";

mongoose.connection.on("error", (err) => {
  console.error("MongoDB connection error:", err.message);
});

mongoose.connection.on("disconnected", () => {
  console.warn("MongoDB disconnected. Mongoose will attempt to reconnect.");
});

mongoose.connection.on("reconnected", () => {
  console.log("MongoDB reconnected");
});

const connectDb = async () => {
  try {
    const conn = await mongoose.connect(process.env.MONGODB_URL);

    console.log(`MongoDB Connected: ${conn.connection.host}`);
  } catch (error) {
    console.error("MongoDB Connection Failed:", error.message);
    console.error("Retrying in 5 seconds...");
    setTimeout(connectDb, 5000);
  }
};

export default connectDb;
