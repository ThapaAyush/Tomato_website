import express from "express";
import cors from "cors";
import { connectDB } from "./config/db.js";
import foodRouter from "./routes/foodRoutes.js";


// app config
const app = express();
const port = 4000;



// middleware
app.use(express.json());
app.use(cors());

// db connection
connectDB();

// api endpoints
app.use("/api/food",foodRouter)
app.use("/images",express.static('uploads'))

app.get("/", (req, res) => {
  res.send("API Working");
});

app.listen(port,()=>{
  console.log(`Server Started on http://localhost:${port}`)
})

// mongodb+srv://ayush108ayush108_db_user:G3xbE3mmsvarcjsR@cluster0.b9ogyjc.mongodb.net/?appName=Cluster0

