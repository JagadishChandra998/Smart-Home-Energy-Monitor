import EnergyHistory from "../models/EnergyHistory.js";
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

        if (isNaN(start.getTime()) || isNaN(end.getTime())) {
            return res.status(400).json({
                success: false,
                message: "Invalid start time or end time"
            });
        }

        if (end <= start) {
            return res.status(400).json({
                success: false,
                message: "End time must be after start time"
            });
        }

        const duration = (end.getTime() - start.getTime()) / (1000 * 60 * 60);

        const powerInKw = appliance.powerRating / 1000;

        const energyConsumed = powerInKw * duration;

        const history = await EnergyHistory.create({

            userId: req.user.id,
            applianceId: appliance._id,
            applianceName: appliance.applianceName,
            powerRating: appliance.powerRating,
            startTime: start,
            endTime: end,
            duration: Number(duration.toFixed(2)),
            energyConsumed: Number(energyConsumed.toFixed(3)),
            source

        });

        res.status(201).json({
            success: true,
            message: "Energy history created successfully",
            history
        })

    }
    catch (error) {
        console.log("createEngeryHistory Error :", error);
        res.status(500).json({
            success: false,
            message: "Server Error",
        });
    }
};

// get all energy history

export const getEnergyHistory = async (req, res) =>{

    try{

        const history = await EnergyHistory.find({
            userId:req.user.id
        })
        .populate(
            "applianceId",
            "applianceName room powerRating priority"
        )
        .sort({
            startTime: -1
        });

        res.status(200).json({
            success: true,
            count: history.length,
            history
        })

    }
    catch(error){
        console.log("getallEnergy Errror",error);

        res.status(500).json({
            success:false,
            message:"Server Errror"
        });
    }
};