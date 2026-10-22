const Earning = require("../models/Earning");
const Refund = require("../models/Refund");

const updateEligibleEarnings = async (req, res) => {
  try {
    const now = new Date();

    const earnings = await Earning.find({
      status: "PENDING",
      eligibleAt: { $ne: null, $lte: now },
    }).populate("booking", "status paymentStatus");

    let updatedCount = 0;

    for (const earning of earnings) {
      const booking = earning.booking;

      if (
        !booking ||
        booking.status !== "COMPLETED" ||
        booking.paymentStatus !== "PAID"
      ) {
        continue;
      }

      const pendingRefund = await Refund.exists({
        booking: booking._id,
        status: { $in: ["PENDING", "PROCESSING"] },
      });

      if (pendingRefund) continue;

      earning.status = "ELIGIBLE";
      await earning.save();
      updatedCount++;
    }

    return res.status(200).json({
      success: true,
      message: "Eligible earnings updated",
      updatedCount,
    });
  } catch (error) {
    console.error("Earning eligibility error:", error.message);

    return res.status(500).json({
      success: false,
      message: "Unable to update eligible earnings",
    });
  }
};
const getEligibleMentors = async (req, res) => {
  try {
    let eligible = await Earning.find({ status: { $in: ["PENDING", "ELIGIBLE"] } })
      .populate("mentor", "name email")
      .populate("booking")
      .sort({ createdAt: -1 });

    if (eligible.length > 0 && !eligible[0].mentor) {
      eligible = await Earning.find({ status: { $in: ["PENDING", "ELIGIBLE"] } })
        .populate("mentorId", "name email")
        .populate("bookingId")
        .sort({ createdAt: -1 });

      const formatted = eligible.map(e => ({
        _id: e._id,
        mentorName: e.mentorId?.name || "Mentor",
        mentorEmail: e.mentorId?.email || "",
        amount: (e.amountPaise || 0) / 100,
        amountPaise: e.amountPaise || 0,
        status: e.status,
        eligibleAt: e.eligibleAt,
        bookingId: e.bookingId?._id || e.booking?._id
      }));
      return res.json({ success: true, mentors: formatted });
    }

    const formatted = eligible.map(e => ({
      _id: e._id,
      mentorName: e.mentor?.name || "Mentor",
      mentorEmail: e.mentor?.email || "",
      amount: (e.amountPaise || 0) / 100,
      amountPaise: e.amountPaise || 0,
      status: e.status,
      eligibleAt: e.eligibleAt,
      bookingId: e.booking?._id
    }));

    res.json({ success: true, mentors: formatted });
  } catch (err) {
    res.status(500).json({ success: false, message: "Failed to load eligible mentors", error: err.message });
  }
};
module.exports = { updateEligibleEarnings, getEligibleMentors };