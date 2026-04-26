const router = require("express").Router();
const Job = require("../models/Job");
const auth = require("../middleware/auth");

// Create Job
router.post("/", auth, async (req, res) => {
  const job = await Job.create({ ...req.body, userId: req.user.id });
  res.json(job);
});

// Get Jobs
router.get("/", auth, async (req, res) => {
  const jobs = await Job.find({ userId: req.user.id });
  res.json(jobs);
});

// Update Job
router.put("/:id", auth, async (req, res) => {
  const job = await Job.findByIdAndUpdate(req.params.id, req.body, { new: true });
  res.json(job);
});

// Delete Job
router.delete("/:id", auth, async (req, res) => {
  await Job.findByIdAndDelete(req.params.id);
  res.json("Deleted");
});

module.exports = router;