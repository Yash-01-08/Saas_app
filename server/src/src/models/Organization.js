import mongoose from "mongoose";
import crypto from "crypto";

const organizationSchema = new mongoose.Schema(
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

        owner: {
            type: mongoose.Schema.Types.ObjectId,
            ref: "User",
            required: true
        },

        inviteCode: {
            type: String,
            unique: true,
            index: true
        },

        isInviteActive: {
            type: Boolean,
            default: true
        }
    },
    {
        timestamps: true
    }
);

organizationSchema.pre("validate", function () {
    if (!this.inviteCode) {
        this.inviteCode = crypto.randomBytes(4).toString("hex").toUpperCase();
    }
});

const Organization = mongoose.model("Organization", organizationSchema);

export default Organization;