
const mongoose = require("mongoose");

const webhookEventSchema  = new mongoose.Schema(
  {
    eventId: {
      type: String,
      required: true,
      unique: true,
    },

    eventType: {
      type: String,
      required: true,
    },

    processed: {
      type: Boolean,
      default: false,
    },

    payload: {
      type: mongoose.Schema.Types.Mixed,
      default: {},
    },
  },
  { timestamps: true }
);

module.exports  =  mongoose.model(
  "WebhookEvent",
  webhookEventSchema
);
