
const crypto = require("crypto");
const Razorpay = require("razorpay");
const Payment = require("../models/Payment");
const Booking = require("../models/Booking");

const razorpay = new Razorpay({
  key_id: process.env.RAZORPAY_KEY_ID,
  key_secret: process.env.RAZORPAY_KEY_SECRET,
});

const verifyPayment = async (req, res) => {
  try {
    console.log("VERIFY BODY:", req.body);

    const {
      razorpay_order_id,
      razorpay_payment_id,
      razorpay_signature,
    } = req.body;

    if (
      !razorpay_order_id ||
      !razorpay_payment_id ||
      !razorpay_signature
    ) {
      return res.status(400).json({
        success: false,
        message: "Payment details are missing",
      });
    }

    const payment = await Payment.findOne({
      razorpayOrderId: razorpay_order_id,
    });

    if (!payment) {
      return res.status(404).json({
        success: false,
        message: "Payment record not found for this order",
      });
    }

    const expectedSignature = crypto
      .createHmac("sha256", process.env.RAZORPAY_KEY_SECRET)
      .update(`${razorpay_order_id}|${razorpay_payment_id}`)
      .digest("hex");

    const actual = Buffer.from(razorpay_signature, "hex");
    const expected = Buffer.from(expectedSignature, "hex");

    if (
      actual.length !== expected.length ||
      !crypto.timingSafeEqual(actual, expected)
    ) {
      return res.status(400).json({
        success: false,
        message: "Invalid payment signature",
      });
    }

    const providerPayment = await razorpay.payments.fetch(
      razorpay_payment_id
    );

    if (
      providerPayment.order_id !== razorpay_order_id ||
      providerPayment.amount !== payment.amountPaise ||
      providerPayment.currency !== payment.currency ||
      providerPayment.status !== "captured"
    ) {
      return res.status(400).json({
        success: false,
        message: "Payment details do not match or payment is not captured",
      });
    }

    const booking = await Booking.findById(payment.booking);

    if (!booking) {
      return res.status(404).json({
        success: false,
        message: "Booking not found",
      });
    }

    if (
      String(booking.student) !== String(payment.student) ||
      booking.amountPaise !== payment.amountPaise
    ) {
      return res.status(400).json({
        success: false,
        message: "Booking and payment do not match",
      });
    }

    if (
      payment.status === "PAID" &&
      booking.paymentStatus === "PAID"
    ) {
      return res.status(200).json({
        success: true,
        message: "Payment already verified",
      });
    }

    if (
      payment.status !== "CREATED" ||
      booking.paymentStatus !== "PENDING" ||
      booking.status !== "PENDING"
    ) {
      return res.status(409).json({
        success: false,
        message: "Booking or payment is not in a payable state",
      });
    }

    payment.razorpayPaymentId = razorpay_payment_id;
    payment.status = "PAID";
    payment.paidAt = new Date();

    await payment.save();

    booking.paymentStatus = "PAID";
    booking.status = "CONFIRMED";

    await booking.save();

    return res.status(200).json({
      success: true,
      message: "Payment verified and booking confirmed",
      paymentStatus: payment.status,
      bookingStatus: booking.status,
      bookingId: booking._id,
    });
  } catch (error) {
    console.error("Verify payment error:", error.message);

    return res.status(500).json({
      success: false,
      message: "Unable to verify payment",
    });
  }
};

module.exports = { verifyPayment };
