const Refund = require("../models/Refund");
const Payment = require("../models/Payment");
const Booking = require("../models/Booking");

const createRefundRequest = async (req, res) => {
  try {
    const { bookingId, paymentId, amountPaise, reason } = req.body;

    if (
      !bookingId ||
      !paymentId ||
      !Number.isSafeInteger(amountPaise) ||
      amountPaise <= 0 ||
      !reason?.trim()
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
    message: "Total refund amount exceeds remaining payment amount",
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
    return res.status(500).json({
      success: false,
      message: error.message,
    });
  }
};

module.exports = { createRefundRequest };