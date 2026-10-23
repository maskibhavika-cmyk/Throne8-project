
const mongoose = require("mongoose");
const Payout = require("../models/Payout");
const Earning = require("../models/Earning");

const approvePayout = async (req, res) => {
  try {
    const { id } = req.params;

    if (!mongoose.Types.ObjectId.isValid(id)) {
      return res.status(400).json({
        success: false,
        message: "Invalid payout ID",
      });
    }

    const payout = await Payout.findById(id);

    if (!payout) {
      return res.status(404).json({
        success: false,
        message: "Payout not found",
      });
    }

    if (payout.status !== "PENDING") {
      return res.status(400).json({
        success: false,
        message: `Cannot approve payout with status ${payout.status}`,
      });
    }

    const eligibleEarnings = await Earning.find({
      mentor: payout.mentor,
      status: "ELIGIBLE",
    });

    const availablePaise = eligibleEarnings.reduce(
      (total, earning) => total + earning.amountPaise,
      0
    );

    if (availablePaise < payout.amountPaise) {
      return res.status(400).json({
        success: false,
        message: "Insufficient eligible earnings",
        availablePaise,
        requestedPaise: payout.amountPaise,
      });
    }

    payout.status = "APPROVED";
    payout.approvedAt = new Date();

    await payout.save();

    return res.status(200).json({
      success: true,
      message: "Payout approved. No bank transfer has been initiated.",
      payout,
    });
  } catch (error) {
    console.error("Approve payout error:", error.message);

    return res.status(500).json({
      success: false,
      message: "Unable to approve payout",
    });
  }
};

module.exports = { approvePayout };
