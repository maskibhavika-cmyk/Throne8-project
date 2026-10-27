
const mongoose = require("mongoose");
const Earning = require("../models/Earning");
const Payout = require("../models/Payout");

const formatMoneyValue = (paise) => Number(paise || 0) / 100;

const getMentorEarnings = async (req, res) => {
  try {
    const { mentorId } = req.params;
    const userId = req.user?._id || req.user?.id || req.user?.userId;

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

    const earnings = await Earning.find({ mentor: mentorId })
      .populate({
        path: "booking",
        select:
          "student sessionDate status paymentStatus amountPaise commissionPaise mentorGrossPaise payoutEligibleAt",
        populate: { path: "student", select: "name" },
      })
      .sort({ createdAt: -1 });

    const payoutRecords = await Payout.find({ mentor: mentorId })
      .sort({ createdAt: -1 });

    const summary = {
      total: 0,
      paid: 0,
      pending: 0,
      hold: 0,
      eligible: 0,
      reversed: 0,
      processing: 0,
    };

    const ledger = [];

    for (const earning of earnings) {
      const amount = formatMoneyValue(earning.amountPaise);
      const booking = earning.booking;

      if (earning.status !== "REVERSED") {
        summary.total += amount;
      }

      if (earning.status === "PAID") summary.paid += amount;
      else if (earning.status === "PENDING") summary.pending += amount;
      else if (earning.status === "ON_HOLD") summary.hold += amount;
      else if (earning.status === "ELIGIBLE") summary.eligible += amount;
      else if (earning.status === "REVERSED") summary.reversed += amount;

      let status = earning.status || "PENDING";

      if (earning.status === "PENDING") {
        status =
          booking?.status === "COMPLETED" &&
          booking?.paymentStatus === "PAID"
            ? "Awaiting payout eligibility"
            : "Awaiting session";
      } else if (earning.status === "ON_HOLD") {
        status = "In 15-day hold";
      } else if (earning.status === "ELIGIBLE") {
        status = "Eligible";
      } else if (earning.status === "PAID") {
        status = "Paid to bank";
      } else if (earning.status === "REVERSED") {
        status = "Reversed";
      }

      ledger.push({
        _id: String(earning._id),
        bookingId: booking?._id
          ? String(booking._id).slice(-6).toUpperCase()
          : "—",
        student: booking?.student?.name || "Student",
        sessionFee: formatMoneyValue(booking?.amountPaise),
        commission: formatMoneyValue(booking?.commissionPaise),
        yourEarning: amount,
        status,
        payoutDate: earning.paidAt
          ? new Date(earning.paidAt).toLocaleDateString("en-IN")
          : earning.eligibleAt
            ? new Date(earning.eligibleAt).toLocaleDateString("en-IN")
            : booking?.payoutEligibleAt
              ? new Date(booking.payoutEligibleAt).toLocaleDateString("en-IN")
              : "After session + 15 days",
      });
    }

    const payouts = payoutRecords.map((payout) => ({
      _id: String(payout._id),
      amountPaise: payout.amountPaise,
      status: payout.status,
      transferId: payout.providerPayoutId || String(payout._id),
      createdAt: payout.createdAt,
    }));

    summary.processing = payoutRecords
      .filter((p) => p.status === "PROCESSING")
      .reduce((sum, p) => sum + formatMoneyValue(p.amountPaise), 0);

    return res.status(200).json({
      success: true,
      summary,
      ledger,
      payouts,
    });
  } catch (error) {
    console.error("Get mentor earnings error:", error);
    return res.status(500).json({
      success: false,
      message: "Unable to fetch mentor earnings",
    });
  }
};

module.exports = { getMentorEarnings };
