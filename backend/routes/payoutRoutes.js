
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

module.exports = router;
