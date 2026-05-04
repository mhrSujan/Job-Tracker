const mongoose = require("mongoose");

const ApplicationSchema = new mongoose.Schema(
  {
    listingId: {
      type: mongoose.Schema.Types.ObjectId,
      ref: "Listing",
      required: true,
    },

    applicantId: {
      type: mongoose.Schema.Types.ObjectId,
      ref: "User",
      required: true,
    },

    companyId: {
      type: mongoose.Schema.Types.ObjectId,
      ref: "User",
      required: true,
    },

    coverLetter: {
      type: String,
      default: "",
    },

    status: {
      type: String,
      enum: ["submitted", "reviewing", "interview", "offer", "rejected"],
      default: "submitted",
    },

    adminNotes: {
      type: String,
      default: "",
    },

    reviewedAt: {
      type: Date,
      default: null,
    },

    interviewAt: {
      type: Date,
      default: null,
    },
  },
  { timestamps: true }
);

// One application per applicant per listing
ApplicationSchema.index({ listingId: 1, applicantId: 1 }, { unique: true });
ApplicationSchema.index({ applicantId: 1 });
ApplicationSchema.index({ companyId: 1 });

module.exports = mongoose.model("Application", ApplicationSchema);