
const mongoose = require("mongoose");
const Payment = require("../models/Payment");

const getPaymentStatus = async (req, res) => {
  try {
    const { id } = req.params;
    const userId = req.user?._id || req.user?.id;

    if (!mongoose.Types.ObjectId.isValid(id)) {
      return res.status(400).json({
        success: false,
        message: "Invalid payment ID",
      });
    }

    const payment = await Payment.findById(id);

    if (!payment) {
      return res.status(404).json({
        success: false,
        message: "Payment not found",
      });
    }

    // Student can view only their own payment; admin can view any.
    if (
      req.user?.role !== "admin" &&
      String(payment.student) !== String(userId)
    ) {
      return res.status(403).json({
        success: false,
        message: "Access denied",
      });
    }

    return res.status(200).json({
      success: true,
      paymentStatus: payment.status,
      amountPaise: payment.amountPaise,
      currency: payment.currency,
    });
  } catch (error) {
    console.error("Get payment status error:", error.message);
    return res.status(500).json({
      success: false,
      message: "Unable to fetch payment status",
    });
  }
};

module.exports = { getPaymentStatus };
