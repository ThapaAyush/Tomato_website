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
        const orders = await orderModel.find({ userId, status: { $ne: "Cancelled" } }).sort({ date: -1 });
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
        const { items, amount, address, paymentMethod = "cod" } = req.body;

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
            status: "Food Processing"
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