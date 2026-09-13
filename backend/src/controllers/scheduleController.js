import Schedule from "../models/Schedule.js";
import Appliance from "../models/Appliance.js";

export const createSchedule = async (req, res) => {
    try {

        const { applianceId, days, startTime, endTime } = req.body;
        console.log("SCHEDULE BODY:", req.body);

        if (!applianceId || !days || !Array.isArray(days) || days.length === 0 || !startTime || !endTime) {
            return res.status(400).json({
                success: false,
                message: "Appliance, day, start time and end time are required",
            });
        }

        const appliance = await Appliance.findOne({
            _id: applianceId,
            userId: req.user.id
        });

        if (!appliance) {
            return res.status(404).json({
                success: false,
                message: "Appliance not found"
            });
        }

        if (startTime === endTime) {
            return res.status(404).json({
                success: false,
                message: "Start time and end time cannot be the same",
            });
        }

        //valid days

        const validDays = [...Array(7)].map((_, i) =>
            new Date(2024, 0, i).toLocaleDateString("en-In", { weekday: "long" })
        );

        // Check whether all days are valid
        const invalidDays = days.filter(
            day => !validDays.includes(day)
        );

        if (invalidDays.length > 0) {
            return res.status(400).json({
                success: false,
                message: "Invalid day selected",
                invalidDays
            });
        }

        const schedule = await Promise.all(
            days.map(day => {
                return Schedule.create({
                    userId: req.user.id,
                    applianceId,
                    day,
                    startTime,
                    endTime
                });
            })
        );

        res.status(201).json({
            success: true,
            message: `${schedule.length} Schedule(s) created successfully`,
            schedule
        });

    }
    catch (error) {
        console.log("crateSchedule error :", error);
        res.status(500).json({
            success: false,
            message: "Server Error"
        });
    }
};

//get all schedules

export const getSchedules = async (req, res) => {
    try {

        const schedules = await Schedule.find({
            userId: req.user.id,
        })
            .populate(
                "applianceId",
                "applianceName room powerRating priority status"
            )
            .sort({
                day: 1,
                startTime: 1
            });

        res.status(200).json({
            success: true,
            count: schedules.length,
            schedules
        })
    }
    catch (error) {
        console.log("getscheduling Error", error);
        res.status(500).json({
            success: false,
            message: "server error"
        });
    }
};

//update schedule

export const updateSchedule = async (req, res) => {
    try {

        const { applianceId, day, startTime, endTime } = req.body;

        const schedules = await Schedule.findOne({
            _id: req.params.id,
            userId: req.user.id,
        });

        if (!schedules) {
            return res.status(404).json({
                success: false,
                message: "schedule not found",
            });
        };

        const appliance = await Appliance.findOne({
            _id: applianceId,
            userId: req.user.id,
        });

        if (!appliance) {
            return res.status(404).json({
                success: false,
                message: "Appliance not found"
            });
        }

        const newStartTime = startTime ?? schedules.startTime;
        const newEndTime = endTime ?? schedules.endTime;

        if (newStartTime === newEndTime) {
            return res.status(400).json({
                success: false,
                message: "End time must be later than start time"
            });
        }

        schedules.day = day ?? schedules.day;
        schedules.startTime = newEndTime;
        schedules.endTime = newEndTime;

        await schedules.save();

        res.status(200).json({
            success: true,
            message: "Schedule updated successfully",
            schedules
        });

    }
    catch (error) {
        console.log("updateSchedule Error", error);
        res.status(500).json({
            success: false,
            message: "Server Error"
        });
    }
};

//deleteingSchedule

export const deleteSchedule = async (req, res) => {
    try {

        const schedule = await Schedule.findOneAndDelete({
            _id: req.params.id,
            userId: req.user.id,
        });

        if (!schedule) {
            returnres.status(404).json({
                success: false,
                message: "Schedule not found"
            });
        };

        res.status(200).json({
            success: true,
            message: "Schedule deleted successfully"
        });

    }
    catch (error) {
        console.log("deletingScheduling error", error);
        res.status(500).json({
            success: false,
            message: "Server Error",
        });
    }
};

// Enable/ desable scheduling

export const toggleSchedule = async (req, res) => {
    try {

        const schedule = await Schedule.findOne({
            _id: req.params.id,
            userId: req.user.id,
        });

        if (!schedule) {
            return res.status(404).json({
                success: false,
                message: "Schedule not found"
            });
        };

        schedule.enabled = !schedule.enabled;

        await schedule.save();

        res.status(200).json({
            success: true,
            message: schedule.enanled ? "Schedule enabled" : "Schedule Desabled",
            schedule,
        });

    }
    catch (error) {
        console.log("toggleScheduling Error", error);
        res.status(500).json({
            success: false,
            message: "Server Error",
        });
    }
};