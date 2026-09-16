import mongoose from "mongoose";

const energyHistorySchema = new mongoose.Schema(
    {
        userId: {
            type: mongoose.Schema.Types.ObjectId,
            ref: "User",
            required: true,
        },
        applianceId: {
            type: mongoose.Schema.Types.ObjectId,
            ref: "Appliance",
            required: true,
        },
        applianceName: {
            type: String,
            required: true,
            trim: true
        },
        powerRating: {
            type: Number,
            required: true,
            min: 1,
        },
        startTime: {
            type: Date,
            required: true,
        },
        endTime: {
            type: Date,
            required: true,
        },
        duration: {
            type: Number,
            required: true,
            min: 0,
        },
        energyConsumed: {
            type: Number,
            required: true,
            min: 0,
        },
        source: {
            type: String,
            enum: ["manual", "schedule", "priority"],
            required: true,
        },

    },

    {
        timestamps: true,
    },

);

const EnergyHistory = mongoose.model("EnergyHistory",energyHistorySchema);
export default EnergyHistory;