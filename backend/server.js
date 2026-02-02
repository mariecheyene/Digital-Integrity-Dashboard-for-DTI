const express = require("express");
const mongoose = require("mongoose");
const cors = require("cors");
require("dotenv").config();

const app = express();
app.use(cors());
app.use(express.json());

// Connect to MongoDB Compass
mongoose.connect(process.env.MONGO_URI)
  .then(() => console.log("MongoDB connected via Compass"))
  .catch(err => console.log(err));

// Test route
app.get("/", (req, res) => {
  res.send("Digital Integrity Dashboard API running");
});

// Use user routes
app.use("/api/users", require("./routes/userRoutes"));

const PORT = process.env.PORT || 5000;
app.listen(PORT, () => console.log(`Server running on port ${PORT}`));
