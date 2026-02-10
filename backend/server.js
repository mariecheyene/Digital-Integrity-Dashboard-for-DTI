const express = require("express");
const mongoose = require("mongoose");
const cors = require("cors");
require('dotenv').config();

const app = express();
const PORT = process.env.PORT || 5000;

// Middleware
app.use(express.json());
app.use(cors());

// MongoDB Connection
mongoose.connect(process.env.MONGODB_URI || 'mongodb://127.0.0.1:27017/digital_integrity')
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
    status: 'running',
    version: '1.0',
    features: ['User Management', 'OTP Login', 'Forgot Password']
  });
});

// Start Server
app.listen(PORT, () => {
  console.log(`🚀 Server running on http://localhost:${PORT}`);
  console.log(`👤 User Management: http://localhost:${PORT}/api/users`);
  console.log(`📧 Email configured: ${process.env.EMAIL_USER ? '✅' : '❌'}`);
});