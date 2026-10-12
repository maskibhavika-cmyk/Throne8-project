
const Earning = require("../models/Earning");
const Refund = require("../models/Refund");

const updateEligibleEarnings = async (req, res) => {
  try {
    const now = new Date();

    const earnings = await Earning.find({
      status: "PENDING",
      eligibleAt: { $ne: null, $lte: now },
    }).populate("booking", "status paymentStatus");

    let updatedCount = 0;

    for (const earning of earnings) {
      const booking = earning.booking;

      if (
        !booking ||
        booking.status !== "COMPLETED" ||
        booking.paymentStatus !== "PAID"
      ) {
        continue;
      }

      const pendingRefund = await Refund.exists({
        booking: booking._id,
        status: { $in: ["PENDING", "PROCESSING"] },
      });

      if (pendingRefund) continue;

      earning.status = "ELIGIBLE";
      await earning.save();
      updatedCount++;
    }

    return res.status(200).json({
      success: true,
      message: "Eligible earnings updated",
      updatedCount,
    });
  } catch (error) {
    console.error("Earning eligibility error:", error.message);

    return res.status(500).json({
      success: false,
      message: "Unable to update eligible earnings",
    });
  }
};

module.exports = { updateEligibleEarnings };
