
const mongoose = require("mongoose");

const mentorAccountSchema = new mongoose.Schema(
  {
    mentor: {
      type: mongoose.Schema.Types.ObjectId,
      ref: "User",
      required: true,
      unique: true,
    },

    commissionRateBps: {
      type: Number,
      default: 2000,
      min: 0,
      max: 10000,
    },

    razorpayAccountId: {
      type: String,
      default: null,
    },

    verificationStatus: {
      type: String,
      enum: ["PENDING", "VERIFIED", "REJECTED"],
      default: "PENDING",
    },

    payoutEnabled: {
      type: Boolean,
      default: false,
    },

    isOnHold: {
      type: Boolean,
      default: false,
    },
  },
  { timestamps: true }
);

module.exports = mongoose.model(
  "MentorAccount",
  mentorAccountSchema
);
