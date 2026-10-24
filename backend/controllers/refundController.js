
const mongoose = require("mongoose");
const Refund = require("../models/Refund");
const Payment = require("../models/Payment");
const Booking = require("../models/Booking");
const User = require("../models/User");
const Notification = require("../models/Notification");

// Create refund request
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
        message: "Only paid bookings can be refunded",
      });
    }

    const existingRefunds = await Refund.find({
      payment: payment._id,
      status: {
        $in: ["PENDING", "PROCESSING", "APPROVED", "COMPLETED"],
      },
    });

    const totalRefundPaise = existingRefunds.reduce(
      (total, refund) => total + refund.amountPaise,
      0
    );

    if (totalRefundPaise + amountPaise > payment.amountPaise) {
      return res.status(400).json({
        success: false,
        message: "Refund amount exceeds the remaining paid amount",
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

    // Notifications: student and mentor
    try {
      await Notification.insertMany([
        {
          recipient: booking.student,
          type: "REFUND_UPDATE",
          title: "Refund Request Submitted",
          message: "Your refund request has been submitted successfully.",
          link: "/refunds",
        },
        {
          recipient: booking.mentor,
          type: "REFUND_UPDATE",
          title: "Refund Request Received",
          message: "A refund request has been submitted for a mentorship booking.",
          link: "/mentor/bookings",
        },
      ]);
    } catch (notificationError) {
      console.error(
        "Refund notification error:",
        notificationError.message
      );
    }

    return res.status(201).json({
      success: true,
      message: "Refund request created",
      refund,
    });
  } catch (error) {
    console.error("Create refund request error:", error);

    return res.status(500).json({
      success: false,
      message: "Failed to create refund request",
    });
  }
};

// Get all refunds (admin)
const getAllRefunds = async (req, res) => {
  try {
    const refunds = await Refund.find().sort({ createdAt: -1 });

    const refundsWithUsers = await Promise.all(
      refunds.map(async (refund) => {
        const student = await User.findById(refund.student).select(
          "name email"
        );
        const mentor = await User.findById(refund.mentor).select(
          "name email"
        );

        return {
          ...refund.toObject(),
          student,
          mentor,
        };
      })
    );

    return res.status(200).json({
      success: true,
      count: refundsWithUsers.length,
      refunds: refundsWithUsers,
    });
  } catch (error) {
    console.error("Get all refunds error:", error);

    return res.status(500).json({
      success: false,
      message: "Failed to fetch refunds",
    });
  }
};

// Approve refund (admin)
const approveRefund = async (req, res) => {
  try {
    const refund = await Refund.findById(req.params.id);

    if (!refund) {
      return res.status(404).json({
        success: false,
        message: "Refund not found",
      });
    }

    if (refund.status !== "PENDING") {
      return res.status(400).json({
        success: false,
        message: "Only pending refunds can be approved",
      });
    }

    refund.status = "APPROVED";
    await refund.save();

    try {
      await Notification.create({
        recipient: refund.student,
        type: "REFUND_UPDATE",
        title: "Refund Approved",
        message: "Your refund request has been approved.",
        link: "/refunds",
      });
    } catch (notificationError) {
      console.error(
        "Refund approval notification error:",
        notificationError.message
      );
    }

    return res.status(200).json({
      success: true,
      message: "Refund approved",
      refund,
    });
  } catch (error) {
    console.error("Approve refund error:", error);

    return res.status(500).json({
      success: false,
      message: "Failed to approve refund",
    });
  }
};

// Reject refund (admin)
const rejectRefund = async (req, res) => {
  try {
    const refund = await Refund.findById(req.params.id);

    if (!refund) {
      return res.status(404).json({
        success: false,
        message: "Refund not found",
      });
    }

    if (refund.status !== "PENDING") {
      return res.status(400).json({
        success: false,
        message: "Only pending refunds can be rejected",
      });
    }

    refund.status = "REJECTED";
    await refund.save();

    try {
      await Notification.create({
        recipient: refund.student,
        type: "REFUND_UPDATE",
        title: "Refund Rejected",
        message: "Your refund request has been rejected.",
        link: "/refunds",
      });
    } catch (notificationError) {
      console.error(
        "Refund rejection notification error:",
        notificationError.message
      );
    }

    return res.status(200).json({
      success: true,
      message: "Refund rejected",
      refund,
    });
  } catch (error) {
    console.error("Reject refund error:", error);

    return res.status(500).json({
      success: false,
      message: "Failed to reject refund",
    });
  }
};

module.exports = {
  createRefundRequest,
  getAllRefunds,
  approveRefund,
  rejectRefund,
};
