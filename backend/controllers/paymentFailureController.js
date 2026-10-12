
const Payment = require("../models/Payment");

const markPaymentFailed = async (req, res) => {
  try {
    return res.status(403).json({
      success: false,
      message:
        "Payment status can only be updated by a verified payment provider event",
    });
  } catch (error) {
    return res.status(500).json({
      success: false,
      message: error.message,
    });
  }
};

module.exports = { markPaymentFailed };
