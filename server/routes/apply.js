const router      = require("express").Router();
const Application = require("../Models/Application");
const Listing     = require("../Models/Listing");
const auth        = require("../middleware/auth");

// ⚠️  IMPORTANT: GET /mine must be declared BEFORE DELETE /:appId
//     otherwise Express treats "mine" as an appId param.

// GET /api/apply/mine  — applicant sees their own applications
router.get("/mine", auth, async (req, res) => {
  try {
    if (req.user.role !== "applicant") {
      return res.status(403).json({ error: "Forbidden" });
    }

    const apps = await Application.find({ applicantId: req.user.id })
      .populate("listingId", "title location type salary companyName")
      .populate("companyId", "companyName")
      .sort({ createdAt: -1 });

    res.json(apps);
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});

// POST /api/apply/:listingId  — applicant submits application
router.post("/:listingId", auth, async (req, res) => {
  try {
    if (req.user.role !== "applicant") {
      return res.status(403).json({ error: "Only applicants can apply" });
    }

    const listing = await Listing.findById(req.params.listingId);
    if (!listing)       return res.status(404).json({ error: "Listing not found" });
    if (!listing.isOpen) return res.status(400).json({ error: "This listing is closed" });

    // Prevent duplicate application
    const existing = await Application.findOne({
      listingId:   req.params.listingId,
      applicantId: req.user.id,
    });
    if (existing) return res.status(400).json({ error: "You already applied to this listing" });

    const application = await Application.create({
      listingId:   req.params.listingId,
      applicantId: req.user.id,
      companyId:   listing.companyId,
      coverLetter: req.body.coverLetter || "",
    });

    await Listing.findByIdAndUpdate(req.params.listingId, {
      $inc: { applicationCount: 1 },
    });

    res.json(application);
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});

// DELETE /api/apply/:appId  — applicant withdraws (submitted only)
router.delete("/:appId", auth, async (req, res) => {
  try {
    const app = await Application.findOne({
      _id:         req.params.appId,
      applicantId: req.user.id,
    });

    if (!app) return res.status(404).json({ error: "Application not found" });
    if (app.status !== "submitted") {
      return res.status(400).json({ error: "Can only withdraw submitted applications" });
    }

    await Application.findByIdAndDelete(req.params.appId);

    await Listing.findByIdAndUpdate(app.listingId, {
      $inc: { applicationCount: -1 },
    });

    res.json({ message: "Application withdrawn" });
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});

module.exports = router;