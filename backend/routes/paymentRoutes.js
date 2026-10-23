const express = require("express");
const router = express.Router();

const { approvePayout } = require("../controllers/payoutApprovalController");

const { getMentorPayouts } = require("../controllers/payoutController");
const { createRefundRequest, getAllRefunds, approveRefund, rejectRefund } = require("../controllers/refundController");
const { getMentorEarnings } = require("../controllers/earningController");
const { createPaymentOrder } = require("../controllers/paymentController");
const { getPaymentStatus } = require("../controllers/paymentStatusController");
const { markPaymentFailed } = require("../controllers/paymentFailureController");
const { updateEligibleEarnings, getEligibleMentors } = require("../controllers/earningEligibilityController");
const { authMiddleware, authorizeRoles } = require("../middleware/authMiddleware");
const { verifyPayment } = require("../controllers/verifyPaymentController");
const { recoverEarnings } = require("../controllers/recoverEarningsController");

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

// Request refund
router.post("/refunds", authMiddleware, createRefundRequest);

// Admin: Saare refunds dekhe
router.get(
  "/refunds",
  authMiddleware,
  authorizeRoles("admin"),
  getAllRefunds
);

// Admin: Approve / Reject refund - YE refund wale routes :id se UPAR hone chahiye
router.post(
  "/refunds/:id/approve",
  authMiddleware,
  authorizeRoles("admin"),
  approveRefund
);

router.post(
  "/refunds/:id/reject",
  authMiddleware,
  authorizeRoles("admin"),
  rejectRefund
);

// Admin: Eligible mentors dekhe - YE HAMESHA :mentorId SE UPAR RAHEGA
router.get(
  "/earnings/eligible-mentors",
  authMiddleware,
  authorizeRoles("admin"),
  getEligibleMentors
);

// Admin: update eligible earnings
router.patch(
  "/earnings/update-eligible",
  authMiddleware,
  authorizeRoles("admin"),
  updateEligibleEarnings
);
router.post(
  "/earnings/recover",
  authMiddleware,
  authorizeRoles("admin"),
  recoverEarnings
);

// Mentor earnings - YE SABSE NEECHE
router.get(
  "/earnings/:mentorId",
  authMiddleware,
  authorizeRoles("mentor"),
  getMentorEarnings
);

router.post(
  "/payouts/:id/approve",
  authMiddleware,
  authorizeRoles("admin"),
  approvePayout
);

// Mentor payouts
router.get(
  "/payouts/:mentorId",
  authMiddleware,
  authorizeRoles("mentor"),
  getMentorPayouts
);

// Payment failure endpoint
router.patch("/:paymentId/fail", authMiddleware, markPaymentFailed);

// Check payment status - YE HAMESHA SABSE NEECHE RAHEGA
router.get("/:id", authMiddleware, getPaymentStatus);

module.exports = router;