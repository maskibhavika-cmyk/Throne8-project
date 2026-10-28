
const express = require("express");
const router = express.Router();

const {
  getMyNotifications,
  markNotificationRead,createNotification
} = require("../controllers/notificationController");

const { authMiddleware } = require("../middleware/authMiddleware");

router.get("/", authMiddleware, getMyNotifications);

router.patch("/:id/read", authMiddleware, markNotificationRead);

router.post("/test", authMiddleware, createNotification);

module.exports = router;
