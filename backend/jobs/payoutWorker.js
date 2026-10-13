const { Worker } = require("bullmq");
const IORedis = require("ioredis");
const Earning = require("../models/Earning");
const Booking = require("../models/Booking");

const connection = new IORedis(
  process.env.REDIS_URL || "redis://127.0.0.1:6379",
  { maxRetriesPerRequest: null }
);

const payoutWorker = new Worker(
  "payout-eligibility",
  async (job) => {
    const { bookingId } = job.data;

    const booking = await Booking.findById(bookingId);

    if (!booking || booking.status !== "COMPLETED" ||
        booking.paymentStatus !== "PAID") {
      return { skipped: true, reason: "Booking not eligible" };
    }

    const earning = await Earning.findOne({ booking: bookingId });

    if (!earning || earning.status !== "PENDING") {
      return { skipped: true, reason: "Earning not pending" };
    }

    const eligibleAt = earning.eligibleAt || booking.payoutEligibleAt;

    if (!eligibleAt || new Date() < new Date(eligibleAt)) {
      throw new Error("Payout eligibility date has not arrived");
    }

    earning.status = "ELIGIBLE";
    earning.eligibleAt = eligibleAt;
    await earning.save();

    return { eligible: true, bookingId };
  },
  { connection }
);

payoutWorker.on("completed", (job) => {
  console.log("Payout eligibility job completed:", job.id);
});

payoutWorker.on("failed", (job, error) => {
  console.error("Payout eligibility job failed:", job?.id, error.message);
});

module.exports = payoutWorker;