
const express = require("express");
const router = express.Router();

const {
  completeBooking,
  getBookingById,
} = require("../controllers/completeBookingController");

router.get("/:bookingId", getBookingById);
router.patch("/:bookingId/complete", completeBooking);

module.exports = router;
