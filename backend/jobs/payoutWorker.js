
const { Worker } = require("bullmq");
const IORedis = require("ioredis");
const Earning = require("../models/Earning");
const Booking = require("../models/Booking");
const Refund = require("../models/Refund");

const connection = new IORedis(
  process.env.REDIS_URL || "redis://127.0.0.1:6379",
  { maxRetriesPerRequest: null }
);

const payoutWorker = new Worker(
  "payout-eligibility",
  async (job) => {
    const { bookingId } = job.data;

    const booking = await Booking.findById(bookingId);

    if (
      !booking ||
      booking.status !== "COMPLETED" ||
      booking.paymentStatus !== "PAID"
    ) {
      return {
        skipped: true,
        reason: "Booking not completed or payment not paid",
      };
    }

    const earning = await Earning.findOne({ booking: bookingId });

    if (!earning || earning.status !== "PENDING") {
      return {
        skipped: true,
        reason: "Earning not pending",
      };
    }

    const eligibleAt = earning.eligibleAt || booking.payoutEligibleAt;

    if (!eligibleAt || new Date() < new Date(eligibleAt)) {
      return {
        skipped: true,
        reason: "Payout eligibility date has not arrived",
      };
    }

    const pendingRefund = await Refund.exists({
      booking: bookingId,
      status: { $in: ["PENDING", "PROCESSING"] },
    });

    if (pendingRefund) {
      earning.status = "ON_HOLD";
      await earning.save();

      return {
        skipped: true,
        reason: "Refund is pending or processing",
      };
    }

    earning.status = "ELIGIBLE";
    earning.eligibleAt = new Date(eligibleAt);

    await earning.save();

    return {
      eligible: true,
      bookingId,
      earningId: earning._id,
    };
  },
  { connection }
);

payoutWorker.on("completed", (job) => {
  console.log("Payout eligibility job completed:", job.id);
});

payoutWorker.on("failed", (job, error) => {
  console.error(
    "Payout eligibility job failed:",
    job?.id,
    error.message
  );
});

payoutWorker.on("error", (error) => {
  console.error("Payout worker error:", error.message);
});

module.exports = payoutWorker;
