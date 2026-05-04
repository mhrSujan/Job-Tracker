require("dotenv").config();
const express  = require("express");
const mongoose = require("mongoose");
const cors     = require("cors");

const app = express();
app.use(cors());
app.use(express.json());

mongoose
  .connect(process.env.MONGO_URI)
  .then(() => console.log("MongoDB Connected"))
  .catch((err) => console.log("MongoDB error:", err));

app.get("/", (req, res) => res.send("API Running"));

// ── Routes ────────────────────────────────────────────────────
app.use("/api/auth",     require("./routes/auth"));
app.use("/api/jobs",     require("./routes/jobs"));
app.use("/api/listings", require("./routes/listings"));
app.use("/api/apply",    require("./routes/apply"));
app.use("/api/company",  require("./routes/company"));

const PORT = process.env.PORT || 5000;
app.listen(PORT, () => console.log(`Server running on port ${PORT}`));