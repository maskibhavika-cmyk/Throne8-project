const express = require("express");
const router = express.Router();

const {
  getMentorPayouts,
} = require("../controllers/payoutController");
const {
  createRefundRequest,
} = require("../controllers/refundController");

const {
  getMentorEarnings,
} = require("../controllers/earningController");

const {
  createPaymentOrder,
} = require("../controllers/paymentController");

const {
  getPaymentStatus,
} = require("../controllers/paymentStatusController");
const {
  completeBooking,
} = require("../controllers/completeBookingController");
const {
  markPaymentFailed,
} = require("../controllers/paymentFailureController");

const {
  updateEligibleEarnings,
} = require("../controllers/earningEligibilityController");
const {
  authMiddleware,
  authorizeRoles,
} = require("../middleware/authMiddleware");
const {
  verifyPayment,
} = require("../controllers/verifyPaymentController");

router.get("/test", (req, res) => {
  res.json({
    success: true,
    message: "THRONE8 payment routes working",
  });
});

router.post("/orders", createPaymentOrder);
router.patch("/bookings/:bookingId/complete", completeBooking);
router.get("/:id", getPaymentStatus);
router.post("/refunds", authMiddleware, createRefundRequest);

router.get(
  "/earnings/:mentorId",
  authMiddleware,
  authorizeRoles("mentor"),
  getMentorEarnings
);

router.get(
  "/payouts/:mentorId",
  authMiddleware,
  authorizeRoles("mentor"),
  getMentorPayouts
);
router.patch("/:paymentId/fail", markPaymentFailed);

router.patch(
  "/earnings/update-eligible",
  authMiddleware,
  authorizeRoles("admin"),
  updateEligibleEarnings
);
router.post("/orders", authMiddleware, createPaymentOrder);
router.post("/verify", verifyPayment);
module.exports = router;