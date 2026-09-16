import EnergyHistory from "../models/EnergyHistort.js";
import Appliance from "../models/Appliance.js";

export const createEnergyHistory = async (req, res) => {

    try {

        const { applianceId, startTime, endTime, source } = req.body;

        if (!applianceId || !startTime || !endTime || !source) {
            return res.status(400).json({
                success: false,
                message:
                    "Appliance, start time, end time and source are required"
            });
        }

        const appliance = await Appliance.findOne({
            userId: req.user.id,
            _id: applianceId,
        });

        if (!appliance) {
            return res.status(404).json({
                success: false,
                message: "Appliance not found"
            })
        }

        const start = new Date(startTime);
        const end = new Date(endTime);

        if(isNaN(start.getTime()) || isNaN(end.getTime())){
            return res.status(400).json({
                success: false,
                message: "Invalid start time or end time"
            });
        }

        if (end <= start){
            return res.status(400).json({
                success: false,
                message: "End time must be after start time"
            });
        }

        const duration = end.getTime() - start.getTime() / (1000 * 60 * 60);

        const powerInKw = appliance.powerRating / 1000;

        const energyConsumed = powerInKw * duration ;

        

    }
    catch (error) {
        console.log("createEngeryHistory Error :", error);
        res.status(500).json({
            success: false,
            message: "Server Error",
        });
    }
};