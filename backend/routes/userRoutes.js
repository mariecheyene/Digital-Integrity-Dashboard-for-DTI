const express = require('express');
const router = express.Router();
const User = require('../models/User');
const bcrypt = require('bcrypt');

// Predefined system accounts
const PREDEFINED_ACCOUNTS = ["admin@digitalintegrity.com", "system@digitalintegrity.com"];

// GET all users
router.get('/', async (req, res) => {
  try {
    const users = await User.find().select('-password').sort({ createdAt: -1 });
    res.json(users);
  } catch (error) {
    console.error('Error fetching users:', error);
    res.status(500).json({ message: 'Failed to fetch users' });
  }
});

// CREATE new user
router.post('/', async (req, res) => {
  try {
    const { name, email, password, role } = req.body;
    
    if (!name || !email || !password || !role) {
      return res.status(400).json({ message: 'All fields are required' });
    }
    
    if (!['Admin', 'Staff'].includes(role)) {
      return res.status(400).json({ message: 'Invalid role' });
    }
    
    // Check if user already exists
    const existingUser = await User.findOne({ email: email.toLowerCase() });
    if (existingUser) {
      return res.status(409).json({ message: 'User with this email already exists' });
    }
    
    // Create new user
    const user = new User({
      name: name.trim(),
      email: email.toLowerCase().trim(),
      password: password,
      role: role,
      isActive: true
    });
    
    await user.save();
    
    // Return user without password
    const userResponse = user.toObject();
    delete userResponse.password;
    
    res.status(201).json({ 
      message: 'User created successfully', 
      user: userResponse 
    });
    
  } catch (error) {
    console.error('User creation error:', error);
    
    if (error.name === 'ValidationError') {
      return res.status(400).json({ message: 'Validation error', error: error.message });
    }
    
    if (error.code === 11000) {
      return res.status(409).json({ message: 'Email already exists' });
    }
    
    res.status(500).json({ message: 'Failed to create user' });
  }
});

// GET single user
router.get('/:id', async (req, res) => {
  try {
    const user = await User.findById(req.params.id).select('-password');
    if (!user) {
      return res.status(404).json({ message: 'User not found' });
    }
    res.json(user);
  } catch (error) {
    console.error('Error fetching user:', error);
    res.status(500).json({ message: 'Failed to fetch user' });
  }
});

// UPDATE user
router.put('/:id', async (req, res) => {
  try {
    const { name, role, isActive } = req.body;
    
    const updateData = { name, role, isActive };
    
    if (role && !['Admin', 'Staff'].includes(role)) {
      return res.status(400).json({ message: 'Invalid role' });
    }
    
    const updatedUser = await User.findByIdAndUpdate(
      req.params.id,
      updateData,
      { new: true, runValidators: true }
    ).select('-password');

    if (!updatedUser) {
      return res.status(404).json({ message: 'User not found' });
    }

    res.json({ 
      message: 'User updated successfully', 
      user: updatedUser 
    });
  } catch (error) {
    console.error('Error updating user:', error);
    res.status(500).json({ message: 'Failed to update user' });
  }
});

// DELETE user
router.delete('/:id', async (req, res) => {
  try {
    const user = await User.findById(req.params.id);
    
    if (!user) {
      return res.status(404).json({ message: 'User not found' });
    }
    
    // Check if trying to delete predefined account
    if (PREDEFINED_ACCOUNTS.includes(user.email.toLowerCase())) {
      return res.status(403).json({ message: 'Cannot delete predefined system accounts' });
    }
    
    await User.findByIdAndDelete(req.params.id);
    
    res.json({ 
      message: 'User deleted successfully',
      user: {
        name: user.name,
        email: user.email,
        role: user.role
      }
    });
  } catch (error) {
    console.error('Error deleting user:', error);
    res.status(500).json({ message: 'Failed to delete user' });
  }
});

// LOGIN endpoint
router.post('/login', async (req, res) => {
  try {
    const { email, password } = req.body;
    
    if (!email || !password) {
      return res.status(400).json({ message: 'Email and password are required' });
    }
    
    const user = await User.findOne({ email: email.toLowerCase() });
    
    if (!user) {
      return res.status(401).json({ message: 'Invalid credentials' });
    }
    
    // Check if user is active
    if (!user.isActive) {
      return res.status(401).json({ message: 'Account is deactivated' });
    }
    
    // Verify password
    const isPasswordValid = await bcrypt.compare(password, user.password);
    if (!isPasswordValid) {
      return res.status(401).json({ message: 'Invalid credentials' });
    }
    
    // Return user data (without password)
    const userResponse = user.toObject();
    delete userResponse.password;
    
    res.json({ 
      user: userResponse 
    });
  } catch (error) {
    console.error('Login error:', error);
    res.status(500).json({ message: 'Login failed' });
  }
});

module.exports = router;