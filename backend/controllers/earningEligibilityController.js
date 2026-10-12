
const Earning = require("../models/Earning");

const updateEligibleEarnings = async (req, res) => {
  try {
    const now = new Date();

    const earnings = await Earning.find({
      status: "PENDING",
      eligibleAt: { $ne: null, $lte: now },
    }).populate("booking", "status paymentStatus");

    let updatedCount = 0;

    for (const earning of earnings) {
      if (
        earning.booking &&
        earning.booking.status === "COMPLETED" &&
        earning.booking.paymentStatus === "PAID"
      ) {
        earning.status = "ELIGIBLE";
        await earning.save();
        updatedCount++;
      }
    }

    return res.status(200).json({
      success: true,
      message: "Eligible earnings updated",
      updatedCount,
    });
  } catch (error) {
    return res.status(500).json({
      success: false,
      message: "Unable to update eligible earnings",
    });
  }
};

module.exports = { updateEligibleEarnings };
