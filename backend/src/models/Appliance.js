import mongoose from "mongoose";

const applianceSchema = new mongoose.Schema(
    {
        userId: {
            type: mongoose.Schema.Types.ObjectId,
            ref: "User",
            required: true,
        },
        applianceName: {
            type: String,
            required: true,
            trim: true,
        },
        room: {
            type: String,
            required: true,
            trim: true
        },
        powerRating: {
            type: Number,
            required: true,
            min: 1
        },
        priority: {
            type: String,
            enum: ["highest", "high", "medium", "low", "lowest"],
            default: "medium"
        },
        status: {
            type: Boolean,
            default: false
        },
        runStartedAt: {
            type: Date,
            default: null
        },
        runSource: {
            type: String,
            enum: ["manual", "schedule"],
            default: null
        }
    },
    {
        timestamps: true
    },
);

const Appliance = mongoose.model("Appliance", applianceSchema);
export default Appliance;