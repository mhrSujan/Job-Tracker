const router = require("express").Router();
const Listing = require("../Models/Listing");

// GET /api/listings  — public, supports ?q=search&type=full-time
router.get("/", async (req, res) => {
  try {
    const filter = { isOpen: true };

    if (req.query.type) {
      filter.type = req.query.type;
    }

    if (req.query.q) {
      const regex = new RegExp(req.query.q, "i");
      filter.$or = [
        { title: regex },
        { description: regex },
        { skills: regex },
        { companyName: regex },
        { location: regex },
      ];
    }

    const listings = await Listing.find(filter).sort({ createdAt: -1 });
    res.json(listings);
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});

// GET /api/listings/:id  — public
router.get("/:id", async (req, res) => {
  try {
    const listing = await Listing.findById(req.params.id);
    if (!listing) return res.status(404).json({ error: "Listing not found" });
    res.json(listing);
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});

module.exports = router;