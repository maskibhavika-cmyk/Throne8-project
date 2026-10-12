
const mongoose = require("mongoose");

const ledgerEntrySchema = new mongoose.Schema(
  {
    booking: {
      type: mongoose.Schema.Types.ObjectId,
      ref: "Booking",
      default: null,
    },

    mentor: {
      type: mongoose.Schema.Types.ObjectId,
      ref: "User",
      default: null,
    },

    type: {
      type: String,
      enum: [
        "PAYMENT",
        "COMMISSION",
        "EARNING",
        "REFUND",
        "PAYOUT",
        "REVERSAL",
      ],
      required: true,
    },

    amountPaise: {
      type: Number,
      required: true,
    },

    referenceId: {
      type: String,
      required: true,
    },

    description: {
      type: String,
      default: "",
    },
  },
  { timestamps: true }
);

module.exports = mongoose.model(
  "LedgerEntry",
  ledgerEntrySchema
);
