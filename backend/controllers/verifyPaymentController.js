
const crypto = require("crypto");
const mongoose = require("mongoose");
const Razorpay = require("razorpay");

const Payment = require("../models/Payment");
const Booking = require("../models/Booking");
const Earning = require("../models/Earning");

const razorpay = new Razorpay({
  key_id: process.env.RAZORPAY_KEY_ID,
  key_secret: process.env.RAZORPAY_KEY_SECRET,
});

const verifyPayment = async (req, res) => {
  try {
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
        message: "Payment record not found",
      });
    }

    const expectedSignature = crypto
      .createHmac("sha256", process.env.RAZORPAY_KEY_SECRET)
      .update(`${razorpay_order_id}|${razorpay_payment_id}`)
      .digest("hex");

    let validSignature = false;

    try {
      const actual = Buffer.from(razorpay_signature, "hex");
      const expected = Buffer.from(expectedSignature, "hex");

      validSignature =
        actual.length === expected.length &&
        actual.length > 0 &&
        crypto.timingSafeEqual(actual, expected);
    } catch {
      validSignature = false;
    }

    if (!validSignature) {
      return res.status(400).json({
        success: false,
        message: "Invalid payment signature",
      });
    }

    // Verify payment directly with Razorpay.
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

    // Idempotent retry: do not create a second earning.
    if (
      payment.status === "PAID" &&
      booking.paymentStatus === "PAID" &&
      payment.razorpayPaymentId === razorpay_payment_id
    ) {
      await Earning.updateOne(
        { booking: booking._id },
        {
          $setOnInsert: {
            booking: booking._id,
            mentor: booking.mentor,
            amountPaise: booking.mentorGrossPaise,
            status: "PENDING",
          },
        },
        { upsert: true }
      );

      return res.status(200).json({
        success: true,
        message: "Payment already verified",
        paymentStatus: "PAID",
        bookingStatus: booking.status,
      });
    }

    if (
      payment.status !== "CREATED" ||
      booking.paymentStatus !== "PENDING" ||
      booking.status !== "PENDING"
    ) {
      return res.status(409).json({
        success: false,
        message: "Booking or payment is not payable",
      });
    }

    const session = await mongoose.startSession();

    try {
      await session.withTransaction(async () => {
        const updatedPayment = await Payment.findOneAndUpdate(
          {
            _id: payment._id,
            status: "CREATED",
          },
          {
            $set: {
              razorpayPaymentId: razorpay_payment_id,
              status: "PAID",
              paidAt: new Date(),
            },
          },
          { new: true, session }
        );

        if (!updatedPayment) {
          const currentPayment = await Payment.findById(
            payment._id
          ).session(session);

          if (
            currentPayment?.status === "PAID" &&
            currentPayment.razorpayPaymentId === razorpay_payment_id
          ) {
            return;
          }

          throw new Error("Payment status changed; verify again");
        }

        const updatedBooking = await Booking.findOneAndUpdate(
          {
            _id: booking._id,
            status: "PENDING",
            paymentStatus: "PENDING",
          },
          {
            $set: {
              paymentStatus: "PAID",
              status: "CONFIRMED",
            },
          },
          { new: true, session }
        );

        if (!updatedBooking) {
          throw new Error("Booking status changed; verify again");
        }

        await Earning.updateOne(
          { booking: booking._id },
          {
            $setOnInsert: {
              booking: booking._id,
              mentor: booking.mentor,
              amountPaise: booking.mentorGrossPaise,
              status: "PENDING",
            },
          },
          { upsert: true, session }
        );
      });
    } finally {
      await session.endSession();
    }

    return res.status(200).json({
      success: true,
      message: "Payment verified and booking confirmed",
      paymentStatus: "PAID",
      bookingStatus: "CONFIRMED",
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
