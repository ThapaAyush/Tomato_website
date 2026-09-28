import "dotenv/config";
import express from "express";
import cors from "cors";
import { connectDB } from "./config/db.js";
import foodRouter from "./routes/foodRoutes.js";
import userRouter from "./routes/userRoutes.js";
import 'dotenv/config'
import cartRouter from "./routes/cartRoutes.js";

// app config
const app = express();
const port = 4000;



// middleware
app.use(express.json());
app.use(cors());

// api endpoints
app.use("/api/food",foodRouter)
app.use("/images",express.static('uploads'))
app.use("/api/user",userRouter)
app.use("/api/cart",cartRouter)


app.get("/", (req, res) => {
  res.send("API Working");
});

connectDB()
  .then(() => {
    app.listen(port, () => {
      console.log(`Server Started on http://localhost:${port}`);
    });
  })
  .catch(() => {
    console.error("Database connection failed. Check MONGODB_URI and Atlas network access.");
    process.exit(1);
  });

