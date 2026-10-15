
const Payment = require("../models/Payment");
const Booking = require("../models/Booking");
const Earning = require("../models/Earning");
const Razorpay = require("razorpay");

const razorpay = new Razorpay({
  key_id: process.env.RAZORPAY_KEY_ID,
  key_secret: process.env.RAZORPAY_KEY_SECRET,
});

const recoverEarnings = async (req, res) => {
  try {
    const payments = await Payment.find({ status: "PAID" });

    let recoveredCount = 0;
    let skippedCount = 0;

    for (const payment of payments) {
      try {
        // Validate saved booking and payment data
        const booking = await Booking.findById(payment.booking);

        if (
          !booking ||
          booking.paymentStatus !== "PAID" ||
          String(booking.student) !== String(payment.student) ||
          booking.amountPaise !== payment.amountPaise ||
          !payment.razorpayOrderId ||
          !payment.razorpayPaymentId ||
          !payment.razorpayPaymentId.startsWith("pay_")
        ) {
          skippedCount++;
          continue;
        }

        // Verify payment directly with Razorpay
        const providerPayment = await razorpay.payments.fetch(
          payment.razorpayPaymentId
        );

        if (
          providerPayment.order_id !== payment.razorpayOrderId ||
          providerPayment.amount !== payment.amountPaise ||
          providerPayment.currency !== payment.currency ||
          providerPayment.status !== "captured"
        ) {
          skippedCount++;
          continue;
        }

        // Avoid creating an earning that already exists
        const existing = await Earning.findOne({
          booking: booking._id,
        });

        if (existing) {
          skippedCount++;
          continue;
        }

        if (
          !Number.isSafeInteger(booking.mentorGrossPaise) ||
          booking.mentorGrossPaise < 0
        ) {
          skippedCount++;
          continue;
        }

        await Earning.create({
          booking: booking._id,
          mentor: booking.mentor,
          amountPaise: booking.mentorGrossPaise,
          status: "PENDING",
        });

        recoveredCount++;
      } catch (paymentError) {
        // One bad record must not stop the remaining records
        console.error(
          "Skipping payment record:",
          payment._id,
          paymentError?.error?.description ||
            paymentError?.message ||
            "Verification failed"
        );

        skippedCount++;
      }
    }

    return res.status(200).json({
      success: true,
      message: "Earning recovery completed",
      recoveredCount,
      skippedCount,
    });
  } catch (error) {
    console.error("Recover earnings error:", error);

    return res.status(500).json({
      success: false,
      message: "Earnings recovery failed",
    });
  }
};

module.exports = { recoverEarnings };
