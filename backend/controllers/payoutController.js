
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

    const [payouts, earnings] = await Promise.all([
      Payout.find({ mentor: mentorId }).sort({ createdAt: -1 }),
      Earning.find({ mentor: mentorId }).populate({
        path: "booking",
        select: "status paymentStatus payoutEligibleAt",
      }),
    ]);

    let availablePaise = 0;
    let holdPaise = 0;

    for (const earning of earnings) {
      const amount = Number(earning.amountPaise || 0);
      const booking = earning.booking;

      if (earning.status === "ELIGIBLE") {
        availablePaise += amount;
      }

      if (earning.status === "ON_HOLD") {
        holdPaise += amount;
      } else if (
        earning.status === "PENDING" &&
        booking?.status === "COMPLETED" &&
        booking?.paymentStatus === "PAID"
      ) {
        const eligibleDate =
          earning.eligibleAt || booking.payoutEligibleAt;

        if (
          !eligibleDate ||
          new Date(eligibleDate).getTime() > Date.now()
        ) {
          holdPaise += amount;
        }
      }
    }

    const totalPaidPaise = payouts
      .filter((p) => p.status === "PAID")
      .reduce((sum, p) => sum + Number(p.amountPaise || 0), 0);

    const processingPaise = payouts
      .filter((p) =>
        ["PENDING", "APPROVED", "PROCESSING"].includes(p.status)
      )
      .reduce((sum, p) => sum + Number(p.amountPaise || 0), 0);

    const requestedPaise = payouts
      .filter((p) =>
        ["PENDING", "APPROVED", "PROCESSING"].includes(p.status)
      )
      .reduce((sum, p) => sum + Number(p.amountPaise || 0), 0);

    return res.status(200).json({
      success: true,
      availablePaise: Math.max(0, availablePaise - requestedPaise),
      holdPaise,
      totalPaidPaise,
      processingPaise,
      payouts,
    });
  } catch (error) {
    console.error("Get mentor payouts error:", error);
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

    const amountPaise = Number(req.body?.amountPaise);

    if (
      !Number.isSafeInteger(amountPaise) ||
      amountPaise <= 0
    ) {
      return res.status(400).json({
        success: false,
        message: "Enter a valid payout amount in paise",
      });
    }

    const [eligibleEarnings, pendingPayouts] = await Promise.all([
      Earning.find({ mentor: mentorId, status: "ELIGIBLE" }),
      Payout.find({
        mentor: mentorId,
        status: { $in: ["PENDING", "APPROVED", "PROCESSING"] },
      }),
    ]);

    const availablePaise = eligibleEarnings.reduce(
      (sum, earning) => sum + Number(earning.amountPaise || 0),
      0
    );

    const alreadyRequestedPaise = pendingPayouts.reduce(
      (sum, payout) => sum + Number(payout.amountPaise || 0),
      0
    );

    const requestablePaise = Math.max(
      0,
      availablePaise - alreadyRequestedPaise
    );

    if (amountPaise > requestablePaise) {
      return res.status(400).json({
        success: false,
        message: "Payout amount exceeds available eligible earnings",
        availablePaise: requestablePaise,
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
    console.error("Create payout request error:", error);
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
