
const express = require("express");
const router = express.Router();
const mongoose = require("mongoose");

const Booking = require("../models/Booking");

const {
  completeBooking,
  getBookingById,
} = require("../controllers/completeBookingController");

const {
  authMiddleware,
  authorizeRoles,
} = require("../middleware/authMiddleware");

// Mentor apni bookings dekh sakta hai
router.get(
  "/mentor/:mentorId",
  authMiddleware,
  authorizeRoles("mentor"),
  async (req, res) => {
    try {
      const { mentorId } = req.params;
      const userId = req.user?._id || req.user?.id || req.user?.userId;

      if (!mongoose.Types.ObjectId.isValid(mentorId)) {
        return res.status(400).json({
          success: false,
          message: "Invalid mentor ID",
        });
      }

      if (String(userId) !== String(mentorId)) {
        return res.status(403).json({
          success: false,
          message: "Access denied",
        });
      }

      const bookings = await Booking.find({ mentor: mentorId })
        .sort({ createdAt: -1 });

      return res.json({ success: true, bookings });
    } catch (error) {
      console.error("Mentor bookings error:", error.message);
      return res.status(500).json({
        success: false,
        message: "Unable to load bookings",
      });
    }
  }
);

router.get("/:bookingId", authMiddleware, getBookingById);

router.patch(
  "/:bookingId/complete",
  authMiddleware,
  completeBooking
);

module.exports = router;
