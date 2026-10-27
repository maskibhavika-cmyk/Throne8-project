
const express = require("express");
const router = express.Router();

const {
  getMentorPayouts,
  createPayoutRequest,
} = require("../controllers/payoutController");

const {
  authMiddleware,
  authorizeRoles,
} = require("../middleware/authMiddleware");

router.get(
  "/summary",
  authMiddleware,
  authorizeRoles("mentor", "admin"),
  async (req, res) => {
    try {
      const mentorId =
        req.user?.role === "admin"
          ? req.query.mentorId
          : req.user?._id || req.user?.id || req.user?.userId;

      if (!mentorId) {
        return res.status(400).json({
          success: false,
          message: "Mentor ID is required",
        });
      }

      req.params.mentorId = String(mentorId);
      return getMentorPayouts(req, res);
    } catch (error) {
      console.error("Payout summary error:", error.message);
      return res.status(500).json({
        success: false,
        message: "Unable to fetch payout summary",
      });
    }
  }
);

router.get(
  "/:mentorId",
  authMiddleware,
  authorizeRoles("mentor", "admin"),
  getMentorPayouts
);

router.post(
  "/request",
  authMiddleware,
  authorizeRoles("mentor"),
  createPayoutRequest
);

module.exports = router;
