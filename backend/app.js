
const express = require("express");
const cors = require("cors");

const app = express();
const adminRoutes = require("./routes/adminRoutes");
const paymentRoutes = require("./routes/paymentRoutes");
const payoutRoutes = require("./routes/payoutRoutes");
const authRoutes = require("./routes/authRoutes");
const bookingRoutes = require("./routes/bookingRoutes");
const notificationRoutes = require("./routes/notificationRoutes");

const { receiveWebhook } = require("./controllers/webhookController");
app.use(cors());

// Razorpay webhook: raw body parser se pehle hona chahiye.
app.post(
  "/api/v1/payments/webhook",
  express.raw({ type: "application/json" }),
  receiveWebhook
);

// Normal API requests ke liye JSON parser.
app.use(express.json());

app.get("/", (req, res) => {
  res.json({ message: "THRONE8 API is running" });
});

app.use("/api/v1/payments", paymentRoutes);
app.use("/api/v1/payouts", payoutRoutes);
app.use("/api/v1/auth", authRoutes);
app.use("/api/v1/bookings", bookingRoutes);
app.use("/api/v1/admin", adminRoutes);
app.use("/api/v1/notifications", notificationRoutes);
app.use("/api/earnings", require("./routes/earnings"));
module.exports = app;
