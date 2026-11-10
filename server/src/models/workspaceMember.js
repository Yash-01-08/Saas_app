
import mongoose from "mongoose";

const workspaceMemberSchema = new mongoose.Schema(
    {
        user: {
            type: mongoose.Schema.Types.ObjectId,
            ref: "User",
            required: true
        },

        workspace: {
            type: mongoose.Schema.Types.ObjectId,
            ref: "Workspace",
            required: true
        },

        role: {
            type: String,
            enum: ["admin", "member", "viewer"],
            default: "member"
        },

        addedBy: {
            type: mongoose.Schema.Types.ObjectId,
            ref: "User",
            required: true
        },

        joinedAt: {
            type: Date,
            default: Date.now
        }
    },
    {
        timestamps: true
    }
);

// A user can only be added once to a workspace.
workspaceMemberSchema.index(
    { workspace: 1, user: 1 },
    { unique: true }
);

const WorkspaceMember = mongoose.model(
    "WorkspaceMember",
    workspaceMemberSchema
);

export default WorkspaceMember;
