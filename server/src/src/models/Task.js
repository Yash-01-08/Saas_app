import mongoose from "mongoose";

const taskSchema = new mongoose.Schema(
    {
        title: {
            type: String,
            required: true,
            trim: true
        },

        description: {
            type: String,
            default: ""
        },

        project: {
            type: mongoose.Schema.Types.ObjectId,
            ref: "Project",
            required: true
        },

        workspace: {
            type: mongoose.Schema.Types.ObjectId,
            ref: "Workspace",
            required: true
        },

        assignedTo: {
            type: mongoose.Schema.Types.ObjectId,
            ref: "User",
            default: null
        },

        createdBy: {
            type: mongoose.Schema.Types.ObjectId,
            ref: "User",
            required: true
        },

        status: {
            type: String,
            enum: ["todo", "in_progress", "in_review", "done"],
            default: "todo"
        },

        priority: {
            type: String,
            enum: ["low", "medium", "high", "urgent"],
            default: "medium"
        },

        dueDate: {
            type: Date,
            default: null
        },

        labels: [{
            type: String,
            trim: true
        }],

        position: {
            type: Number,
            default: 0
        },
sprint: {
    type: mongoose.Schema.Types.ObjectId,
    ref: "Sprint",
    default: null
},

    },
    { timestamps: true }
);

taskSchema.index({ project: 1, status: 1 });
taskSchema.index({ workspace: 1, assignedTo: 1 });
taskSchema.index({ project: 1, position: 1 });

const Task = mongoose.model("Task", taskSchema);

export default Task;