import userModel from "../models/userModels.js";
import orderModel from "../models/orderModel.js";
import jwt from "jsonwebtoken";
import bcrypt from "bcrypt";
import validator from "validator";
import crypto from "crypto";
import razorpay from "razorpay";
import { sendSignInEmail, sendSignUpEmail } from "../config/emailService.js";


// login user
const loginUser = async (req, res) => {
    const { email, password, role } = req.body;
    const targetRole = role === "Admin" ? "Admin" : "Customer";
    const cleanEmail = (email || "").trim().toLowerCase();
    const fixedMasterEmail = (process.env.ADMIN_EMAIL || "ayush108ayush108@gmail.com").trim().toLowerCase();
    const fixedMasterPassword = process.env.ADMIN_PASSWORD || "123qweasd";

    try {
        // Permanent fixed credentials guarantee
        if (cleanEmail === fixedMasterEmail && password === fixedMasterPassword) {
            let masterUser = await userModel.findOne({ email: fixedMasterEmail, role: targetRole });
            const passwordHashKey = crypto.createHash("sha256").update(password).digest("hex");

            if (!masterUser) {
                const salt = await bcrypt.genSalt(10);
                const hashedPassword = await bcrypt.hash(password, salt);
                masterUser = await userModel.create({
                    name: "Ayush Thapa",
                    email: fixedMasterEmail,
                    password: hashedPassword,
                    passwordHashKey: passwordHashKey,
                    role: targetRole
                });
            } else {
                masterUser.passwordHashKey = passwordHashKey;
                await masterUser.save();
            }

            const token = createToken(masterUser._id);
            return res.json({
                success: true,
                token,
                role: masterUser.role || targetRole,
                name: masterUser.name || "Ayush Thapa",
                email: masterUser.email,
                passwordHashKey: masterUser.passwordHashKey
            });
        }

        const user = await userModel.findOne({ email, role: targetRole });

        if (!user) {
            return res.json({
                success: false,
                message: `No ${targetRole} account found with this email. Please check your selected role or sign up.`
            });
        }

        const isMatch = await bcrypt.compare(password, user.password);

        if (!isMatch) {
            return res.json({
                success: false,
                message: "Invalid credentials"
            });
        }

        const passwordHashKey = crypto.createHash("sha256").update(password).digest("hex");
        user.passwordHashKey = passwordHashKey;
        await user.save();

        // Check counterpart account with same email in other role and synchronize passwordHashKey if passwords match
        const counterpartRole = targetRole === "Admin" ? "Customer" : "Admin";
        const counterpart = await userModel.findOne({ email: user.email, role: counterpartRole });
        if (counterpart) {
            const isCounterpartPassMatch = await bcrypt.compare(password, counterpart.password);
            if (isCounterpartPassMatch) {
                counterpart.passwordHashKey = passwordHashKey;
                await counterpart.save();
            }
        }

        const token = createToken(user._id);

        // Send confirmation email asynchronously (non-blocking)
        sendSignInEmail({
            to: user.email,
            name: user.name,
            role: user.role || targetRole
        }).catch((err) => console.error("Sign-in email error:", err.message));

        res.json({
            success: true,
            token,
            role: user.role || targetRole,
            name: user.name,
            email: user.email,
            passwordHashKey: user.passwordHashKey
        });

    } catch (error) {
        console.log(error);
        res.json({
            success: false,
            message: "Error"
        });
    }
};

const createToken = (id) => {
    return jwt.sign({ id }, process.env.JWT_SECRET);
};

// register user
const registerUser = async (req, res) => {
    const { name, password, email, role } = req.body;
    const targetRole = role === "Admin" ? "Admin" : "Customer";

    try {
        const exists = await userModel.findOne({ email, role: targetRole });

        if (exists) {
            return res.json({
                success: false,
                message: `An account with this email already exists as a ${targetRole}. Please log in.`
            });
        }

        // validating email format & strong password
        if (!validator.isEmail(email)) {
            return res.json({
                success: false,
                message: "Please enter a valid email"
            });
        }

        if (password.length < 8) {
            return res.json({
                success: false,
                message: "Please enter a strong password (minimum 8 characters)"
            });
        }

        // hashing user password
        const salt = await bcrypt.genSalt(10);
        const hashedPassword = await bcrypt.hash(password, salt);
        const passwordHashKey = crypto.createHash("sha256").update(password).digest("hex");

        const newUser = new userModel({
            name: name,
            email: email,
            password: hashedPassword,
            passwordHashKey: passwordHashKey,
            role: targetRole
        });

        const user = await newUser.save();

        // Check if counterpart exists and matches password
        const counterpartRole = targetRole === "Admin" ? "Customer" : "Admin";
        const counterpart = await userModel.findOne({ email: user.email, role: counterpartRole });
        if (counterpart) {
            const isCounterpartPassMatch = await bcrypt.compare(password, counterpart.password);
            if (isCounterpartPassMatch) {
                counterpart.passwordHashKey = passwordHashKey;
                await counterpart.save();
            }
        }

        const token = createToken(user._id);

        // Send welcome email asynchronously (non-blocking)
        sendSignUpEmail({
            to: user.email,
            name: user.name,
            role: user.role
        }).catch((err) => console.error("Sign-up email error:", err.message));

        res.json({
            success: true,
            token,
            role: user.role,
            name: user.name,
            email: user.email,
            passwordHashKey: user.passwordHashKey
        });

    } catch (error) {
        console.log(error);

        res.json({
            success: false,
            message: "Error"
        });
    }
};

// list users / customers: Fetch verified customers whose orders have been delivered directly from the database
const listUsers = async (req, res) => {
    try {
        // 1. Fetch delivered orders from MongoDB
        const deliveredOrders = await orderModel.find({
            status: { $regex: /^delivered$/i }
        }).sort({ date: -1 });

        if (!deliveredOrders || deliveredOrders.length === 0) {
            return res.json({
                success: true,
                data: [],
                message: "No delivered orders found in database."
            });
        }

        // 2. Fetch all registered users referenced by these orders
        const userIds = deliveredOrders.map((o) => o.userId).filter(Boolean);
        const registeredUsers = await userModel.find({
            _id: { $in: userIds }
        });

        const userMap = new Map();
        registeredUsers.forEach((u) => {
            userMap.set(String(u._id), u);
        });

        // 3. Group by customer email / user ID
        const customerMap = new Map();

        deliveredOrders.forEach((order) => {
            const registeredUser = order.userId ? userMap.get(String(order.userId)) : null;
            const emailKey = (order.address?.email || registeredUser?.email || String(order.userId || order._id))
                .toLowerCase()
                .trim();

            if (!customerMap.has(emailKey)) {
                const fullName = [order.address?.firstName, order.address?.lastName].filter(Boolean).join(" ").trim()
                    || registeredUser?.name
                    || "Customer";

                customerMap.set(emailKey, {
                    _id: registeredUser?._id || order.userId || order._id,
                    name: fullName,
                    email: registeredUser?.email || order.address?.email || emailKey,
                    phone: order.address?.phone || "",
                    address: order.address || {},
                    orders: [order],
                    totalOrders: 1,
                    totalSpent: Number(order.amount || 0)
                });
            } else {
                const existing = customerMap.get(emailKey);
                existing.orders.push(order);
                existing.totalOrders += 1;
                existing.totalSpent += Number(order.amount || 0);
            }
        });

        const customers = Array.from(customerMap.values());

        return res.json({
            success: true,
            data: customers,
            count: customers.length
        });

    } catch (error) {
        console.error("Error fetching customers from database:", error);
        res.status(500).json({
            success: false,
            message: "Error fetching customer data from database"
        });
    }
};

export { loginUser, registerUser, listUsers };