import { mongoose, Types } from "mongoose";

const ScheduleSchema = new mongoose.Schema(
    {
        userId: {
            type: mongoose.Schema.Types.ObjectId,
            ref: "User",
            required: true
        },

        appliancesId: {
            type: mongoose.Schema.Types.ObjectId,
            ref: "Appliance",
            required: true,
        },

        day: {
            type: String,
            enum: [
                "Monday",
                "Tuesday",
                "Wednesday",
                "Thursday",
                "Friday",
                "Saturday",
                "Sunday"
            ],
            required: true
        },

        startTime:{
            type:String,
            required:true
        },

        endTime:{
            type:String,
            required:true
        },

        enabled:{
            type:Boolean,
            default:true
        },
    },

    {
        timestamps: true
    },
);

const Schedule  = mongoose.model("Schedule ",ScheduleSchema );
export default Schedule;