import orderModel from "../models/orderModel.js";
import userModel from "../models/userModels.js";
import Razorpay from "razorpay";

const listOrders = async (req, res) => {
    try {
        const orders = await orderModel.find({ status: { $ne: "Cancelled" } }).sort({ date: -1 });
        res.json({ success: true, data: orders });
    } catch (error) {
        console.log(error);
        res.json({ success: false, message: "Error" });
    }
};

const getUserOrders = async (req, res) => {
    try {
        const userId = req.body?.userId || req.userId;
        if (!userId) {
            return res.json({ success: false, message: "User not authenticated" });
        }

        // Look up the current user to find their registered email
        const user = await userModel.findById(userId);
        const email = user?.email?.trim()?.toLowerCase() || req.query?.email?.trim()?.toLowerCase() || req.body?.email?.trim()?.toLowerCase();

        let query = {};
        if (email) {
            // Find all user IDs associated with this same email (e.g. Customer and Admin roles)
            const usersWithSameEmail = await userModel.find({
                email: { $regex: new RegExp(`^${email}$`, "i") }
            }).select("_id");

            const allUserIds = usersWithSameEmail.map((u) => String(u._id));
            if (!allUserIds.includes(String(userId))) {
                allUserIds.push(String(userId));
            }

            // Find all orders placed under this email or by any user account with this email
            query = {
                $or: [
                    { userId: { $in: allUserIds } },
                    { "address.email": { $regex: new RegExp(`^${email}$`, "i") } }
                ],
                status: { $ne: "Cancelled" }
            };
        } else {
            query = { userId, status: { $ne: "Cancelled" } };
        }

        const orders = await orderModel.find(query).sort({ date: -1 });
        res.json({ success: true, data: orders });
    } catch (error) {
        console.log("getUserOrders error:", error);
        res.json({ success: false, message: "Error fetching user orders" });
    }
};

const razorpay = new Razorpay({
    key_id: process.env.RAZORPAY_KEY_ID || "rzp_test_TiBnINgVMFIutq",
    key_secret: process.env.RAZORPAY_KEY_SECRET || "9MSzaaD044GAz1ysehpcDIyy"
});

const placeOrder = async (req, res) => {
    try {
        const userId = req.body?.userId || req.userId;
        const { items, amount, address, paymentMethod = "cod", promoCode = "", discount = 0 } = req.body;

        if (!userId) {
            return res.json({ success: false, message: "Please login to place an order" });
        }

        if (!items || !items.length) {
            return res.json({ success: false, message: "Cart items are required" });
        }

        const newOrder = new orderModel({
            userId,
            items,
            amount: Number(amount || 0),
            address,
            payment: false,
            status: "Food Processing",
            promoCode: String(promoCode || ""),
            discount: Number(discount || 0)
        });

        await newOrder.save();
        await userModel.findByIdAndUpdate(userId, { cartData: {} });

        if (paymentMethod === "cod") {
            return res.json({
                success: true,
                paymentMethod: "cod",
                orderId: newOrder._id,
                message: "Order placed successfully (Cash on Delivery)"
            });
        }

        try {
            const totalAmount = Math.max(100, Math.round(Number(amount || 0) * 100));

            const razorpayOrder = await razorpay.orders.create({
                amount: totalAmount,
                currency: "INR",
                receipt: String(newOrder._id),
                notes: {
                    userId,
                    address: typeof address === "object" ? JSON.stringify(address) : String(address || "")
                }
            });

            return res.json({
                success: true,
                paymentMethod: "razorpay",
                key: process.env.RAZORPAY_KEY_ID || "rzp_test_TiBnINgVMFIutq",
                order: {
                    id: razorpayOrder.id,
                    amount: razorpayOrder.amount,
                    currency: razorpayOrder.currency
                },
                orderId: newOrder._id
            });
        } catch (rzpError) {
            console.error("Razorpay order error, placing as COD fallback:", rzpError.message || rzpError);
            return res.json({
                success: true,
                paymentMethod: "cod",
                orderId: newOrder._id,
                message: "Order placed successfully! (Payment gateway unavailable, converted to Cash on Delivery)"
            });
        }

    } catch (error) {
        console.log("placeOrder error:", error);
        res.json({ success: false, message: error.message || "Failed to place order" });
    }
};

// api for updating order status
const updateStatus = async (req, res) => {
    try {
        const { orderId, status } = req.body;
        if (!orderId) {
            return res.json({ success: false, message: "orderId is required" });
        }
        if (status === "Cancelled") {
            await orderModel.findByIdAndDelete(orderId);
            return res.json({ success: true, message: "Order Cancelled and Removed" });
        }
        await orderModel.findByIdAndUpdate(orderId, { status });
        res.json({ success: true, message: "Status Updated" });
    } catch (error) {
        console.log(error);
        res.json({ success: false, message: "Error" });
    }
};

// api for cancelling order
const cancelOrder = async (req, res) => {
    try {
        const { orderId } = req.body;
        if (!orderId) {
            return res.json({ success: false, message: "orderId is required" });
        }
        await orderModel.findByIdAndDelete(orderId);
        res.json({ success: true, message: "Order Cancelled and Removed" });
    } catch (error) {
        console.log(error);
        res.json({ success: false, message: "Error" });
    }
};

export { placeOrder, listOrders, getUserOrders, updateStatus, cancelOrder };