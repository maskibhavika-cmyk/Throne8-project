
// const mongoose = require('mongoose');

// const dns = require("dns");
// dns.setServers(["8.8.8.8", "1.1.1.1"]); // force reliable DNS resolution for SRV lookup


// async function connectDB() {

//     try{
//         await mongoose.connect(process.env.MONGO_URL)

//         console.log("Database connected successfully");
//     }catch (err) {
//         console.log("Database connection error:",err);
//         }
// }
// module.exports = connectDB


const mongoose = require("mongoose");
const dns = require("dns");

dns.setServers(["8.8.8.8", "1.1.1.1"]);

async function connectDB() {
  try {
    await mongoose.connect(process.env.MONGO_URL, {
      serverSelectionTimeoutMS: 10000,
    });

    console.log("Database connected successfully");
  } catch (err) {
    console.log("Database connection error:", err.message);
  }
}

module.exports = connectDB;
