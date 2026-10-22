
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
    const skippedReasons = [];

    for (const payment of payments) {
      try {
        const booking = await Booking.findById(payment.booking);

        // 1. Check booking and saved payment data
        if (!booking) {
          skippedReasons.push({
            paymentId: String(payment._id),
            reason: "Booking not found for this payment",
          });
          skippedCount++;
          continue;
        }

        if (
          booking.paymentStatus !== "PAID" ||
          String(booking.student) !== String(payment.student) ||
          booking.amountPaise !== payment.amountPaise ||
          !payment.razorpayOrderId ||
          !payment.razorpayPaymentId ||
          !payment.razorpayPaymentId.startsWith("pay_")
        ) {
          skippedReasons.push({
            paymentId: String(payment._id),
            bookingId: String(booking._id),
            reason: "Booking/payment fields mismatch",
            bookingPaymentStatus: booking.paymentStatus,
            bookingAmountPaise: booking.amountPaise,
            paymentAmountPaise: payment.amountPaise,
            hasOrderId: Boolean(payment.razorpayOrderId),
            hasPaymentId: Boolean(payment.razorpayPaymentId),
          });
          skippedCount++;
          continue;
        }

        // 2. Verify the payment with Razorpay
        const providerPayment = await razorpay.payments.fetch(
          payment.razorpayPaymentId
        );

        if (
          providerPayment.order_id !== payment.razorpayOrderId ||
          providerPayment.amount !== payment.amountPaise ||
          providerPayment.currency !== payment.currency ||
          providerPayment.status !== "captured"
        ) {
          skippedReasons.push({
            paymentId: String(payment._id),
            reason: "Razorpay payment details do not match or payment is not captured",
            providerStatus: providerPayment.status,
            providerAmount: providerPayment.amount,
            providerCurrency: providerPayment.currency,
          });
          skippedCount++;
          continue;
        }

        // 3. Do not create duplicate earnings
        const existing = await Earning.findOne({
          booking: booking._id,
        });

        if (existing) {
          skippedReasons.push({
            paymentId: String(payment._id),
            bookingId: String(booking._id),
            reason: "Earning already exists for this booking",
            earningId: String(existing._id),
            earningStatus: existing.status,
          });
          skippedCount++;
          continue;
        }

        // 4. Validate mentor share
        if (
          !Number.isSafeInteger(booking.mentorGrossPaise) ||
          booking.mentorGrossPaise <= 0 ||
          !booking.mentor
        ) {
          skippedReasons.push({
            paymentId: String(payment._id),
            bookingId: String(booking._id),
            reason: "Invalid mentor, or mentorGrossPaise is missing/invalid",
            mentorGrossPaise: booking.mentorGrossPaise,
          });
          skippedCount++;
          continue;
        }

        // 5. Create earning only for a verified payment
        await Earning.create({
          booking: booking._id,
          mentor: booking.mentor,
          amountPaise: booking.mentorGrossPaise,
          status: "PENDING",
        });

        recoveredCount++;
      } catch (paymentError) {
        const reason =
          paymentError?.error?.description ||
          paymentError?.message ||
          "Verification failed";

        console.error(
          "Skipping payment record:",
          payment._id,
          reason
        );

        skippedReasons.push({
          paymentId: String(payment._id),
          reason,
        });

        skippedCount++;
      }
    }

    return res.status(200).json({
      success: true,
      message: "Earning recovery completed",
      checkedPayments: payments.length,
      recoveredCount,
      skippedCount,
      skippedReasons,
    });
  } catch (error) {
    console.error("Recover earnings error:", error);

    return res.status(500).json({
      success: false,
      message: "Earnings recovery failed",
      error: error.message,
    });
  }
};

module.exports = { recoverEarnings };
