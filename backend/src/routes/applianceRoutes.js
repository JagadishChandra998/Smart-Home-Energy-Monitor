import express from "express";
import { authMiddleware } from "../middleware/authMiddleware.js";
import { addAppliance, deleteAppliance, getAppliances, getLiveLoad, toggleAppliance, updateAppliance } from "../controllers/applianceController.js";

const router = express.Router();

router.post("/",authMiddleware,addAppliance);
router.get("/",authMiddleware,getAppliances);
router.get("/live-load",authMiddleware,getLiveLoad);
router.put("/:id",authMiddleware,updateAppliance);
router.delete("/:id",authMiddleware,deleteAppliance);
router.patch("/:id/toggle",authMiddleware,toggleAppliance);

export default router;
