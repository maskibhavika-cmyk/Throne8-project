
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

    // Only booking student or admin can request a refund.
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
      status: { $in: ["PENDING", "PROCESSING", "COMPLETED"] },
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

module.exports = { createRefundRequest };
