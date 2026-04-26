const mongoose = require("mongoose");

const JobSchema = new mongoose.Schema({
  userId: String,
  company: String,
  role: String,
  status: {
    type: String,
    enum: ["applied", "interview", "rejected", "offer"],
    default: "applied"
  },
  dateApplied: { type: Date, default: Date.now }
});

module.exports = mongoose.model("Job", JobSchema);