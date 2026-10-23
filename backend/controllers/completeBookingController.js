
const mongoose = require("mongoose");
const Booking = require("../models/Booking");
const Earning = require("../models/Earning");
const Refund = require("../models/Refund");
const { payoutQueue } = require("../jobs/payoutQueue");
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

    const userId = req.user?._id || req.user?.id || req.user?.userId;
    const role = req.user?.role;

    if (!userId || !["student", "mentor", "admin"].includes(role)) {
      return res.status(403).json({
        success: false,
        message: "Access denied",
      });
    }

    const isStudent =
      role === "student" &&
      String(booking.student) === String(userId);

    const isAssignedMentor =
      role === "mentor" &&
      String(booking.mentor?._id || booking.mentor) === String(userId);

    const isAdmin = role === "admin";

    if (!isStudent && !isAssignedMentor && !isAdmin) {
      return res.status(403).json({
        success: false,
        message: "Access denied",
      });
    }

    return res.status(200).json({
      success: true,
      booking,
    });
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

    const userId = req.user?._id || req.user?.id || req.user?.userId;
    const role = req.user?.role;

    if (!userId || !["mentor", "admin"].includes(role)) {
      return res.status(403).json({
        success: false,
        message:
          "Only the assigned mentor or admin can complete this booking",
      });
    }

    const booking = await Booking.findById(bookingId);

    if (!booking) {
      return res.status(404).json({
        success: false,
        message: "Booking not found",
      });
    }

    if (
      role === "mentor" &&
      String(booking.mentor) !== String(userId)
    ) {
      return res.status(403).json({
        success: false,
        message: "Only the assigned mentor can complete this booking",
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

    const completedAt = new Date();

    if (new Date(booking.sessionDate) > completedAt) {
      return res.status(400).json({
        success: false,
        message: "The session time has not arrived yet",
      });
    }

    if (booking.completedAt) {
      return res.status(409).json({
        success: false,
        message: "Booking is already completed",
      });
    }

    const payoutEligibleAt = new Date(completedAt);
    payoutEligibleAt.setUTCDate(
      payoutEligibleAt.getUTCDate() + 15
    );

    const pendingRefund = await Refund.exists({
      booking: booking._id,
      status: { $in: ["PENDING", "PROCESSING"] },
    });

    const completedBooking = await Booking.findOneAndUpdate(
      {
        _id: booking._id,
        status: "CONFIRMED",
        paymentStatus: "PAID",
        completedAt: null,
        sessionDate: { $lte: completedAt },
      },
      {
        $set: {
          status: "COMPLETED",
          completedAt,
          payoutEligibleAt,
        },
      },
      {
        new: true,
        runValidators: true,
      }
    );

    if (!completedBooking) {
      return res.status(409).json({
        success: false,
        message:
          "Booking was already completed or is no longer eligible",
      });
    }

    const earning = await Earning.findOneAndUpdate(
      { booking: completedBooking._id },
      {
        $setOnInsert: {
          booking: completedBooking._id,
          mentor: completedBooking.mentor,
          amountPaise: completedBooking.mentorGrossPaise,
          status: pendingRefund ? "ON_HOLD" : "PENDING",
          eligibleAt: payoutEligibleAt,
        },
      },
      {
        upsert: true,
        new: true,
        runValidators: true,
      }
    );
    if (!pendingRefund) {
  await payoutQueue.add(
    "make-earning-eligible",
    { bookingId: String(completedBooking._id) },
    {
      delay: Math.max(
        0,
        payoutEligibleAt.getTime() - Date.now()
      ),
      jobId: `payout-${completedBooking._id}`,
      removeOnComplete: true,
    }
  );
}

    if (pendingRefund && earning.status !== "ON_HOLD") {
      earning.status = "ON_HOLD";
      await earning.save();
    }

    // TEMPORARILY DISABLED:
    // BullMQ requires Redis 5.0+, but the installed Redis is 3.0.504.
    // Earning remains PENDING until payout eligibility is processed
    // using a compatible Redis/BullMQ setup.

    return res.status(200).json({
      success: true,
      message: "Booking completed and earning recorded",
      booking: completedBooking,
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

module.exports = {
  completeBooking,
  getBookingById,
};
