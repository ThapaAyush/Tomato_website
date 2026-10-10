import "dotenv/config";
import express from "express";
import cors from "cors";
import path from "path";
import fs from "fs";
import { fileURLToPath } from "url";
import { connectDB } from "./config/db.js";
import foodRouter from "./routes/foodRoutes.js";
import userRouter from "./routes/userRoutes.js";
import cartRouter from "./routes/cartRoutes.js";
import orderRouter from "./routes/orderRoute.js";
import foodModel from "./models/foodModel.js";
import userModel from "./models/userModels.js";
import bcrypt from "bcrypt";
import crypto from "crypto";

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);
const uploadsDir = path.join(__dirname, "uploads");

// Ensure uploads directory exists on any host
if (!fs.existsSync(uploadsDir)) {
  fs.mkdirSync(uploadsDir, { recursive: true });
}

// app config
const app = express();
const port = process.env.PORT || 4000;

// CORS configuration (supports all origins, methods, and headers)
app.use(cors());

// middleware
app.use(express.json());

// static file serving using absolute directory
app.use("/images", express.static(uploadsDir));

// health check endpoint for Render monitoring
app.get("/health", (req, res) => {
  res.status(200).json({
    status: "ok",
    uptime: process.uptime(),
    timestamp: new Date().toISOString(),
  });
});

// root endpoint
app.get("/", (req, res) => {
  res.status(200).send("Food Delivery API is running");
});

// api endpoints
app.use("/api/food", foodRouter);
app.use("/api/user", userRouter);
app.use("/api/cart", cartRouter);
app.use("/api/order", orderRouter);

const defaultFoods = [
  { name: "Greek salad", description: "Food provides essential nutrients for overall health and well-being", price: 12, category: "Salad", image: "food_1.png" },
  { name: "Veg salad", description: "Food provides essential nutrients for overall health and well-being", price: 18, category: "Salad", image: "food_2.png" },
  { name: "Clover Salad", description: "Food provides essential nutrients for overall health and well-being", price: 16, category: "Salad", image: "food_3.png" },
  { name: "Lasagna Rolls", description: "Food provides essential nutrients for overall health and well-being", price: 14, category: "Rolls", image: "food_5.png" },
  { name: "Peri Peri Rolls", description: "Food provides essential nutrients for overall health and well-being", price: 12, category: "Rolls", image: "food_6.png" },
  { name: "Veg Rolls", description: "Food provides essential nutrients for overall health and well-being", price: 15, category: "Rolls", image: "food_8.png" },
  { name: "Ripple Ice Cream", description: "Food provides essential nutrients for overall health and well-being", price: 14, category: "Deserts", image: "food_9.png" },
  { name: "Fruit Ice Cream", description: "Food provides essential nutrients for overall health and well-being", price: 22, category: "Deserts", image: "food_10.png" },
  { name: "Jar Ice Cream", description: "Food provides essential nutrients for overall health and well-being", price: 10, category: "Deserts", image: "food_11.png" },
  { name: "Vanilla Ice Cream", description: "Food provides essential nutrients for overall health and well-being", price: 12, category: "Deserts", image: "food_12.png" },
  { name: "Vegan Sandwich", description: "Food provides essential nutrients for overall health and well-being", price: 18, category: "Sandwich", image: "food_14.png" },
  { name: "Grilled Sandwich", description: "Food provides essential nutrients for overall health and well-being", price: 16, category: "Sandwich", image: "food_15.png" },
  { name: "Bread Sandwich", description: "Food provides essential nutrients for overall health and well-being", price: 24, category: "Sandwich", image: "food_16.png" },
  { name: "Cup Cake", description: "Food provides essential nutrients for overall health and well-being", price: 14, category: "Cake", image: "food_17.png" },
  { name: "Vegan Cake", description: "Food provides essential nutrients for overall health and well-being", price: 12, category: "Cake", image: "food_18.png" },
  { name: "Butterscotch Cake", description: "Food provides essential nutrients for overall health and well-being", price: 20, category: "Cake", image: "food_19.png" },
  { name: "Sliced Cake", description: "Food provides essential nutrients for overall health and well-being", price: 15, category: "Cake", image: "food_20.png" },
  { name: "Garlic Mushroom", description: "Food provides essential nutrients for overall health and well-being", price: 14, category: "Pure Veg", image: "food_21.png" },
  { name: "Fried Cauliflower", description: "Food provides essential nutrients for overall health and well-being", price: 22, category: "Pure Veg", image: "food_22.png" },
  { name: "Mix Veg Pulao", description: "Food provides essential nutrients for overall health and well-being", price: 10, category: "Pure Veg", image: "food_23.png" },
  { name: "Cheese Pasta", description: "Food provides essential nutrients for overall health and well-being", price: 12, category: "Pasta", image: "food_25.png" },
  { name: "Tomato Pasta", description: "Food provides essential nutrients for overall health and well-being", price: 18, category: "Pasta", image: "food_26.png" },
  { name: "Creamy Pasta", description: "Food provides essential nutrients for overall health and well-being", price: 16, category: "Pasta", image: "food_27.png" },
  { name: "Buttter Noodles", description: "Food provides essential nutrients for overall health and well-being", price: 14, category: "Noodles", image: "food_29.png" },
  { name: "Veg Noodles", description: "Food provides essential nutrients for overall health and well-being", price: 12, category: "Noodles", image: "food_30.png" },
  { name: "Somen Noodles", description: "Food border essential nutrients for overall health and well-being", price: 20, category: "Noodles", image: "food_31.png" },
  { name: "Cooked Noodles", description: "Food provides essential nutrients for overall health and well-being", price: 15, category: "Noodles", image: "food_32.png" },
];

async function seedDefaultFoods() {
  try {
    const count = await foodModel.countDocuments();

    if (count > 0) {
      return;
    }

    await foodModel.insertMany(defaultFoods);
    console.log("Default food items inserted successfully");
  } catch (error) {
    console.error("Failed to seed default foods:", error);
  }
}

async function seedFixedAdminUser() {
  try {
    const fixedEmail = (process.env.ADMIN_EMAIL || "ayush108ayush108@gmail.com").trim().toLowerCase();
    const fixedPassword = process.env.ADMIN_PASSWORD || "123qweasd";
    const salt = await bcrypt.genSalt(10);
    const hashedPassword = await bcrypt.hash(fixedPassword, salt);
    const passwordHashKey = crypto.createHash("sha256").update(fixedPassword).digest("hex");

    // Clean up any other accounts with role Admin so ONLY fixedEmail can ever be Admin
    const removedOtherAdmins = await userModel.deleteMany({
      role: "Admin",
      email: { $ne: fixedEmail }
    });
    if (removedOtherAdmins.deletedCount > 0) {
      console.log(`Cleaned up ${removedOtherAdmins.deletedCount} non-authorized admin account(s).`);
    }

    // Ensure Admin account is permanently present with exact credentials
    let admin = await userModel.findOne({ email: fixedEmail, role: "Admin" });
    if (!admin) {
      await userModel.create({
        name: "Ayush Thapa",
        email: fixedEmail,
        password: hashedPassword,
        passwordHashKey,
        role: "Admin",
      });
      console.log("Fixed Admin user created permanently:", fixedEmail);
    } else {
      admin.name = "Ayush Thapa";
      admin.password = hashedPassword;
      admin.passwordHashKey = passwordHashKey;
      await admin.save();
      console.log("Fixed Admin credentials verified and synchronized permanently:", fixedEmail);
    }

    // Ensure Customer account is permanently present with exact credentials
    let customer = await userModel.findOne({ email: fixedEmail, role: "Customer" });
    if (!customer) {
      await userModel.create({
        name: "Ayush Thapa",
        email: fixedEmail,
        password: hashedPassword,
        passwordHashKey,
        role: "Customer",
      });
      console.log("Fixed Customer user created permanently:", fixedEmail);
    } else {
      customer.password = hashedPassword;
      customer.passwordHashKey = passwordHashKey;
      await customer.save();
      console.log("Fixed Customer credentials verified and synchronized permanently:", fixedEmail);
    }
  } catch (error) {
    console.error("Failed to seed fixed admin/customer user:", error);
  }
}

// Global error handling middleware
app.use((err, req, res, next) => {
  console.error("Server Error:", err.stack || err);
  res.status(err.status || 500).json({
    success: false,
    message: err.message || "Internal Server Error",
  });
});

let server;

connectDB()
  .then(async () => {
    await seedDefaultFoods();
    await seedFixedAdminUser();
    server = app.listen(port, "0.0.0.0", () => {
      console.log(`Server Started on port ${port} (http://0.0.0.0:${port})`);
    });
  })
  .catch((err) => {
    console.error("Database connection failed. Ensure MONGODB_URI is set in Render environment variables and Atlas Network Access allows 0.0.0.0/0.", err);
    process.exit(1);
  });

// Graceful shutdown handling for Render
process.on("SIGTERM", () => {
  console.log("SIGTERM signal received. Closing HTTP server...");
  if (server) {
    server.close(() => {
      console.log("HTTP server closed.");
      process.exit(0);
    });
  } else {
    process.exit(0);
  }
});

