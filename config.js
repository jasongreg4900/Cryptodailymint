const mongoose = require("mongoose")

const loginSchema = new mongoose.Schema({
    username: {
        type: String,
        lowercase: true,
        trim: true,
        required: true
    },
    address: {
        type: String,
        required: true
    },
    password: {
        type: String,
        required: true
    },
    balance: {
        type: Number,
        default: 0
    },
    totalEarned: {
         type: Number, 
         default: 0 
        },
    isMining: {
         type: Boolean, 
         default: false 
        },
    miningStartedAt: {
         type: Number, 
         default: null 
        },
    miningEndsAt: {
         type: Number, 
         default: null 
        },
    created: {
        type: Date,
        default: Date.now
    },
    referralCode: {
        type: String
    },
    referredBy: {
        type: String
    },
    referralCount: {
        type: Number, 
        default: 0 
    },
    hasGivenReferralBonus: {
        type: Boolean, 
        default: false 
    },
    depositAddress: {
        type: String,
    },
    qrCodeUrl: {
        type: String,
    },
    acceptedTerms: {
        type: Boolean,
        default: false,
        required: true
    },
    recoveryCodes: [{
        codeHash: { String },
        used: { type: Boolean, default: false }
    }],
    role: { type: String, enum: ["user", "admin"], default: "user" },
    }, { timestamps: true })


const collection = new mongoose.model("users", loginSchema)

module.exports = collection;