import Schedule from "../models/Schedule.js";
import Appliance from "../models/Appliance.js";


const MAX_LOAD = 5000;

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

        // console.log(`Schedule Engine: ${currentDay} ${currentTime}`);

        //get enable schedule for today

        const previousDay = days[(now.getDay() + 6) % 7];


        const schedules = await Schedule.find({
            day: {
                $in: [currentDay, previousDay]
            },
            // enable: true,
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

                const requestedLoad =
                    currentLoad + appliance.powerRating;

                if (requestedLoad <= MAX_LOAD) {

                    appliance.status = true;
                    await appliance.save();

                    console.log(
                        `AUTO ON: ${appliance.applianceName}`
                    );

                } else {

                    console.log(
                        `LOAD LIMIT: ${appliance.applianceName} cannot start`
                    );
                }
            }
        }

        //turn offappliances

        const runningAppliances = await Appliance.find({
            status: true
        });

        for (const appliance of runningAppliances) {
            const applianceId = appliance._id.toString();

            if (!activeApplianceIds.has(applianceId)) {
                appliance.status = false;

                await appliance.save();
                console.log(`Auto OFF: ${appliance.applianceName}`);

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


