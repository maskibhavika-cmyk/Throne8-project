const Payout = require("../models/Payout");
const Earning = require("../models/Earning");

const getMentorPayouts = async (req, res) => {
  try {
    const { mentorId } = req.params;

    const payouts = await Payout.find({
      mentor: mentorId,
    }).sort({ createdAt: -1 });

    const eligibleEarnings = await Earning.find({
      mentor: mentorId,
      status: "ELIGIBLE",
    });

    const availablePaise = eligibleEarnings.reduce(
      (total, earning) => total + earning.amountPaise,
      0
    );

    res.status(200).json({
      success: true,
      availablePaise,
      payouts,
    });
  } catch (error) {
    res.status(500).json({
      success: false,
      message: error.message,
    });
  }
};

module.exports = { getMentorPayouts };