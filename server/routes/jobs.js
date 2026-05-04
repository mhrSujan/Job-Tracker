const router = require("express").Router();
const Job = require("../Models/Job");
const auth = require("../middleware/auth");

// CREATE JOB
router.post("/", auth, async (req, res) => {
  try {
    const job = await Job.create({
      ...req.body,
      userId: req.user.id,
    });
    res.json(job);
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});

// GET USER JOBS
router.get("/", auth, async (req, res) => {
  try {
    const jobs = await Job.find({ userId: req.user.id }).sort({ createdAt: -1 });
    res.json(jobs);
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});

// UPDATE JOB
router.put("/:id", auth, async (req, res) => {
  try {
    const job = await Job.findOneAndUpdate(
      { _id: req.params.id, userId: req.user.id },
      req.body,
      { new: true }
    );
    if (!job) return res.status(404).json({ error: "Job not found" });
    res.json(job);
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});

// DELETE JOB
router.delete("/:id", auth, async (req, res) => {
  try {
    const job = await Job.findOneAndDelete({
      _id: req.params.id,
      userId: req.user.id,
    });
    if (!job) return res.status(404).json({ error: "Job not found" });
    res.json({ message: "Deleted successfully" });
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});

module.exports = router;