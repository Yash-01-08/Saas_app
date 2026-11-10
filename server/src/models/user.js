
import mongoose from "mongoose";

const userSchema = new mongoose.Schema(
    {
        name: {
            type: String,
            required: true,
            trim: true
        },

        username: {
            type: String,
            required: true,
            unique: true,
            lowercase: true,
            trim: true
        },

        email: {
            type: String,
            required: true,
            unique: true,
            lowercase: true,
            trim: true
        },

        password: {
            type: String,
            required: true,
            minlength: 8,
            select: false
        },

        avatar: {
            type: String,
            default: ""
        },

        role: {
            type: String,
            enum: ["user", "admin", "superadmin"],
            default: "user"
        },
phone: {
    type: String,
    required: true,
    trim: true
},

company: {
    type: String,
    required: true,
    trim: true
},
        isVerified: {
            type: Boolean,
            default: false
        }
    },
    {
        timestamps: true
    }
    
);

const User = mongoose.model("User", userSchema);

export default User;
