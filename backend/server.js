const express = require("express");
const mongoose = require("mongoose");
const cors = require("cors");

const app = express();
const PORT = 5000;

// Middleware
app.use(express.json());
app.use(cors());

// MongoDB Connection
mongoose.connect('mongodb://127.0.0.1:27017/digital_integrity')
  .then(() => console.log('✅ Connected to MongoDB'))
  .catch(err => console.error('❌ MongoDB connection error:', err));

// Import Routes
const userRoutes = require('./routes/userRoutes');

// Routes
app.use('/api/users', userRoutes);

// Test route
app.get('/', (req, res) => {
  res.json({ 
    message: 'Digital Integrity Dashboard API',
    status: 'running'
  });
});

// Start Server
app.listen(PORT, () => {
  console.log(`🚀 Server running on http://localhost:${PORT}`);
  console.log(`👤 User API: http://localhost:${PORT}/api/users`);
});