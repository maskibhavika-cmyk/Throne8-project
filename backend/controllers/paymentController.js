const mongoose = require("mongoose");
const Booking = require("../models/Booking");
const Payment = require("../models/Payment");
const MentorAccount = require("../models/MentorAccount");
const User = require("../models/User");
const Razorpay = require("razorpay");

const razorpay = new Razorpay({
  key_id: process.env.RAZORPAY_KEY_ID,
  key_secret: process.env.RAZORPAY_KEY_SECRET,
});

const createPaymentOrder = async (req, res) => {
  let booking = null;

  try {
    const { studentId, mentorId, sessionDate, amountPaise } = req.body;

    const loggedInUserId =
      req.user?._id || req.user?.id || req.user?.userId;

    if (!loggedInUserId || req.user?.role !== "student") {
      return res.status(403).json({
        success: false,
        message: "Only students can create bookings",
      });
    }

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
      !mongoose.Types.ObjectId.isValid(studentId) ||
      !mongoose.Types.ObjectId.isValid(mentorId)
    ) {
      return res.status(400).json({
        success: false,
        message: "Invalid student or mentor ID",
      });
    }

    if (String(loggedInUserId) !== String(studentId)) {
      return res.status(403).json({
        success: false,
        message: "You can only create your own booking",
      });
    }

    const parsedSessionDate = new Date(sessionDate);

    if (
      Number.isNaN(parsedSessionDate.getTime()) ||
      parsedSessionDate <= new Date()
    ) {
      return res.status(400).json({
        success: false,
        message: "Please provide a valid future session date",
      });
    }

    const mentor = await User.findById(mentorId).select("role");

    if (!mentor || mentor.role !== "mentor") {
      return res.status(400).json({
        success: false,
        message: "Selected user is not a mentor",
      });
    }

    const mentorAccount = await MentorAccount.findOne({
      mentor: mentorId,
    });

    if (
      !mentorAccount ||
      mentorAccount.verificationStatus !== "VERIFIED" ||
      mentorAccount.isOnHold
    ) {
      return res.status(403).json({
        success: false,
        message: "Mentor is not eligible for bookings",
      });
    }

    const commissionRateBps = mentorAccount.commissionRateBps;

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

    booking = await Booking.create({
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
      order: {
        id: razorpayOrder.id,
        amount: razorpayOrder.amount,
        currency: razorpayOrder.currency,
      },
      booking: {
        _id: booking._id,
        amountPaise: booking.amountPaise,
        commissionRateBps: booking.commissionRateBps,
        commissionPaise: booking.commissionPaise,
        mentorGrossPaise: booking.mentorGrossPaise,
      },
      payment: {
        _id: payment._id,
        status: payment.status,
        amountPaise: payment.amountPaise,
        razorpayOrderId: payment.razorpayOrderId,
      },
    });
  } catch (error) {
    console.error("Create payment order error:", error.message);

    if (booking?._id) {
      try {
        await Payment.deleteMany({ booking: booking._id });
        await Booking.deleteOne({ _id: booking._id });
      } catch (cleanupError) {
        console.error("Booking cleanup error:", cleanupError.message);
      }
    }

    return res.status(500).json({
      success: false,
      message: "Unable to create payment order",
    });
  }
};

module.exports = { createPaymentOrder };