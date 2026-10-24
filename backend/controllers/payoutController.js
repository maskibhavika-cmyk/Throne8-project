
const mongoose = require("mongoose");
const Payout = require("../models/Payout");
const Earning = require("../models/Earning");

const getMentorPayouts = async (req, res) => {
  try {
    const { mentorId } = req.params;
    const userId =
      req.user?._id || req.user?.id || req.user?.userId;

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

const createPayoutRequest = async (req, res) => {
  try {
    const userId =
      req.user?._id || req.user?.id || req.user?.userId;

    if (req.user?.role !== "mentor" || !userId) {
      return res.status(403).json({
        success: false,
        message: "Only mentors can request payouts",
      });
    }

    const mentorId = String(userId);

    if (!mongoose.Types.ObjectId.isValid(mentorId)) {
      return res.status(400).json({
        success: false,
        message: "Invalid mentor ID",
      });
    }

    const amountPaise = Number(req.body.amountPaise);

    if (
      !Number.isSafeInteger(amountPaise) ||
      amountPaise <= 0
    ) {
      return res.status(400).json({
        success: false,
        message: "Enter a valid payout amount in paise",
      });
    }

    const eligibleEarnings = await Earning.find({
      mentor: mentorId,
      status: "ELIGIBLE",
    });

    const availablePaise = eligibleEarnings.reduce(
      (total, earning) => total + earning.amountPaise,
      0
    );

    const pendingPayouts = await Payout.find({
      mentor: mentorId,
      status: {
        $in: ["PENDING", "APPROVED", "PROCESSING"],
      },
    });

    const alreadyRequestedPaise = pendingPayouts.reduce(
      (total, payout) => total + payout.amountPaise,
      0
    );

    const requestablePaise =
      availablePaise - alreadyRequestedPaise;

    if (amountPaise > requestablePaise) {
      return res.status(400).json({
        success: false,
        message: "Payout amount exceeds available eligible earnings",
        availablePaise: Math.max(0, requestablePaise),
      });
    }

    const payout = await Payout.create({
      mentor: mentorId,
      amountPaise,
      status: "PENDING",
    });

    return res.status(201).json({
      success: true,
      message: "Payout request created successfully",
      payout,
    });
  } catch (error) {
    console.error("Create payout request error:", error.message);
    return res.status(500).json({
      success: false,
      message: "Unable to create payout request",
    });
  }
};

module.exports = {
  getMentorPayouts,
  createPayoutRequest,
};
