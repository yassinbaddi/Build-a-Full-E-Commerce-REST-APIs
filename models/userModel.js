const mongoose = require('mongoose')

const userSchema = new mongoose.Schema(
    {
        user: {
            type: String,
            trim: true,
            required: true,
            unique: true,
        },

        slug: {
            type: String,
            lowercase: true,
            unique: true,
        },

        email: {
            type: String,
            required: true,
            lowercase: true,
            trim: true,
            unique: true,
        },

        phone: String,

        profileImg: String,

        password: {
            type: String,
            required: true,
            minlength: 6,
        },
        passwordChangedAt: {
            type: Date,
            default: undefined
        },

        passwordResetCode: {
            type: String,
            default: undefined
        },

        passwordResetExpires: {
            type: Date,
            default: undefined
        },

        passwordResetVerified: {
            type: Boolean,
            default: false
        },
        role: {
            type: String,
            enum: ["user", "admin"],
            default: "user",
        },
        active: {
            type: Boolean,
            default: true
        }
    },
    { timestamps: true }
);


const userModel = mongoose.model('Users', userSchema)


module.exports = {
    userModel
}
