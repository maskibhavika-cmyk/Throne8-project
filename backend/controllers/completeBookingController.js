
const mongoose = require("mongoose");
const Booking = require("../models/Booking");
const Earning = require("../models/Earning");

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

    return res.status(200).json({
      success: true,
      booking,
    });
  } catch (error) {
    return res.status(500).json({
      success: false,
      message: error.message,
    });
  }
};

// Complete a confirmed and paid booking
const completeBooking = async (req, res) => {
  try {
    const { bookingId } = req.params;

    const booking = await Booking.findById(bookingId);

    if (!booking) {
      return res.status(404).json({
        success: false,
        message: "Booking not found",
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
      return res.status(400).json({
        success: false,
        message: "Booking is already completed",
      });
    }

    const completedAt = new Date();
    const payoutEligibleAt = new Date(completedAt);
    payoutEligibleAt.setDate(payoutEligibleAt.getDate() + 15);

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

    return res.status(200).json({
      success: true,
      message: "Booking completed and earning recorded",
      booking,
      earning,
    });
  } catch (error) {
    return res.status(500).json({
      success: false,
      message: error.message,
    });
  }
};

module.exports = { completeBooking, getBookingById };
