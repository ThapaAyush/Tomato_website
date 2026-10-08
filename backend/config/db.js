import mongoose from "mongoose";

export const connectDB = async () => {
  const mongoUri = process.env.MONGODB_URI;

  if (!mongoUri || mongoUri.includes("<db_password>")) {
    throw new Error(
      "Missing or invalid MONGODB_URI. Set MONGODB_URI in your environment variables and replace <db_password> with your actual MongoDB password."
    );
  }

  try {
    await mongoose.connect(mongoUri, {
      serverSelectionTimeoutMS: 10000,
    });
    console.log("MongoDB connected successfully");

    try {
      const coll = mongoose.connection.db.collection("users");
      const indexes = await coll.indexes();
      if (indexes.some((idx) => idx.name === "email_1")) {
        await coll.dropIndex("email_1");
        console.log("Dropped legacy email_1 unique index");
      }
      await coll.createIndex({ email: 1, role: 1 }, { unique: true });
    } catch (idxErr) {
      console.log("User collection index setup notice:", idxErr.message);
    }
  } catch (error) {
    console.error("MongoDB connection failed:", error.message);
    console.error("Hint: On Render, ensure your MongoDB Atlas Network Access whitelist includes 0.0.0.0/0 (allow from anywhere).");
    throw error;
  }
};
