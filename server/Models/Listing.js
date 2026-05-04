const mongoose = require("mongoose");

const ListingSchema = new mongoose.Schema(
  {
    companyId: {
      type: mongoose.Schema.Types.ObjectId,
      ref: "User",
      required: true,
    },

    companyName: {
      type: String,
      required: true,
      trim: true,
    },

    title: {
      type: String,
      required: true,
      trim: true,
    },

    description: {
      type: String,
      required: true,
    },

    location: {
      type: String,
      default: "Remote",
      trim: true,
    },

    type: {
      type: String,
      enum: ["full-time", "part-time", "contract", "internship"],
      default: "full-time",
    },

    salary: {
      type: String,
      default: "",
    },

    skills: {
      type: [String],
      default: [],
    },

    deadline: {
      type: Date,
      default: null,
    },

    isOpen: {
      type: Boolean,
      default: true,
    },

    applicationCount: {
      type: Number,
      default: 0,
    },
  },
  { timestamps: true }
);

// Text search index for job board search
ListingSchema.index({ title: "text", description: "text", skills: "text" });
ListingSchema.index({ companyId: 1 });
ListingSchema.index({ isOpen: 1 });

module.exports = mongoose.model("Listing", ListingSchema);