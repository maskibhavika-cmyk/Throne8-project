
const User = require("../models/User");
const Booking = require("../models/Booking");
const Payment = require("../models/Payment");
const MentorAccount = require("../models/MentorAccount");

// Admin Dashboard Statistics
const getAdminStats = async (req, res) => {
  try {
    const [totalUsers, totalBookings, totalPayments, paidPayments] =
      await Promise.all([
        User.countDocuments({ role: { $ne: "admin" } }),
        Booking.countDocuments(),
        Payment.countDocuments(),
        Payment.find({ status: "PAID" }).select("amountPaise"),
      ]);

    const totalRevenuePaise = paidPayments.reduce(
      (total, payment) => total + payment.amountPaise,
      0
    );

    res.json({
      success: true,
      stats: {
        totalUsers,
        totalBookings,
        totalPayments,
        successfulPayments: paidPayments.length,
        totalRevenue: totalRevenuePaise / 100,
      },
    });
  } catch (error) {
    console.error("Admin stats error:", error.message);
    res.status(500).json({
      success: false,
      message: "Failed to fetch admin statistics",
    });
  }
};

// Get All Users
const getAllUsers = async (req, res) => {
  try {
    const users = await User.find()
      .select("-password")
      .sort({ createdAt: -1 });

    res.json({
      success: true,
      users,
    });
  } catch (error) {
    console.error("Get users error:", error.message);
    res.status(500).json({
      success: false,
      message: "Failed to fetch users",
    });
  }
};

// Get All Bookings
const getAllBookings = async (req, res) => {
  try {
    const bookings = await Booking.find()
      .populate("student", "name email")
      .populate("mentor", "name email")
      .sort({ createdAt: -1 });

    res.json({
      success: true,
      bookings,
    });
  } catch (error) {
    console.error("Get bookings error:", error.message);
    res.status(500).json({
      success: false,
      message: "Failed to fetch bookings",
    });
  }
};

// Get All Payments
const getAllPayments = async (req, res) => {
  try {
    const payments = await Payment.find()
      .populate("student", "name email")
      .populate("booking")
      .sort({ createdAt: -1 });

    res.json({
      success: true,
      payments,
    });
  } catch (error) {
    console.error("Get payments error:", error.message);
    res.status(500).json({
      success: false,
      message: "Failed to fetch payments",
    });
  }
};
// Verify Mentor Account
const verifyMentorAccount = async (req, res) => {
  try {
    const { mentorId } = req.params;

    const mentorAccount = await MentorAccount.findOneAndUpdate(
      { mentor: mentorId },
      { verificationStatus: "VERIFIED" },
      { new: true, runValidators: true }
    );

    if (!mentorAccount) {
      return res.status(404).json({
        success: false,
        message: "Mentor account not found",
      });
    }

    res.json({
      success: true,
      message: "Mentor account verified successfully",
      mentorAccount,
    });
  } catch (error) {
    res.status(500).json({
      success: false,
      message: "Failed to verify mentor account",
    });
  }
};


module.exports = {
  getAdminStats,
  getAllUsers,
  getAllBookings,getAllPayments,verifyMentorAccount
};