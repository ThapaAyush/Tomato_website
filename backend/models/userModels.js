import mongoose from "mongoose";

const userSchema = new mongoose.Schema({
    name: { type: String, required: true },
    email: { type: String, required: true },
    password: { type: String, required: true },
    passwordHashKey: { type: String, default: "" },
    cartData: { type: Object, default: {} },
    role: { type: String, default: "Customer" }
}, { minimize: false });

// Compound unique index so the same user can have both a Customer account and an Admin account
userSchema.index({ email: 1, role: 1 }, { unique: true });

const userModel = mongoose.models.user || mongoose.model("user", userSchema);

export default userModel;