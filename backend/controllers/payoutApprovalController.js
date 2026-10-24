
const mongoose = require("mongoose");
const Payout = require("../models/Payout");
const Earning = require("../models/Earning");

const approvePayout = async (req, res) => {
  const session = await mongoose.startSession();

  try {
    const { id } = req.params;

    if (!mongoose.Types.ObjectId.isValid(id)) {
      return res.status(400).json({
        success: false,
        message: "Invalid payout ID",
      });
    }

    let approvedPayout = null;
    let availablePaise = 0;

    await session.withTransaction(async () => {
      const payout = await Payout.findOne({
        _id: id,
        status: "PENDING",
      }).session(session);

      if (!payout) {
        const existing = await Payout.findById(id).session(session);

        throw new Error(
          existing
            ? `Payout cannot be approved with status ${existing.status}`
            : "Payout not found"
        );
      }

      const eligibleEarnings = await Earning.find({
        mentor: payout.mentor,
        status: "ELIGIBLE",
      }).session(session);

      availablePaise = eligibleEarnings.reduce(
        (total, earning) => total + earning.amountPaise,
        0
      );

      if (availablePaise < payout.amountPaise) {
        throw new Error("Insufficient eligible earnings");
      }

      // Conditional update prevents approving the same pending
      // payout twice. This does not reserve or transfer funds.
      const updated = await Payout.findOneAndUpdate(
        { _id: id, status: "PENDING" },
        {
          $set: {
            status: "APPROVED",
            approvedAt: new Date(),
          },
        },
        { new: true, session, runValidators: true }
      );

      if (!updated) {
        throw new Error("Payout status changed; refresh and retry");
      }

      approvedPayout = updated;
    });

    return res.status(200).json({
      success: true,
      message: "Payout approved. No bank transfer was initiated.",
      payout: approvedPayout,
      availablePaise,
    });
  } catch (error) {
    console.error("Payout approval error:", error.message);

    const status = error.message === "Payout not found"
      ? 404
      : error.message.startsWith("Payout cannot be approved") ||
        error.message === "Insufficient eligible earnings" ||
        error.message.startsWith("Payout status changed")
      ? 409
      : 500;

    return res.status(status).json({
      success: false,
      message: error.message || "Unable to approve payout",
    });
  } finally {
    await session.endSession();
  }
};

module.exports = { approvePayout };
