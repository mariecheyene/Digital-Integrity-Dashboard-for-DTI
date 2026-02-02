const express = require("express");
const router = express.Router();
const User = require("../models/user");

// Register user
router.post("/register", async (req, res) => {
  try {
    const user = await User.create(req.body);
    res.json(user);
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
});

module.exports = router;
