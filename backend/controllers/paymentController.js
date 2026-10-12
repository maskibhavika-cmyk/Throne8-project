
const Booking = require("../models/Booking");
const Payment = require("../models/Payment");
const MentorAccount = require("../models/MentorAccount");
const Razorpay = require("razorpay");

const razorpay = new Razorpay({
  key_id: process.env.RAZORPAY_KEY_ID,
  key_secret: process.env.RAZORPAY_KEY_SECRET,
});

const createPaymentOrder = async (req, res) => {
  try {
    const { studentId, mentorId, sessionDate, amountPaise } = req.body;

    if (
      !studentId ||
      !mentorId ||
      !sessionDate ||
      !Number.isSafeInteger(amountPaise) ||
      amountPaise <= 0 ||
      amountPaise > 100000000
    ) {
      return res.status(400).json({
        success: false,
        message: "Please provide valid booking details",
      });
    }

    if (
      !Booking.base.Types.ObjectId.isValid(studentId) ||
      !Booking.base.Types.ObjectId.isValid(mentorId)
    ) {
      return res.status(400).json({
        success: false,
        message: "Invalid student or mentor ID",
      });
    }

    // Student can create only their own booking
    const loggedInUserId = req.user?._id || req.user?.id;

    if (
      !loggedInUserId ||
      String(loggedInUserId) !== String(studentId)
    ) {
      return res.status(403).json({
        success: false,
        message: "You can only create your own booking",
      });
    }

    // Validate session date
    const parsedSessionDate = new Date(sessionDate);

    if (Number.isNaN(parsedSessionDate.getTime()) ||
        parsedSessionDate <= new Date()) {
      return res.status(400).json({
        success: false,
        message: "Please provide a valid future session date",
      });
    }

    const mentorAccount = await MentorAccount.findOne({
      mentor: mentorId,
    });

    const commissionRateBps =
      mentorAccount?.commissionRateBps ?? 2000;

    if (
      !Number.isSafeInteger(commissionRateBps) ||
      commissionRateBps < 0 ||
      commissionRateBps > 10000
    ) {
      return res.status(400).json({
        success: false,
        message: "Invalid mentor commission rate",
      });
    }

    const commissionPaise = Math.floor(
      (amountPaise * commissionRateBps + 5000) / 10000
    );

    const mentorGrossPaise = amountPaise - commissionPaise;

    const razorpayOrder = await razorpay.orders.create({
      amount: amountPaise,
      currency: "INR",
      receipt: `throne8_${Date.now()}`,
      notes: {
        studentId: String(studentId),
        mentorId: String(mentorId),
      },
    });

    const booking = await Booking.create({
      student: studentId,
      mentor: mentorId,
      sessionDate: parsedSessionDate,
      amountPaise,
      commissionRateBps,
      commissionPaise,
      mentorGrossPaise,
    });

    const payment = await Payment.create({
      booking: booking._id,
      student: studentId,
      amountPaise,
      currency: "INR",
      razorpayOrderId: razorpayOrder.id,
      status: "CREATED",
    });

    return res.status(201).json({
      success: true,
      message: "Razorpay order and booking created",
      keyId: process.env.RAZORPAY_KEY_ID,
      order: razorpayOrder,
      booking,
      payment,
    });
  } catch (error) {
    console.error("Create payment order error:", error.message);

    return res.status(500).json({
      success: false,
      message: "Unable to create payment order",
    });
  }
};

module.exports = { createPaymentOrder };
