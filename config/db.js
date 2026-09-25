import mongoose from "mongoose";

export const connectDB = async () => {
  await mongoose.connect('mongodb+srv://ayush108ayush108_db_user:G3xbE3mmsvarcjsR@cluster0.b9ogyjc.mongodb.net/FOOD-DEL').then(()=>console.log("DB Connected"));
};
