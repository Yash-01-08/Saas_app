
import mongoose from "mongoose";

const notificationSchema = new mongoose.Schema(
    {
        recipient: {
            type: mongoose.Schema.Types.ObjectId,
            ref: "User",
            required: true
        },

        sender: {
            type: mongoose.Schema.Types.ObjectId,
            ref: "User",
            default: null
        },

        type: {
            type: String,
            enum: [
                "task_assigned",
                "task_commented",
                "sprint_started",
                "sprint_completed",
                "workspace_invitation"
            ],
            required: true
        },

        message: {
            type: String,
            required: true,
            trim: true
        },

        task: {
            type: mongoose.Schema.Types.ObjectId,
            ref: "Task",
            default: null
        },

        project: {
            type: mongoose.Schema.Types.ObjectId,
            ref: "Project",
            default: null
        },

        sprint: {
            type: mongoose.Schema.Types.ObjectId,
            ref: "Sprint",
            default: null
        },

        workspace: {
            type: mongoose.Schema.Types.ObjectId,
            ref: "Workspace",
            default: null
        },

        isRead: {
            type: Boolean,
            default: false
        },

        readAt: {
            type: Date,
            default: null
        }
    },
    { timestamps: true }
);

// Efficient notification retrieval for each user
notificationSchema.index({ recipient: 1, createdAt: -1 });


// Efficient unread notification retrieval
notificationSchema.index({ recipient: 1, isRead: 1, createdAt: -1 });


const Notification = mongoose.model("Notification", notificationSchema);

export default Notification;
