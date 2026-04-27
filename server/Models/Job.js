const mongoose = require("mongoose");

const JobSchema = new mongoose.Schema(
  {
    userId: {
      type: mongoose.Schema.Types.ObjectId,
      ref: "User",
      required: true,
    },

    company: {
      type: String,
      required: true,
      trim: true,
    },

    role: {
      type: String,
      required: true,
      trim: true,
    },

    status: {
      type: String,
      enum: ["applied", "interview", "rejected", "offer"],
      default: "applied",
    },

    dateApplied: {
      type: Date,
      default: Date.now,
    },
  },
  { timestamps: true }
);

//  performance boost when querying jobs by user
JobSchema.index({ userId: 1 });

module.exports = mongoose.model("Job", JobSchema);