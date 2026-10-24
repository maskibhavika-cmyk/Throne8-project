
const mongoose = require("mongoose");
const Notification = require("../models/Notification");

const getMyNotifications = async (req, res) => {
  try {
    const userId = req.user?._id || req.user?.id || req.user?.userId;

    if (!mongoose.Types.ObjectId.isValid(String(userId || ""))) {
      return res.status(401).json({
        success: false,
        message: "Invalid authenticated user",
      });
    }

    const notifications = await Notification.find({
      recipient: userId,
    })
      .sort({ createdAt: -1 })
      .limit(100)
      .lean();

    const unreadCount = await Notification.countDocuments({
      recipient: userId,
      isRead: false,
    });

    return res.status(200).json({
      success: true,
      unreadCount,
      notifications,
    });
  } catch (error) {
    console.error("Get notifications error:", error.message);
    return res.status(500).json({
      success: false,
      message: "Unable to fetch notifications",
    });
  }
};

const markNotificationRead = async (req, res) => {
  try {
    const userId = req.user?._id || req.user?.id || req.user?.userId;
    const { id } = req.params;

    if (!mongoose.Types.ObjectId.isValid(String(userId || ""))) {
      return res.status(401).json({
        success: false,
        message: "Invalid authenticated user",
      });
    }

    if (!mongoose.Types.ObjectId.isValid(id)) {
      return res.status(400).json({
        success: false,
        message: "Invalid notification ID",
      });
    }

    const notification = await Notification.findOneAndUpdate(
      { _id: id, recipient: userId },
      { $set: { isRead: true } },
      { new: true }
    );

    if (!notification) {
      return res.status(404).json({
        success: false,
        message: "Notification not found",
      });
    }

    return res.status(200).json({
      success: true,
      message: "Notification marked as read",
      notification,
    });
  } catch (error) {
    console.error("Mark notification read error:", error.message);
    return res.status(500).json({
      success: false,
      message: "Unable to update notification",
    });
  }
};

module.exports = {
  getMyNotifications,
  markNotificationRead,
};
