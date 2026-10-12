
const Earning = require("../models/Earning");

const getMentorEarnings = async (req, res) => {
  try {
    const { mentorId } = req.params;

    const earnings = await Earning.find({
      mentor: mentorId,
    }).populate("booking", "sessionDate status amountPaise");

    const totalByStatus = {
      pendingPaise: 0,
      onHoldPaise: 0,
      eligiblePaise: 0,
      paidPaise: 0,
      reversedPaise: 0,
    };

    earnings.forEach((earning) => {
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
    });

    return res.status(200).json({
      success: true,
      totalByStatus,
      earnings,
    });
  } catch (error) {
    return res.status(500).json({
      success: false,
      message: error.message,
    });
  }
};

module.exports = { getMentorEarnings };
