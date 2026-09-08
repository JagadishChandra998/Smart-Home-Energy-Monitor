import Appliance from "../models/Appliance.js";

export const addAppliance = async (req, res) => {
    try {

        const { applianceName, room, powerRating, priority } = req.body;

        if (!applianceName || !room || !powerRating) {
            return res.status(400).json({
                success: false,
                message: "Appliance name, room and power rating are required",
            });
        }

        const appliance = await Appliance.create({
            userId: req.user.id,
            applianceName,
            room,
            powerRating,
            priority
        });

        res.status(200).json({
            success: true,
            message: "Appliance added successfully",
            appliance
        })
    }
    catch (error) {
        console.log("addAppliance error: ", error);
        res.status(500).json({
            success: false,
            message: "Server Erroe"
        });
    };
};

//get appliances

export const getAppliances = async (req, res) => {
    try {

        const appliances = await Appliance.find({ userId: req.user.id }).sort({ createdAt: -1 });

        res.status(200).json({
            success: true,
            count: appliances.length,
            appliances
        });
    }
    catch (error) {
        console.log("getappliance error :", error);
        res.status(500).json({
            success: false,
            message: "Server error"
        });
    }
};

//update

export const updateAppliance = async (req, res) => {
    try {
        const { id } = req.params;

        const {
            applianceName,
            room,
            powerRating,
            priority
        } = req.body;

        const appliance = await Appliance.findOne({
            _id: id,
            userId: req.user.id
        });

        if (!appliance) {
            return res.status(404).json({
                success: false,
                message: "Appliance not found"
            });
        }

        appliance.applianceName = applianceName ?? appliance.applianceName;
        appliance.room = room ?? appliance.room;
        appliance.powerRating = powerRating ?? appliance.powerRating;
        appliance.priority = priority ?? appliance.priority;

        await appliance.save();

        res.status(200).json({
            success: true,
            message: "Appliance updated successfully",
            appliance
        });

    } catch (error) {
        console.error("Update Appliance Error:", error);

        res.status(500).json({
            success: false,
            message: "Server error"
        });
    }
};

//delete

export const deleteAppliance = async (req, res) => {
    try {
        // const { id } = req.params;

        const appliance = await Appliance.findOneAndDelete({
            _id: req.params.id,
            userId: req.user.id
        });

        if (!appliance) {
            return res.status(404).json({
                success: false,
                message: "Appliance not found"
            });
        }

        res.status(200).json({
            success: true,
            message: "Appliance deleted successfully"
        });

    }
    catch (error) {
        console.error("Delete Appliance Error:", error);

        res.status(500).json({
            success: false,
            message: "Server error"
        });
    }
};

//toggle 

export const toggleAppliance = async (req, res) => {
    try {
        const appliance = await Appliance.findOne({
            _id: req.params.id,
            userId: req.user.id
        });

        if (!appliance) {
            return res.status(404).json({
                success: false,
                message: "Appliances not found",
            });
        }

        if (!appliance.status) {
            const runningAppliances = await Appliance.find({
                userId: req.user.id,
                status: true,
            })


            const currentLoad = runningAppliances.reduce(
                (total, appliance) => total + appliance.powerRating, 0
            );

            const newLoad = currentLoad + appliance.powerRating;

            const MAX_LOAD = 5000;

            if (newLoad > MAX_LOAD) {
                return res.status(400).json({
                    success: false,
                    message: "Power load limit exceeded",
                    currentLoad,
                    appliancePower: appliance.powerRating,
                    requestedLoad: newLoad,
                    maximumLoad: MAX_LOAD,
                });
            }
            appliance.status = true;
        }
        else{
            appliance.status = false;
        }

        await appliance.save();

        res.status(200).json({
            success:true,
            message:appliance.status ? "Appliance turned ON" : "Appliance turned OFF",
            appliance
        });

    }

    catch (error) {
        console.log("toggle Appliances error:", error);
        res.status(500).json({
            success: false,
            message: "Server Error",
        });
    }
};

//Live Load

export const getLiveLoad = async (req, res) =>{
    try{

        const MAX_LOAD = 5000;

        const runningAppliances = await Appliance.find({
            userId:req.user.id,
            status:true,
        });

        const currentLoad = runningAppliances.reduce(
            (total, appliance) => total + appliance.powerRating, 0 
        );

        const  currentLoadPerKW = currentLoad / 1000;

        const remainingLoad = Math.max(MAX_LOAD - currentLoad, 0);

        const usagePercentage = (currentLoad / MAX_LOAD) * 100;

        res.status(200).json({
            success:true,
            currentLoad,
            currentLoadPerKW,

            maximumLoad:MAX_LOAD,
            remainingLoad: remainingLoad / 1000,

            usagePercentage:Number(usagePercentage.toFixed(2)),

            runningAppliances

        });
    }
    catch(error){
        console.log ("LiveLoad Error:",error);
        res.status(500).json(
            {
                success:false,
                message:"Server Error",
            }
        );
    }
}