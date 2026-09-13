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
                message: "Appliance not found"
            });
        }

        //TURN OFF

        if (appliance.status) {
            appliance.status = false;

            await appliance.save();

            return res.status(200).json({
                success: true,
                message: "Appliance turned OFF",
                appliance
            })
        };

        //turn ON

        const runningAppliances = await Appliance.find({
            userId: req.user.id,
            status: true
        });

        const currentLoad = runningAppliances.reduce((total, appliance) => total + appliance.powerRating, 0);

        const newLoad = currentLoad + appliance.powerRating;

        const MAX_LOAD = 5000;

        console.log("Priority Load Management");
        console.log("Appliance:", appliance.applianceName);
        console.log("Priority:", appliance.priority);
        console.log("Current Load:", currentLoad);
        console.log("Appliance Power:", appliance.powerRating);
        console.log("New Load:", newLoad);
        console.log("Maximum Load:", MAX_LOAD);
        console.log("===============");

        //Is Load Avalable

        if (newLoad <= MAX_LOAD) {
            appliance.status = true;

            await appliance.save();

            return res.status(200).json({
                success: true,
                message: "Appliance turned ON",
                appliance
            })
        };

        //Load Limit Exceeded

        const reduceLoad = newLoad - MAX_LOAD;
        console.log(`Need to free ${reduceLoad}`);

        //Priority Order

        const priorityValue = {
            lowest: 1,
            low: 2,
            medium: 3,
            high: 4,
            highest: 5
        };

        //find lower priority running appliances

        const lowerPriorityAppliances =
            runningAppliances.filter(item => {
                return (
                    priorityValue[item.priority] < priorityValue[appliance.priority]
                );
            });
        console.log(
            "Lower priority appliances",
            lowerPriorityAppliances.map(item => ({
                name: item.applianceName,
                power: item.powerRating,
                priority: item.priority
            }))
        );

        // find the best combination based on priority

        let bestCombination = null;

        // Sort from lowest priority to highest priority
        lowerPriorityAppliances.sort((a, b) => {
            return priorityValue[a.priority] - priorityValue[b.priority];
        });

        let freeLoad = 0;
        const appliancesToTurnOff = [];

        for (const item of lowerPriorityAppliances) {

            appliancesToTurnOff.push(item);

            freeLoad += item.powerRating;

            console.log(
                `Selected: ${item.applianceName} | ` +
                `Priority: ${item.priority} | ` +
                `Power: ${item.powerRating}W | ` +
                `Freed Load: ${freeLoad}W`
            );

            if (freeLoad >= reduceLoad) {
                break;
            }
        }

        if (freeLoad >= reduceLoad) {
            bestCombination = appliancesToTurnOff;
        }

        //check result

        if (!bestCombination) {
            return res.status(400).json({
                success: false,
                message: "Power load limit exceeded and no sufficient lower-priority load can be removed",
                currentLoad,
                appliancesPower: appliance.powerRating,
                requestedLoad: newLoad,
                reduceLoad,
                maximumLoad: MAX_LOAD

            });
        }

        console.log("Required Load", reduceLoad);
        console.log("Selected appliances:", bestCombination.map(item => item.applianceName));
        console.log("Free Load", freeLoad);


        //Not enough load can free

        if (freeLoad < reduceLoad) {
            return res.status(400).json({
                success: false,
                message: "Power load limit exceeded and no sufficient lower-priority load can be removed",

                currentLoad,
                AppliancesPower: appliance.powerRating,
                requestedLoad: newLoad,
                reduceLoad,
                maximunLoad: MAX_LOAD,
            });
        }

        //Turn OFF lower priority

        for (const item of bestCombination) {
            item.status = false;

            await item.save();

            console.log(`lowPriorityAppliances OFF: ${item.applianceName}`);
        }

        // Turn on request appliances

        appliance.status = true;

        await appliance.save();

        console.log(`priorityAppliancesON: ${appliance.applianceName}`);

        res.status(200).json({
            success: true,
            message: "Appliances turn ON using priority management",
            appliance,
            turnOffAppliances: bestCombination.map(item => ({
                id: item.id,
                applianceName: item.applianceName,
                powerRating: item.powerRating,
                priority: item.priority
            }))
        });

    }
    catch (error) {
        console.log("toggle Error", error);
        res.status(500).json({
            success: false,
            message: "Server Error"
        });
    }
};

//Live Load

export const getLiveLoad = async (req, res) => {
    try {

        const MAX_LOAD = 5000;

        const runningAppliances = await Appliance.find({
            userId: req.user.id,
            status: true,
        });

        const currentLoad = runningAppliances.reduce(
            (total, appliance) => total + appliance.powerRating, 0
        );

        const currentLoadPerKW = currentLoad / 1000;

        const remainingLoad = Math.max(MAX_LOAD - currentLoad, 0);

        const usagePercentage = (currentLoad / MAX_LOAD) * 100;

        res.status(200).json({
            success: true,
            currentLoad,
            currentLoadPerKW,

            maximumLoad: MAX_LOAD,
            remainingLoad: remainingLoad / 1000,

            usagePercentage: Number(usagePercentage.toFixed(2)),

            runningAppliances

        });
    }
    catch (error) {
        console.log("LiveLoad Error:", error);
        res.status(500).json(
            {
                success: false,
                message: "Server Error",
            }
        );
    }
}