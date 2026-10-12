
const mongoose = require("mongoose");
const Payout = require("../models/Payout");
const Earning = require("../models/Earning");

const getMentorPayouts = async (req, res) => {
  try {
    const { mentorId } = req.params;
  const userId =
  req.user?._id ||
  req.user?.id ||
  req.user?.userId;
    if (!mongoose.Types.ObjectId.isValid(mentorId)) {
      return res.status(400).json({
        success: false,
        message: "Invalid mentor ID",
      });
    }

    // Mentors can view only their own payouts; admins can view any mentor.
    if (
      req.user?.role !== "admin" &&
      (req.user?.role !== "mentor" ||
        String(userId) !== String(mentorId))
    ) {
      return res.status(403).json({
        success: false,
        message: "Access denied",
      });
    }
    console.log("Logged-in user:", req.user);
console.log("Requested mentorId:", mentorId);

    const payouts = await Payout.find({ mentor: mentorId })
      .sort({ createdAt: -1 });

    const eligibleEarnings = await Earning.find({
      mentor: mentorId,
      status: "ELIGIBLE",
    });

    const availablePaise = eligibleEarnings.reduce(
      (total, earning) => total + earning.amountPaise,
      0
    );

    return res.status(200).json({
      success: true,
      availablePaise,
      payouts,
    });
  } catch (error) {
    console.error("Get mentor payouts error:", error.message);
    return res.status(500).json({
      success: false,
      message: "Unable to fetch payouts",
    });
  }
};

module.exports = { getMentorPayouts };
