
const mongoose = require("mongoose");
const dns = require("dns");
const bcrypt = require("bcryptjs");
require("dotenv").config();

dns.setServers(["8.8.8.8", "1.1.1.1"]);

const User = require("./models/User");

async function setAdminPassword() {
  try {
    await mongoose.connect(process.env.MONGO_URL);

    const user = await User.findOne({
      email: "student1@example.com",
      role: "admin",
    });

    if (!user) {
      console.log("Admin user not found!");
      return;
    }

    user.password = await bcrypt.hash("AdminPass123!", 10);
    await user.save();

    console.log("Admin password updated successfully!");
    console.log("Email: student1@example.com");
    console.log("Password: AdminPass123!");
  } catch (error) {
    console.log("Error:", error.message);
  } finally {
    await mongoose.disconnect().catch(() => {});
  }
}

setAdminPassword();
