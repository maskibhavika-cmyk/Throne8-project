
const mongoose = require("mongoose");
const Earning = require("../models/Earning");

const getMentorEarnings = async (req, res) => {
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

    const earnings = await Earning.find({
      mentor: mentorId,
    })
      .populate("booking", "sessionDate status paymentStatus amountPaise")
      .sort({ createdAt: -1 });

    const totalByStatus = {
      pendingPaise: 0,
      onHoldPaise: 0,
      eligiblePaise: 0,
      paidPaise: 0,
      reversedPaise: 0,
    };

    for (const earning of earnings) {
      if (earning.status === "PENDING") {
        totalByStatus.pendingPaise += earning.amountPaise;
      } else if (earning.status === "ON_HOLD") {
        totalByStatus.onHoldPaise += earning.amountPaise;
      } else if (earning.status === "ELIGIBLE") {
        totalByStatus.eligiblePaise += earning.amountPaise;
      } else if (earning.status === "PAID") {
        totalByStatus.paidPaise += earning.amountPaise;
      } else if (earning.status === "REVERSED") {
        totalByStatus.reversedPaise += earning.amountPaise;
      }
    }

    return res.status(200).json({
      success: true,
      totalByStatus,
      earnings,
    });
  } catch (error) {
    console.error("Get mentor earnings error:", error.message);
    return res.status(500).json({
      success: false,
      message: "Unable to fetch mentor earnings",
    });
  }
};

module.exports = { getMentorEarnings };
