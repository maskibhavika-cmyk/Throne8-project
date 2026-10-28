
const Notification = require("../models/Notification");

const createNotification = async ({
  recipient,
  type = "GENERAL",
  title,
  message,
  link = "",
}) => {
  try {
    if (!recipient || !title || !message) {
      throw new Error("recipient, title and message are required");
    }

    return await Notification.create({
      recipient,
      type,
      title,
      message,
      link,
    });
  } catch (error) {
    console.error("Create notification error:", error.message);
    throw error;
  }
};

module.exports = createNotification;
