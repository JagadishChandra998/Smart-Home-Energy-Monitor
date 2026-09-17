import express from "express";
import { createEnergyHistory, getEnergyHistory } from "../controllers/energyHistoryController.js";
import {authMiddleware} from "../middleware/authMiddleware.js";

const routes = express.Router();

routes.post("/",authMiddleware,createEnergyHistory);
routes.get("/",authMiddleware,getEnergyHistory);

export default routes;