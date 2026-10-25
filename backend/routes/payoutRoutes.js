const express = require("express");
const router = express.Router();
const Earning = require("../models/Earning");
const Payout = require("../models/Payout");

// GET /api/payouts/summary?mentorId=xxx
router.get("/summary", async (req, res) => {
  const mentorId = req.user?.id || req.query.mentorId;

  const earnings = await Earning.find({ mentor: mentorId });
  const allPayouts = await Payout.find({ mentor: mentorId });

  const totalEarned = earnings.reduce((s, e) => s + (e.amountPaise || 0), 0);
  const totalPaidOut = allPayouts
    .filter(p => p.status === "PAID")
    .reduce((s, p) => s + p.amountPaise, 0);

  const pendingPayouts = allPayouts.filter(p =>
    ["PENDING", "APPROVED", "PROCESSING", "ON_HOLD"].includes(p.status)
  );
  const pendingAmount = pendingPayouts.reduce((s, p) => s + p.amountPaise, 0);

  const available = totalEarned - totalPaidOut - pendingAmount;

  res.json({
    availableBalance: available / 100,
    totalPaidOut: totalPaidOut / 100,
    pendingCount: pendingPayouts.length,
    pendingAmount: pendingAmount / 100
  });
});

// GET /api/payouts?mentorId=xxx
router.get("/", async (req, res) => {
  const mentorId = req.user?.id || req.query.mentorId;
  const payouts = await Payout.find({ mentor: mentorId }).sort({ createdAt: -1 });
  res.json(payouts);
});

// POST /api/payouts/request
router.post("/request", async (req, res) => {
  const mentorId = req.user?.id || req.body.mentorId;

  const eligibleEarnings = await Earning.find({ mentor: mentorId, status: "ELIGIBLE" });
  const totalEligible = eligibleEarnings.reduce((s, e) => s + (e.amountPaise || 0), 0);

  if (totalEligible < 1) {
    return res.status(400).json({ message: "Koi eligible balance nahi hai" });
  }

  const payout = await Payout.create({
    mentor: mentorId,
    amountPaise: totalEligible,
    status: "PENDING"
  });

  await Earning.updateMany(
    { mentor: mentorId, status: "ELIGIBLE" },
    { $set: { status: "PAID" } }
  );

  res.json(payout);
});

module.exports = router;