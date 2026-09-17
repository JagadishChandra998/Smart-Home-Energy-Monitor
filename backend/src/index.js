import express from "express";
import cors from "cors";
import dotenv from "dotenv";
import connectDB from "./config/db.js";
import authRoutes from "./routes/authRoutes.js";
import applianceRoutes from "./routes/applianceRoutes.js"
import ScheduleRoutes from "./routes/scheduleRoutes.js";
import energyHistoryRoutes from "./routes/energyHistoryRoutes.js";
import { runScheduleEngine } from "./services/scheduleEngine.js";

dotenv.config();

const app = express();

app.use (cors());
app.use (express.json());

app.use("/api/auth",authRoutes);
app.use("/api/appliances",applianceRoutes);
app.use("/api/schedules",ScheduleRoutes);
app.use("/api/energy-history",energyHistoryRoutes);


app.get ("/", (req, res) =>{
    res.json({
        success:true,
        message:"API is running"
    });
});

const PORT = process.env.PORT || 5000;

connectDB();

app.listen (PORT, () =>{
    console.log (`server is running on port ${PORT}`);
});

runScheduleEngine();

setInterval(() =>{
    runScheduleEngine();
}, 10 * 1000);