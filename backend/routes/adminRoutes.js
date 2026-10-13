
const express = require("express");
const router = express.Router();

const {
  getAdminStats,
  getAllUsers,getAllBookings,getAllPayments, verifyMentorAccount
} = require("../controllers/adminController");

const {
  authMiddleware,
  authorizeRoles,
} = require("../middleware/authMiddleware");

router.get(
  "/stats",
  authMiddleware,
  authorizeRoles("admin"),
  getAdminStats
);

router.get(
  "/users",
  authMiddleware,
  authorizeRoles("admin"),
  getAllUsers
);

router.get(
  "/bookings",
  authMiddleware,
  authorizeRoles("admin"),
  getAllBookings
);
router.get(
  "/payments",
  authMiddleware,
  authorizeRoles("admin"),
  getAllPayments
);
router.patch(
  "/mentors/:mentorId/verify",
  authMiddleware,
  authorizeRoles("admin"),
  verifyMentorAccount
);
module.exports = router;
