const express = require('express');
const router = express.Router();
const User = require('../models/User');
const bcrypt = require('bcrypt');
const { 
  generateOTP, 
  sendWelcomeOTP, 
  sendPasswordResetOTP,
  sendPasswordResetSuccess 
} = require('../utils/emailService');

// GET all users
router.get('/', async (req, res) => {
  try {
    const users = await User.find().select('-password -otp -resetOtp').sort({ createdAt: -1 });
    res.json(users);
  } catch (error) {
    console.error('Error fetching users:', error);
    res.status(500).json({ message: 'Failed to fetch users' });
  }
});

// CREATE new user with OTP
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
    
    // Generate OTP
    const otp = generateOTP();
    const otpExpiry = new Date(Date.now() + 10 * 60 * 1000); // 10 minutes
    
    // Create new user with OTP
    const user = new User({
      name: name.trim(),
      email: email.toLowerCase().trim(),
      password: password,
      role: role,
      isActive: true,
      otp: otp,
      otpExpiry: otpExpiry,
      isFirstLogin: true
    });
    
    await user.save();
    
    // Send welcome email with OTP
    const emailResult = await sendWelcomeOTP(email, name, otp);
    
    if (!emailResult.success) {
      console.error('Failed to send OTP email:', emailResult.error);
      // Still create user even if email fails
    }
    
    // Return user without sensitive data
    const userResponse = user.toObject();
    delete userResponse.password;
    delete userResponse.otp;
    delete userResponse.resetOtp;
    
    res.status(201).json({ 
      success: true,
      message: emailResult.success ? 
        'User created successfully. OTP sent to email.' : 
        'User created but failed to send OTP email.',
      user: userResponse,
      otpSent: emailResult.success
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

// LOGIN with OTP check
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
    
    if (!user.isActive) {
      return res.status(403).json({ message: 'Account is deactivated. Contact administrator.' });
    }
    
    // Verify password
    const isPasswordValid = await bcrypt.compare(password, user.password);
    if (!isPasswordValid) {
      return res.status(401).json({ message: 'Invalid credentials' });
    }
    
    // Check if first login requires OTP
    if (user.isFirstLogin) {
      return res.json({
        requireOTP: true,
        message: 'OTP verification required for first login',
        userId: user._id,
        email: user.email,
        name: user.name
      });
    }
    
    // Return user data for normal login
    const userResponse = user.toObject();
    delete userResponse.password;
    delete userResponse.otp;
    delete userResponse.resetOtp;
    
    res.json({
      requireOTP: false,
      message: 'Login successful',
      user: userResponse
    });
    
  } catch (error) {
    console.error('Login error:', error);
    res.status(500).json({ message: 'Login failed' });
  }
});

// VERIFY OTP for first-time login
router.post('/verify-otp', async (req, res) => {
  try {
    const { userId, otp } = req.body;
    
    if (!userId || !otp) {
      return res.status(400).json({ message: 'User ID and OTP are required' });
    }
    
    const user = await User.findOne({
      _id: userId,
      otp: otp,
      otpExpiry: { $gt: new Date() }
    });
    
    if (!user) {
      return res.status(400).json({ message: 'Invalid or expired OTP' });
    }
    
    // Clear OTP and mark as verified
    user.otp = null;
    user.otpExpiry = null;
    user.isFirstLogin = false;
    await user.save();
    
    const userResponse = user.toObject();
    delete userResponse.password;
    delete userResponse.otp;
    delete userResponse.resetOtp;
    
    res.json({
      success: true,
      message: 'OTP verified successfully',
      user: userResponse
    });
    
  } catch (error) {
    console.error('OTP verification error:', error);
    res.status(500).json({ message: 'OTP verification failed' });
  }
});

// RESEND OTP for first-time login
router.post('/resend-otp', async (req, res) => {
  try {
    const { userId } = req.body;
    
    if (!userId) {
      return res.status(400).json({ message: 'User ID is required' });
    }
    
    const user = await User.findById(userId);
    
    if (!user) {
      return res.status(404).json({ message: 'User not found' });
    }
    
    if (!user.isFirstLogin) {
      return res.status(400).json({ message: 'User already verified' });
    }
    
    // Generate new OTP
    const otp = generateOTP();
    const otpExpiry = new Date(Date.now() + 10 * 60 * 1000);
    
    user.otp = otp;
    user.otpExpiry = otpExpiry;
    await user.save();
    
    // Send new OTP email
    const emailResult = await sendWelcomeOTP(user.email, user.name, otp);
    
    if (!emailResult.success) {
      return res.status(500).json({ 
        message: 'Failed to resend OTP email',
        error: emailResult.error 
      });
    }
    
    res.json({
      success: true,
      message: 'New OTP sent to your email'
    });
    
  } catch (error) {
    console.error('Resend OTP error:', error);
    res.status(500).json({ message: 'Failed to resend OTP' });
  }
});

// FORGOT PASSWORD - Request OTP
router.post('/forgot-password', async (req, res) => {
  try {
    const { email } = req.body;
    
    if (!email) {
      return res.status(400).json({ message: 'Email is required' });
    }
    
    const user = await User.findOne({ email: email.toLowerCase() });
    
    if (!user) {
      // For security, don't reveal if user exists
      return res.json({ 
        success: true,
        message: 'If an account exists with this email, you will receive an OTP shortly.'
      });
    }
    
    if (!user.isActive) {
      return res.status(403).json({ 
        message: 'Account is deactivated. Contact administrator.' 
      });
    }
    
    // Generate reset OTP
    const otp = generateOTP();
    const otpExpiry = new Date(Date.now() + 10 * 60 * 1000);
    
    user.resetOtp = otp;
    user.resetOtpExpiry = otpExpiry;
    await user.save();
    
    // Send password reset OTP email
    const emailResult = await sendPasswordResetOTP(user.email, user.name, otp);
    
    if (!emailResult.success) {
      return res.status(500).json({ 
        message: 'Failed to send OTP email',
        error: emailResult.error 
      });
    }
    
    res.json({
      success: true,
      message: 'OTP sent to your email',
      userId: user._id,
      email: user.email
    });
    
  } catch (error) {
    console.error('Forgot password error:', error);
    res.status(500).json({ message: 'Failed to process request' });
  }
});

// VERIFY RESET OTP
router.post('/verify-reset-otp', async (req, res) => {
  try {
    const { userId, otp } = req.body;
    
    if (!userId || !otp) {
      return res.status(400).json({ message: 'User ID and OTP are required' });
    }
    
    const user = await User.findOne({
      _id: userId,
      resetOtp: otp,
      resetOtpExpiry: { $gt: new Date() }
    });
    
    if (!user) {
      return res.status(400).json({ message: 'Invalid or expired OTP' });
    }
    
    res.json({
      success: true,
      message: 'OTP verified successfully'
    });
    
  } catch (error) {
    console.error('Verify reset OTP error:', error);
    res.status(500).json({ message: 'OTP verification failed' });
  }
});

// RESET PASSWORD with OTP
router.post('/reset-password', async (req, res) => {
  try {
    const { userId, otp, newPassword } = req.body;
    
    if (!userId || !otp || !newPassword) {
      return res.status(400).json({ message: 'All fields are required' });
    }
    
    // Validate password strength
    const passwordRegex = /^(?=.*[a-z])(?=.*[A-Z])(?=.*\d)(?=.*[@$!%*?&])[A-Za-z\d@$!%*?&]{8,}$/;
    if (!passwordRegex.test(newPassword)) {
      return res.status(400).json({ 
        message: 'Password must be at least 8 characters with uppercase, lowercase, number and special character' 
      });
    }
    
    const user = await User.findOne({
      _id: userId,
      resetOtp: otp,
      resetOtpExpiry: { $gt: new Date() }
    });
    
    if (!user) {
      return res.status(400).json({ message: 'Invalid or expired OTP' });
    }
    
    // Update password
    user.password = newPassword;
    user.resetOtp = null;
    user.resetOtpExpiry = null;
    user.isFirstLogin = false; // Mark as verified since they reset password
    await user.save();
    
    // Send success email
    await sendPasswordResetSuccess(user.email, user.name);
    
    res.json({
      success: true,
      message: 'Password reset successfully. You can now login.'
    });
    
  } catch (error) {
    console.error('Reset password error:', error);
    res.status(500).json({ message: 'Failed to reset password' });
  }
});

// RESEND RESET OTP
router.post('/resend-reset-otp', async (req, res) => {
  try {
    const { userId } = req.body;
    
    if (!userId) {
      return res.status(400).json({ message: 'User ID is required' });
    }
    
    const user = await User.findById(userId);
    
    if (!user) {
      return res.status(404).json({ message: 'User not found' });
    }
    
    // Generate new reset OTP
    const otp = generateOTP();
    const otpExpiry = new Date(Date.now() + 10 * 60 * 1000);
    
    user.resetOtp = otp;
    user.resetOtpExpiry = otpExpiry;
    await user.save();
    
    // Send new OTP email
    const emailResult = await sendPasswordResetOTP(user.email, user.name, otp);
    
    if (!emailResult.success) {
      return res.status(500).json({ 
        message: 'Failed to resend OTP email',
        error: emailResult.error 
      });
    }
    
    res.json({
      success: true,
      message: 'New OTP sent to your email'
    });
    
  } catch (error) {
    console.error('Resend reset OTP error:', error);
    res.status(500).json({ message: 'Failed to resend OTP' });
  }
});

// UPDATE user (keep existing)
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
    ).select('-password -otp -resetOtp');

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

// DELETE user (keep existing)
router.delete('/:id', async (req, res) => {
  try {
    const user = await User.findById(req.params.id);
    
    if (!user) {
      return res.status(404).json({ message: 'User not found' });
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

module.exports = router;