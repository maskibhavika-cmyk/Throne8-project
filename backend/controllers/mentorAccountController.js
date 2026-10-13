const MentorAccount = require("../models/MentorAccount");

const createMentorAccount = async (req, res) => {
  try {
    if (req.user.role !== "mentor") {
      return res.status(403).json({
        success: false,
        message: "Only mentors can create mentor accounts",
      });
    }

    const mentorId = req.user.userId;

    const existingAccount = await MentorAccount.findOne({
      mentor: mentorId,
    });

    if (existingAccount) {
      return res.status(409).json({
        success: false,
        message: "Mentor account already exists",
      });
    }

    const mentorAccount = await MentorAccount.create({
      mentor: mentorId,
      verificationStatus: "PENDING",
      payoutEnabled: false,
    });

    return res.status(201).json({
      success: true,
      message: "Mentor account created and awaiting admin verification",
      mentorAccount,
    });
  } catch (error) {
    console.error("Create mentor account error:", error.message);

    return res.status(500).json({
      success: false,
      message: "Failed to create mentor account",
    });
  }
};

module.exports = { createMentorAccount };