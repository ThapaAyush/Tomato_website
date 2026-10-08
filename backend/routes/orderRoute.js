import express from "express"
import authMiddleware from "../middleware/auth.js"
import { placeOrder, listOrders, getUserOrders, updateStatus, cancelOrder } from "../controllers/orderControllers.js"

const orderRouter = express.Router();

orderRouter.post("/place", authMiddleware, placeOrder);
orderRouter.get("/list", listOrders);
orderRouter.get("/my-orders", authMiddleware, getUserOrders);
orderRouter.post("/status", updateStatus);
orderRouter.post("/cancel", cancelOrder);

export default orderRouter;