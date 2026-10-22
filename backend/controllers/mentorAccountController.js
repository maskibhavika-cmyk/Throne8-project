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
const getVerifiedMentors = async (req, res) => {
  try {
    const MentorAccount = require("../models/MentorAccount");
    const User = require("../models/User");

    const accounts = await MentorAccount.find({
      verificationStatus: "VERIFIED",
      isOnHold: false,
    }).populate("mentor", "name email role");

    const mentors = accounts
      .filter((account) => account.mentor && account.mentor.role === "mentor")
      .map((account) => ({
        _id: account.mentor._id,
        name: account.mentor.name,
        email: account.mentor.email,
      }));

    return res.status(200).json({
      success: true,
      mentors,
    });
  } catch (error) {
    console.error("Get verified mentors error:", error.message);
    return res.status(500).json({
      success: false,
      message: "Unable to load verified mentors",
    });
  }
};
module.exports = {
  createMentorAccount,
  getVerifiedMentors,
};