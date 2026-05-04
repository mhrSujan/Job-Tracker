const mongoose = require("mongoose");

const UserSchema = new mongoose.Schema(
  {
    email:       { type: String, required: true, unique: true, trim: true },
    password:    { type: String, required: true },
    role:        { type: String, enum: ["applicant", "admin"], default: "applicant" },
    name:        { type: String, default: "" },
    companyName: { type: String, default: "" },
    // applicant profile extras (used in admin view)
    title:       { type: String, default: "" },
    skills:      { type: [String], default: [] },
    resumeUrl:   { type: String, default: "" },
  },
  { timestamps: true }
);

module.exports = mongoose.model("User", UserSchema);