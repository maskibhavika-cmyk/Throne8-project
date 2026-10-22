const mongoose = require("mongoose");
const Refund = require("../models/Refund");
const Payment = require("../models/Payment");
const Booking = require("../models/Booking");

const createRefundRequest = async (req, res) => {
  try {
    const { bookingId, paymentId, amountPaise, reason } = req.body;
    const userId = req.user?._id || req.user?.id;

    if (
      !mongoose.Types.ObjectId.isValid(bookingId) ||
      !mongoose.Types.ObjectId.isValid(paymentId) ||
      !Number.isSafeInteger(amountPaise) ||
      amountPaise <= 0 ||
      typeof reason !== "string" ||
      !reason.trim()
    ) {
      return res.status(400).json({
        success: false,
        message: "Please provide valid refund details",
      });
    }

    const booking = await Booking.findById(bookingId);
    const payment = await Payment.findById(paymentId);

    if (!booking || !payment) {
      return res.status(404).json({
        success: false,
        message: "Booking or payment not found",
      });
    }

    if (
      req.user?.role !== "admin" &&
      String(booking.student) !== String(userId)
    ) {
      return res.status(403).json({
        success: false,
        message: "Access denied",
      });
    }

    if (String(payment.booking) !== String(booking._id)) {
      return res.status(400).json({
        success: false,
        message: "Payment does not belong to this booking",
      });
    }

    if (payment.status !== "PAID") {
      return res.status(400).json({
        success: false,
        message: "Only paid payments can be refunded",
      });
    }

    const existingRefunds = await Refund.find({
      payment: payment._id,
      status: { $in: ["PENDING", "PROCESSING", "APPROVED", "COMPLETED"] },
    });

    const totalRefundPaise = existingRefunds.reduce(
      (total, refund) => total + refund.amountPaise,
      0
    );

    if (totalRefundPaise + amountPaise > payment.amountPaise) {
      return res.status(400).json({
        success: false,
        message: "Refund exceeds remaining payment amount",
      });
    }

    const refund = await Refund.create({
      booking: booking._id,
      payment: payment._id,
      student: booking.student,
      mentor: booking.mentor,
      amountPaise,
      reason: reason.trim(),
    });

    return res.status(201).json({
      success: true,
      message: "Refund request created",
      refund,
    });
  } catch (error) {
    console.error("Create refund request error:", error.message);
    return res.status(500).json({
      success: false,
      message: "Unable to create refund request",
    });
  }
};
const getAllRefunds = async (req, res) => {
  try {
    const refundsRaw = await Refund.find().sort({ createdAt: -1 }).lean();
    const refunds = await Promise.all(refundsRaw.map(async (r) => {
      const sId = r.student?.$oid || r.student;
      const mId = r.mentor?.$oid || r.mentor;
      let student = null, mentor = null;
      try { if (sId) student = await User.findById(sId).select("name email").lean(); } catch {}
      try { if (mId) mentor = await User.findById(mId).select("name email").lean(); } catch {}
      return { ...r, student, mentor };
    }));
    res.json({ success: true, refunds });
  } catch (err) {
    res.status(500).json({ success: false, message: "Failed" });
  }
};
const approveRefund = async (req, res) => {
  try {
    const refund = await Refund.findByIdAndUpdate(
      req.params.id,
      { status: "APPROVED" },
      { new: true }
    );
    if (!refund) return res.status(404).json({ success: false, message: "Refund nahi mila" });
    res.json({ success: true, message: "Refund approved", refund });
  } catch (err) {
    console.error("Approve error:", err);
    res.status(500).json({ success: false, message: "Approve failed", error: err.message });
  }
};

const rejectRefund = async (req, res) => {
  try {
    const refund = await Refund.findByIdAndUpdate(
      req.params.id,
      { status: "REJECTED" },
      { new: true }
    );
    if (!refund) return res.status(404).json({ success: false, message: "Refund nahi mila" });
    res.json({ success: true, message: "Refund rejected", refund });
  } catch (err) {
    console.error("Reject error:", err);
    res.status(500).json({ success: false, message: "Reject failed", error: err.message });
  }
};

module.exports = { createRefundRequest, getAllRefunds, approveRefund, rejectRefund };