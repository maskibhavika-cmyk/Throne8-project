
const mongoose = require("mongoose");
const Booking = require("../models/Booking");
const Earning = require("../models/Earning");
const Refund = require("../models/Refund");

// Get booking details
const getBookingById = async (req, res) => {
  try {
    const { bookingId } = req.params;

    if (!mongoose.Types.ObjectId.isValid(bookingId)) {
      return res.status(400).json({
        success: false,
        message: "Invalid booking ID",
      });
    }

    const booking = await Booking.findById(bookingId)
      .populate("mentor", "name email")
      .select("-__v");

    if (!booking) {
      return res.status(404).json({
        success: false,
        message: "Booking not found",
      });
    }

    // Students can view only their own booking.
    // Mentors can view only bookings assigned to them.
    if (
      req.user &&
      req.user.role === "student" &&
      String(booking.student) !== String(req.user._id || req.user.id)
    ) {
      return res.status(403).json({
        success: false,
        message: "Access denied",
      });
    }

    if (
      req.user &&
      req.user.role === "mentor" &&
      String(booking.mentor._id) !==
        String(req.user._id || req.user.id)
    ) {
      return res.status(403).json({
        success: false,
        message: "Access denied",
      });
    }

    return res.status(200).json({ success: true, booking });
  } catch (error) {
    console.error("Get booking error:", error.message);
    return res.status(500).json({
      success: false,
      message: "Unable to get booking",
    });
  }
};

// Complete a confirmed and paid booking
const completeBooking = async (req, res) => {
  try {
    const { bookingId } = req.params;

    if (!mongoose.Types.ObjectId.isValid(bookingId)) {
      return res.status(400).json({
        success: false,
        message: "Invalid booking ID",
      });
    }

    const booking = await Booking.findById(bookingId);

    if (!booking) {
      return res.status(404).json({
        success: false,
        message: "Booking not found",
      });
    }

    // Only the assigned mentor or admin can complete the booking.
    if (
      req.user?.role !== "admin" &&
      (
        req.user?.role !== "mentor" ||
        String(booking.mentor) !==
          String(req.user?._id || req.user?.id)
      )
    ) {
      return res.status(403).json({
        success: false,
        message: "Only the assigned mentor or admin can complete this booking",
      });
    }

    if (
      booking.status !== "CONFIRMED" ||
      booking.paymentStatus !== "PAID"
    ) {
      return res.status(400).json({
        success: false,
        message: "Only confirmed and paid bookings can be completed",
      });
    }

    if (booking.completedAt) {
      return res.status(409).json({
        success: false,
        message: "Booking is already completed",
      });
    }

    const completedAt = new Date();
    const payoutEligibleAt = new Date(completedAt);

    // 15 calendar days, using UTC date arithmetic.
    payoutEligibleAt.setUTCDate(
      payoutEligibleAt.getUTCDate() + 15
    );

    // Keep earnings on hold if a refund is pending or processing.
    const pendingRefund = await Refund.exists({
      booking: booking._id,
      status: { $in: ["PENDING", "PROCESSING"] },
    });

    booking.status = "COMPLETED";
    booking.completedAt = completedAt;
    booking.payoutEligibleAt = payoutEligibleAt;
    await booking.save();

    const earning = await Earning.findOneAndUpdate(
      { booking: booking._id },
      {
        $setOnInsert: {
          booking: booking._id,
          mentor: booking.mentor,
          amountPaise: booking.mentorGrossPaise,
          status: "PENDING",
          eligibleAt: payoutEligibleAt,
        },
      },
      { upsert: true, new: true }
    );

    // Do not mark earning eligible here.
    // The eligibility job checks the 15-day date and refund status.
    if (pendingRefund && earning.status === "ELIGIBLE") {
      earning.status = "ON_HOLD";
      await earning.save();
    }

    return res.status(200).json({
      success: true,
      message: "Booking completed and earning recorded",
      booking,
      earning,
    });
  } catch (error) {
    console.error("Complete booking error:", error.message);
    return res.status(500).json({
      success: false,
      message: "Unable to complete booking",
    });
  }
};

module.exports = { completeBooking, getBookingById };
