import Schedule from "../models/Schedule.js";
import Appliance from "../models/Appliance.js";
import EnergyHistory from "../models/EnergyHistory.js";


const MAX_LOAD = 5000;
const priorityValue = {
    lowest: 1,
    low: 2,
    medium: 3,
    high: 4,
    highest: 5
};

const days = [...Array(7)].map((_, i) =>
    new Date(2024, 0, i).toLocaleDateString("en-IN", { weekday: "long" })
);

const timeToMinutes = (time) => {
    const [hours, minutes] = time.split(":").map(Number);
    return hours * 60 + minutes;
};

const isTimeInSchedule = (currentMinutes, startMinutes, endMinutes) => {

    if (startMinutes < endMinutes) {
        return (
            currentMinutes >= startMinutes &&
            currentMinutes < endMinutes
        );
    }

    if (startMinutes > endMinutes) {
        return (
            currentMinutes >= startMinutes ||
            currentMinutes < endMinutes
        );
    }

    return false;
};

export const runScheduleEngine = async (req, res) => {
    try {
        const now = new Date();
        const currentDay = days[now.getDay()];
        // const currentTime = now.toLocaleTimeString().slice(0, 5);
        const currentTime = `${String(now.getHours()).padStart(2, "0")}:${String(now.getMinutes()).padStart(2, "0")}`;

        console.log(`Schedule Engine: ${currentDay} ${currentTime}`);

        //get enable schedule for today

        const previousDay = days[(now.getDay() + 6) % 7];


        const schedules = await Schedule.find({
            day: {
                $in: [currentDay, previousDay]
            },
            enable: true,
        }).populate("applianceId");
        // console.log("Schedules found:", schedules.length);
        // console.log("Schedules:", schedules);

        const activeApplianceIds = new Set();

        // const currentMinutes= now.getHours() * 60 + now.getMinutes();

        for (const schedule of schedules) {

            const appliance = schedule.applianceId;

            if (!appliance) continue;

            const currentMinutes = now.getHours() * 60 + now.getMinutes();

            const startMinutes = timeToMinutes(schedule.startTime);

            const endMinutes = timeToMinutes(schedule.endTime);

            // const shouldRun = isTimeInSchedule(currentMinutes, startMinutes, endMinutes);

            const isOvernight = startMinutes > endMinutes;

            let shouldRun = false;


            // NORMAL SCHEDULE
            if (!isOvernight) {

                if (schedule.day === currentDay) {

                    shouldRun =
                        currentMinutes >= startMinutes &&
                        currentMinutes < endMinutes;
                }

            }

            // OVERNIGHT SCHEDULE
            else {

                // Start of overnight schedule
                // Monday 20:00 -> Monday 23:59
                if (schedule.day === currentDay) {

                    shouldRun =
                        currentMinutes >= startMinutes;

                }

                // Continuation of overnight schedule
                // Tuesday 00:00 -> Tuesday 06:00
                else if (schedule.day === previousDay) {

                    shouldRun =
                        currentMinutes < endMinutes;
                }
            };

            console.log(
                "Current:",
                currentDay,
                currentTime,
                "Start:",
                schedule.startTime,
                "End:",
                schedule.endTime,
                "Should Run:",
                shouldRun,
                "Applicance:",
                appliance.applianceName
            );

            if (shouldRun) {

                activeApplianceIds.add(appliance._id.toString());

                if (appliance.status) {
                    continue;
                }

                const runningAppliances = await Appliance.find({
                    userId: appliance.userId,
                    status: true
                });

                const currentLoad = runningAppliances.reduce(
                    (total, item) => total + item.powerRating,
                    0
                );

                const requestedLoad = currentLoad + appliance.powerRating;

                console.log("Currently ON Appliances:");
                runningAppliances.forEach((item) => {
                    console.log(
                        `${item.applianceName} - ${item.powerRating} W - Priority: ${item.priority}`
                    );
                });
                console.log(`Current Load: ${currentLoad} W`);
                console.log(`Maximum Load: ${MAX_LOAD} W`);

                if (requestedLoad <= MAX_LOAD) {

                    appliance.status = true;
                    appliance.runStartedAt = new Date();
                    appliance.runSource = "schedule";

                    await appliance.save();

                    console.log(`AUTO ON: ${appliance.applianceName}`);

                } else {

                    // console.log(`LOAD LIMIT: ${appliance.applianceName} cannot start`);

                    // const requiredLoad = requestedLoad - MAX_LOAD;

                    // console.log(`LOAD LIMIT: ${appliance.applianceName} needs ${requiredLoad} W to start`);


                    const requiredLoad = requestedLoad - MAX_LOAD;

                    console.log(
                        `LOAD LIMIT: ${appliance.applianceName} needs ${requiredLoad} W to start`
                    );

                    // Find appliances having lower priority
                    const lowerPriorityAppliances = runningAppliances
                        .filter(
                            item =>
                                priorityValue[item.priority] <
                                priorityValue[appliance.priority]
                        )
                        .sort(
                            (a, b) =>
                                priorityValue[a.priority] -
                                priorityValue[b.priority]
                        );

                    console.log("Lower Priority Appliances:");

                    lowerPriorityAppliances.forEach((item) => {
                        console.log(
                            `${item.applianceName} - ${item.powerRating} W - Priority: ${item.priority}`
                        );
                    });

                    // Select appliances to turn OFF
                    let freedLoad = 0;
                    const appliancesToTurnOff = [];

                    for (const item of lowerPriorityAppliances) {

                        appliancesToTurnOff.push(item);

                        freedLoad += item.powerRating;

                        console.log(
                            `Selected: ${item.applianceName} - ${item.powerRating} W`
                        );

                        if (freedLoad >= requiredLoad) {
                            break;
                        }
                    }

                    console.log(`Required Load: ${requiredLoad} W`);
                    console.log(`Freed Load: ${freedLoad} W`);

                    // Not enough load can be freed
                    if (freedLoad < requiredLoad) {

                        console.log(
                            `LOAD LIMIT: ${appliance.applianceName} cannot start`
                        );

                        continue;
                    }

                    // Turn OFF selected appliances
                    for (const item of appliancesToTurnOff) {

                        // Create energy history before turning OFF
                        if (item.runStartedAt) {

                            const startTime = item.runStartedAt;
                            const endTime = new Date();

                            const duration =
                                (endTime.getTime() - startTime.getTime()) /
                                (1000 * 60 * 60);

                            const powerInKw =
                                item.powerRating / 1000;

                            const energyConsumed =
                                powerInKw * duration;

                            await EnergyHistory.create({
                                userId: item.userId,
                                applianceId: item._id,
                                applianceName: item.applianceName,
                                powerRating: item.powerRating,
                                startTime,
                                endTime,
                                duration: Number(duration.toFixed(2)),
                                energyConsumed: Number(
                                    energyConsumed.toFixed(3)
                                ),
                                source: item.runSource || "manual"
                            });

                            console.log(
                                `ENERGY HISTORY: ${item.applianceName}`
                            );
                        }

                        item.status = false;
                        item.runStartedAt = null;
                        item.runSource = null;

                        await item.save();

                        console.log(
                            `AUTO OFF: ${item.applianceName}`
                        );
                    }

                    // Now turn ON the scheduled appliance
                    appliance.status = true;
                    appliance.runStartedAt = new Date();
                    appliance.runSource = "schedule";

                    await appliance.save();

                    console.log(
                        `AUTO ON: ${appliance.applianceName}`
                    );


                }
            }
        }

        // TURN OFF SCHEDULED APPLIANCES

        const scheduledRunningAppliances = await Appliance.find({
            status: true,
            runSource: "schedule"
        });

        for (const appliance of scheduledRunningAppliances) {

            const applianceId = appliance._id.toString();

            if (!activeApplianceIds.has(applianceId)) {

                // Create Energy History
                if (appliance.runStartedAt) {

                    const startTime = appliance.runStartedAt;
                    const endTime = new Date();

                    const duration =
                        (endTime.getTime() - startTime.getTime()) /
                        (1000 * 60 * 60);

                    const powerInKw =
                        appliance.powerRating / 1000;

                    const energyConsumed =
                        powerInKw * duration;

                    await EnergyHistory.create({
                        userId: appliance.userId,
                        applianceId: appliance._id,
                        applianceName: appliance.applianceName,
                        powerRating: appliance.powerRating,
                        startTime,
                        endTime,
                        duration: Number(duration.toFixed(2)),
                        energyConsumed: Number(
                            energyConsumed.toFixed(3)
                        ),
                        source: "schedule"
                    });

                    console.log(
                        `ENERGY HISTORY: ${appliance.applianceName} | ` +
                        `Duration: ${duration.toFixed(2)}h | ` +
                        `Energy: ${energyConsumed.toFixed(3)} kWh`
                    );
                }

                // Turn OFF
                appliance.status = false;
                appliance.runStartedAt = null;
                appliance.runSource = null;

                await appliance.save();

                console.log(
                    `AUTO OFF: ${appliance.applianceName}`
                );
            }
        }
    }

    catch (error) {
        console.error(
            "Schedule Engine Error:",
            error
        );
    }
};


