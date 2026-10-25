const express = require("express");
const router = express.Router();
const Earning = require("../models/Earning");

router.get("/mentor/:mentorId", async (req, res) => {
  try {
    const earnings = await Earning.find({ mentor: req.params.mentorId })
      .populate({ path: "booking", populate: { path: "student", select: "name" } })
      .sort({ createdAt: -1 });

    let total = 0, paid = 0, pending = 0, hold = 0, eligible = 0, reversed = 0, processing = 0;
    let ledger = [];

    for (const e of earnings) {
      const sessionFee = Math.round((e.sessionFeePaise || 0) / 100) || Math.round(((e.amountPaise || 0) / 100) * 1.25);
      const commission = Math.round((e.commissionPaise || 0) / 100) || Math.round(sessionFee * 0.2);
      const yourEarning = Math.round((e.amountPaise || 0) / 100);

      let status = "Awaiting session";
      let payoutDate = "After session + 15 days";

      if (e.status === "PAID") { status = "Paid to bank"; paid += yourEarning; payoutDate = e.paidAt ? new Date(e.paidAt).toLocaleDateString("en-IN") : "Paid"; }
      else if (e.status === "ELIGIBLE") { status = "Eligible"; eligible += yourEarning; payoutDate = e.eligibleAt ? new Date(e.eligibleAt).toLocaleDateString("en-IN") : "-"; }
      else if (e.status === "ON_HOLD") { status = "In 15-day hold"; hold += yourEarning; payoutDate = e.eligibleAt ? new Date(e.eligibleAt).toLocaleDateString("en-IN") : "After session + 15 days"; }
      else if (e.status === "PENDING" || !e.status) { status = "Awaiting session"; pending += yourEarning; }
      else if (e.status === "REVERSED") { status = "On hold"; reversed += yourEarning; }
      else if (e.status === "PROCESSING") { status = "Processing"; processing += yourEarning; }

      if (status !== "On hold") total += yourEarning;

      ledger.push({
        bookingId: e.booking?._id ? String(e.booking._id).slice(-6).toUpperCase() : "TEST" + Math.floor(Math.random()*900+100),
        student: e.booking?.student?.name || "Test Student",
        sessionFee,
        commission,
        yourEarning,
        status,
        payoutDate
      });
    }

    res.json({ success: true, summary: { total, paid, pending, hold, eligible, reversed, processing }, ledger, payouts: [] });
  } catch (err) {
    res.status(500).json({ success: false, message: "Earnings failed" });
  }
});

module.exports = router;