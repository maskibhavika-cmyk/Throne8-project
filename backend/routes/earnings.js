
const express = require("express");
const router = express.Router();

const { getMentorEarnings } = require("../controllers/earningController");
const {
  authMiddleware,
  authorizeRoles,
} = require("../middleware/authMiddleware");

router.get(
  "/mentor/:mentorId",
  authMiddleware,
  authorizeRoles("mentor", "admin"),
  getMentorEarnings
);

module.exports = router;
