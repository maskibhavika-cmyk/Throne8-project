
const mongoose = require("mongoose");
const Payout = require("../models/Payout");
const Earning = require("../models/Earning");

const createPayoutRequest = async (req, res) => {
  try {
    const mentorId =
      req.user?._id ||
      req.user?.id ||
      req.user?.userId;

    if (
      req.user?.role !== "mentor" ||
      !mongoose.Types.ObjectId.isValid(String(mentorId || ""))
    ) {
      return res.status(403).json({
        success: false,
        message: "Only authenticated mentors can request payouts",
      });
    }

    const amountPaise = Number(req.body?.amountPaise);

    if (
      !Number.isSafeInteger(amountPaise) ||
      amountPaise < 1
    ) {
      return res.status(400).json({
        success: false,
        message: "amountPaise must be a positive integer",
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
      status: { $in: ["PENDING", "APPROVED", "PROCESSING"] },
    });

    const alreadyRequestedPaise = pendingPayouts.reduce(
      (total, payout) => total + payout.amountPaise,
      0
    );

    const remainingPaise = availablePaise - alreadyRequestedPaise;

    if (amountPaise > remainingPaise) {
      return res.status(400).json({
        success: false,
        message: "Requested amount exceeds available eligible earnings",
        availablePaise,
        alreadyRequestedPaise,
        remainingPaise,
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

module.exports = { createPayoutRequest };
