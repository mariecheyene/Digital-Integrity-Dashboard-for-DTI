// routes/userRoutes.js
const express = require('express');
const router = express.Router();
const User = require('../models/User');

// 1. GET /api/users - Get all users
router.get('/', async (req, res) => {
  try {
    const users = await User.find().select('-password');
    res.json({ success: true, data: users });
  } catch (error) {
    res.status(500).json({ success: false, message: error.message });
  }
});

// 2. POST /api/users/register - Create new user
router.post('/register', async (req, res) => {
  try {
    const { name, email, password, role } = req.body;
    
    // Check if user exists
    const existingUser = await User.findOne({ email: email.toLowerCase() });
    if (existingUser) {
      return res.status(400).json({ 
        success: false, 
        message: 'Email already exists' 
      });
    }
    
    const newUser = new User({
      name,
      email: email.toLowerCase(),
      password,
      role: role || 'staff',
      isActive: true
    });
    
    await newUser.save();
    
    // Remove password from response
    const userResponse = newUser.toObject();
    delete userResponse.password;
    
    res.status(201).json({ success: true, user: userResponse });
  } catch (error) {
    res.status(500).json({ success: false, message: error.message });
  }
});

// 3. PUT /api/users/:id - Update user
router.put('/:id', async (req, res) => {
  try {
    const { name, email, role, isActive } = req.body;
    
    const updatedUser = await User.findByIdAndUpdate(
      req.params.id,
      { name, email, role, isActive },
      { new: true }
    ).select('-password');
    
    res.json({ success: true, user: updatedUser });
  } catch (error) {
    res.status(500).json({ success: false, message: error.message });
  }
});

// 4. DELETE /api/users/:id - Delete user
router.delete('/:id', async (req, res) => {
  try {
    await User.findByIdAndDelete(req.params.id);
    res.json({ success: true, message: 'User deleted successfully' });
  } catch (error) {
    res.status(500).json({ success: false, message: error.message });
  }
});

// 5. PATCH /api/users/:id/status - Toggle user status
router.patch('/:id/status', async (req, res) => {
  try {
    const { isActive } = req.body;
    
    const updatedUser = await User.findByIdAndUpdate(
      req.params.id,
      { isActive },
      { new: true }
    ).select('-password');
    
    res.json({ success: true, user: updatedUser });
  } catch (error) {
    res.status(500).json({ success: false, message: error.message });
  }
});

module.exports = router;