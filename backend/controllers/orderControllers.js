import orderModel from "../models/orderModel.js";
import userModel from "../models/userModels.js";
import Razorpay from "razorpay";

const listOrders = async (req, res) => {
    try {
        const orders = await orderModel.find({}).sort({ date: -1 });
        res.json({ success: true, data: orders });
    } catch (error) {
        console.log(error);
        res.json({ success: false, message: "Error" });
    }
};

const getUserOrders = async (req, res) => {
    try {
        const orders = await orderModel.find({ userId: req.body.userId }).sort({ date: -1 });
        res.json({ success: true, data: orders });
    } catch (error) {
        console.log(error);
        res.json({ success: false, message: "Error" });
    }
};

const razorpay = new Razorpay({
    key_id: process.env.RAZORPAY_KEY_ID || "rzp_test_TiBnINgVMFIutq",
    key_secret: process.env.RAZORPAY_KEY_SECRET || "9MSzaaD044GAz1ysehpcDIyy"
});

const placeOrder = async (req, res) => {

    const frontend_url = "http://localhost:5175";
    try {
        const { userId, items, amount, address } = req.body;

        const newOrder = new orderModel({
            userId,
            items,
            amount,
            address
        });

        await newOrder.save();
        await userModel.findByIdAndUpdate(userId, { cartData: {} });

        const totalAmount = Math.round(Number(amount || 0) * 100);

        const razorpayOrder = await razorpay.orders.create({
            amount: totalAmount,
            currency: "INR",
            receipt: String(newOrder._id),
            notes: {
                userId,
                address: JSON.stringify(address)
            }
        });

        res.json({
            success: true,
            key: process.env.RAZORPAY_KEY_ID || "rzp_test_TiBnINgVMFIutq",
            order: {
                id: razorpayOrder.id,
                amount: razorpayOrder.amount,
                currency: razorpayOrder.currency
            },
            orderId: newOrder._id
        });

    } catch (error) {
        console.log(error);
        res.json({ success: false, message: "Error" });
    }
};

export { placeOrder, listOrders, getUserOrders };