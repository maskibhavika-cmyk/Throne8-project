
const User = require("../models/User");
const Booking = require("../models/Booking");
const Payment = require("../models/Payment");

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


module.exports = {
  getAdminStats,
  getAllUsers,
  getAllBookings,getAllPayments
};