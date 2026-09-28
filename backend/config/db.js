import mongoose from "mongoose";

export const connectDB = async () => {
  const mongoUri = process.env.MONGODB_URI;

  if (!mongoUri || mongoUri.includes("<db_password>")) {
    throw new Error("Set MONGODB_URI in backend/.env and replace <db_password> with the Atlas database password.");
  }

  await mongoose.connect(mongoUri);
  console.log("DB Connected");
};
