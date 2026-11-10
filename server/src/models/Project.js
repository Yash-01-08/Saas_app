
import mongoose from "mongoose";

const projectSchema = new mongoose.Schema(
    {
        name: {
            type: String,
            required: true,
            trim: true
        },

        description: {
            type: String,
            default: ""
        },

        workspace: {
            type: mongoose.Schema.Types.ObjectId,
            ref: "Workspace",
            required: true
        },

        createdBy: {
            type: mongoose.Schema.Types.ObjectId,
            ref: "User",
            required: true
        },

        status: {
            type: String,
            enum: ["planning", "active", "completed", "archived"],
            default: "planning"
        },

        priority: {
            type: String,
            enum: ["low", "medium", "high"],
            default: "medium"
        },

        startDate: {
            type: Date,
            default: null
        },

        dueDate: {
            type: Date,
            default: null
        }
    },
    { timestamps: true }
);

projectSchema.index({ workspace: 1, name: 1 });

const Project = mongoose.model("Project", projectSchema);

export default Project;
