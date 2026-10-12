
const express = require("express");
const router = express.Router();

const { getMentorPayouts } = require("../controllers/payoutController");
const { createRefundRequest } = require("../controllers/refundController");
const { getMentorEarnings } = require("../controllers/earningController");
const { createPaymentOrder } = require("../controllers/paymentController");
const { getPaymentStatus } = require("../controllers/paymentStatusController");
const { markPaymentFailed } = require("../controllers/paymentFailureController");
const { updateEligibleEarnings } = require("../controllers/earningEligibilityController");
const { authMiddleware, authorizeRoles } = require("../middleware/authMiddleware");
const { verifyPayment } = require("../controllers/verifyPaymentController");

router.get("/test", (req, res) => {
  res.json({
    success: true,
    message: "THRONE8 payment routes working",
  });
});

// Create payment order
router.post("/orders", authMiddleware, createPaymentOrder);

// Verify payment
router.post("/verify", authMiddleware, verifyPayment);

// Check payment status
router.get("/:id", authMiddleware, getPaymentStatus);

// Request refund
router.post("/refunds", authMiddleware, createRefundRequest);

// Mentor earnings
router.get(
  "/earnings/:mentorId",
  authMiddleware,
  authorizeRoles("mentor"),
  getMentorEarnings
);

// Mentor payouts
router.get(
  "/payouts/:mentorId",
  authMiddleware,
  authorizeRoles("mentor"),
  getMentorPayouts
);

// Admin: update eligible earnings
router.patch(
  "/earnings/update-eligible",
  authMiddleware,
  authorizeRoles("admin"),
  updateEligibleEarnings
);

// Payment failure endpoint (controller currently rejects manual updates)
router.patch("/:paymentId/fail", authMiddleware, markPaymentFailed);

module.exports = router;
