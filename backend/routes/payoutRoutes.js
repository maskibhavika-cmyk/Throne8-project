
const express = require("express");
const router = express.Router();

const {
  getMentorPayouts,
  createPayoutRequest,
} = require("../controllers/payoutController");

const {
  approvePayout,
} = require("../controllers/payoutApprovalController");

const {
  authMiddleware,
  authorizeRoles,
} = require("../middleware/authMiddleware");

router.post(
  "/request",
  authMiddleware,
  authorizeRoles("mentor"),
  createPayoutRequest
);

router.get(
  "/:mentorId",
  authMiddleware,
  authorizeRoles("mentor", "admin"),
  getMentorPayouts
);

// Admin: approve a payout request
router.patch(
  "/admin/:id/approve",
  authMiddleware,
  authorizeRoles("admin"),
  approvePayout
);

module.exports = router;
