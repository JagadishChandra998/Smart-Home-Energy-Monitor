import express from "express";
import {authMiddleware} from "../middleware/authMiddleware.js"
import { createSchedule, deleteSchedule, getSchedules, toggleSchedule, updateSchedule } from "../controllers/scheduleController.js";

const routes = express.Router();

routes.post("/",authMiddleware,createSchedule);
routes.get("/",authMiddleware,getSchedules);
routes.put("/:id",authMiddleware,updateSchedule);
routes.delete("/:id",authMiddleware,deleteSchedule);
routes.patch("/:id/toggle",authMiddleware,toggleSchedule);

export default routes;