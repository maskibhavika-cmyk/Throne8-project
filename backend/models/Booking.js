
const mongoose = require("mongoose");

const bookingSchema = new mongoose.Schema(
  {
    student: {
      type: mongoose.Schema.Types.ObjectId,
      ref: "User",
      required: true,
    },

    mentor: {
      type: mongoose.Schema.Types.ObjectId,
      ref: "User",
      required: true,
    },

    sessionDate: {
      type: Date,
      required: true,
    },

    amountPaise: {
      type: Number,
      required: true,
      min: 1,
    },

    commissionRateBps: {
      type: Number,
      default: 2000,
      min: 0,
      max: 10000,
    },

    commissionPaise: {
      type: Number,
      required: true,
      min: 0,
    },

    mentorGrossPaise: {
      type: Number,
      required: true,
      min: 0,
    },

    status: {
      type: String,
      enum: [
        "PENDING",
        "CONFIRMED",
        "COMPLETED",
        "CANCELLED",
        "DISPUTED",
      ],
      default: "PENDING",
    },

    paymentStatus: {
      type: String,
      enum: ["PENDING", "PAID", "REFUNDED", "FAILED"],
      default: "PENDING",
    },

    completedAt: {
      type: Date,
      default: null,
    },

    payoutEligibleAt: {
      type: Date,
      default: null,
    },
  },
  { timestamps: true }
);

module.exports = mongoose.model("Booking", bookingSchema);
