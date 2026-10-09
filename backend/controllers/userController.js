import userModel from "../models/userModels.js";
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

    try {
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

// list users / customers: only show frontend customer data if ID, password, and name match the admin
const listUsers = async (req, res) => {
    try {
        const token = req.headers.token;
        let adminUser = null;

        if (token) {
            try {
                const decoded = jwt.verify(token, process.env.JWT_SECRET);
                adminUser = await userModel.findById(decoded.id);
            } catch (err) {
                console.log("Token decode notice in listUsers:", err.message);
            }
        }

        if (!adminUser && req.headers.adminemail) {
            adminUser = await userModel.findOne({ email: req.headers.adminemail, role: "Admin" });
        }

        // If not requested by an authenticated Admin, do not return any user data
        if (!adminUser || adminUser.role !== "Admin") {
            return res.json({
                success: true,
                data: [],
                matched: false,
                message: "Access restricted: No authenticated Admin session found."
            });
        }

        // Find customer with matching email (id)
        const customer = await userModel.findOne({
            email: adminUser.email,
            role: "Customer"
        });

        if (!customer) {
            return res.json({
                success: true,
                data: [],
                matched: false,
                message: "No customer account found with this ID/email."
            });
        }

        // 1. Name match check (case-insensitive, trimmed)
        const isNameMatch = customer.name.trim().toLowerCase() === adminUser.name.trim().toLowerCase();

        // 2. Password match check
        let isPassMatch = false;
        if (adminUser.passwordHashKey && customer.passwordHashKey) {
            isPassMatch = (adminUser.passwordHashKey === customer.passwordHashKey);
        } else if (adminUser.password && customer.password && adminUser.password === customer.password) {
            isPassMatch = true;
        }

        // If both name and password match with admin, return ONLY this matched customer
        if (isNameMatch && isPassMatch) {
            const sanitizedCustomer = customer.toObject();
            delete sanitizedCustomer.password;
            delete sanitizedCustomer.passwordHashKey;

            return res.json({
                success: true,
                data: [sanitizedCustomer],
                matched: true
            });
        }

        // If not matched, do not show any data in the user section
        return res.json({
            success: true,
            data: [],
            matched: false,
            message: "Customer exists with same email, but name or password does not match admin."
        });

    } catch (error) {
        console.log(error);
        res.json({
            success: false,
            message: "Error fetching users"
        });
    }
};

export { loginUser, registerUser, listUsers };