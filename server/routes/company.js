const router = require("express").Router();
const Listing = require("../Models/Listing");
const Application = require("../Models/Application");
const auth = require("../middleware/auth");

// Middleware — admin only
const adminOnly = (req, res, next) => {
  if (req.user.role !== "admin") {
    return res.status(403).json({ error: "Admin access required" });
  }
  next();
};

// ── Listings ──────────────────────────────────────────────────

// GET /api/company/listings
router.get("/listings", auth, adminOnly, async (req, res) => {
  try {
    const listings = await Listing.find({ companyId: req.user.id }).sort({ createdAt: -1 });
    res.json(listings);
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});

// POST /api/company/listings
router.post("/listings", auth, adminOnly, async (req, res) => {
  try {
    const { title, description, location, type, salary, skills, deadline } = req.body;

    if (!title || !description) {
      return res.status(400).json({ error: "Title and description are required" });
    }

    // Get the company name from the User model
    const User = require("../Models/User");
    const admin = await User.findById(req.user.id);

    const listing = await Listing.create({
      companyId: req.user.id,
      companyName: admin.companyName || admin.email,
      title,
      description,
      location: location || "Remote",
      type: type || "full-time",
      salary: salary || "",
      skills: skills || [],
      deadline: deadline || null,
    });

    res.json(listing);
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});

// PUT /api/company/listings/:id
router.put("/listings/:id", auth, adminOnly, async (req, res) => {
  try {
    const listing = await Listing.findOneAndUpdate(
      { _id: req.params.id, companyId: req.user.id },
      req.body,
      { new: true }
    );
    if (!listing) return res.status(404).json({ error: "Listing not found" });
    res.json(listing);
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});

// DELETE /api/company/listings/:id
router.delete("/listings/:id", auth, adminOnly, async (req, res) => {
  try {
    const listing = await Listing.findOneAndDelete({
      _id: req.params.id,
      companyId: req.user.id,
    });
    if (!listing) return res.status(404).json({ error: "Listing not found" });

    // Delete all applications for this listing
    await Application.deleteMany({ listingId: req.params.id });

    res.json({ message: "Listing and its applications deleted" });
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});

// PATCH /api/company/listings/:id/toggle  — open/close listing
router.patch("/listings/:id/toggle", auth, adminOnly, async (req, res) => {
  try {
    const listing = await Listing.findOne({ _id: req.params.id, companyId: req.user.id });
    if (!listing) return res.status(404).json({ error: "Listing not found" });

    listing.isOpen = !listing.isOpen;
    await listing.save();

    res.json(listing);
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});

// ── Applications ──────────────────────────────────────────────

// GET /api/company/applications  — all apps across all company listings
router.get("/applications", auth, adminOnly, async (req, res) => {
  try {
    const apps = await Application.find({ companyId: req.user.id })
      .populate("applicantId", "name email title skills resumeUrl")
      .populate("listingId", "title")
      .sort({ createdAt: -1 });

    res.json(apps);
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});

// GET /api/company/applications/:listingId  — apps for a specific listing
router.get("/applications/:listingId", auth, adminOnly, async (req, res) => {
  try {
    const apps = await Application.find({
      listingId: req.params.listingId,
      companyId: req.user.id,
    })
      .populate("applicantId", "name email title skills resumeUrl")
      .populate("listingId", "title")
      .sort({ createdAt: -1 });

    res.json(apps);
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});

// PATCH /api/company/applications/:appId/status
router.patch("/applications/:appId/status", auth, adminOnly, async (req, res) => {
  try {
    const { status } = req.body;
    const validStatuses = ["submitted", "reviewing", "interview", "offer", "rejected"];
    if (!validStatuses.includes(status)) {
      return res.status(400).json({ error: "Invalid status" });
    }

    const updateFields = { status };

    // Automatically set timestamp fields when advancing
    if (status === "reviewing") updateFields.reviewedAt = new Date();
    if (status === "interview") updateFields.interviewAt = new Date();

    const app = await Application.findOneAndUpdate(
      { _id: req.params.appId, companyId: req.user.id },
      updateFields,
      { new: true }
    )
      .populate("applicantId", "name email title skills resumeUrl")
      .populate("listingId", "title");

    if (!app) return res.status(404).json({ error: "Application not found" });
    res.json(app);
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});

// PUT /api/company/applications/:appId/notes
router.put("/applications/:appId/notes", auth, adminOnly, async (req, res) => {
  try {
    const app = await Application.findOneAndUpdate(
      { _id: req.params.appId, companyId: req.user.id },
      { adminNotes: req.body.adminNotes || "" },
      { new: true }
    )
      .populate("applicantId", "name email title skills resumeUrl")
      .populate("listingId", "title");

    if (!app) return res.status(404).json({ error: "Application not found" });
    res.json(app);
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});

// ── Stats ─────────────────────────────────────────────────────

// GET /api/company/stats
router.get("/stats", auth, adminOnly, async (req, res) => {
  try {
    const [listings, apps] = await Promise.all([
      Listing.find({ companyId: req.user.id }),
      Application.find({ companyId: req.user.id }),
    ]);

    const stats = {
      totalListings:  listings.length,
      openListings:   listings.filter(l => l.isOpen).length,
      totalApps:      apps.length,
      reviewing:      apps.filter(a => a.status === "reviewing").length,
      interview:      apps.filter(a => a.status === "interview").length,
      offer:          apps.filter(a => a.status === "offer").length,
      rejected:       apps.filter(a => a.status === "rejected").length,
    };

    res.json(stats);
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});

module.exports = router;