const express = require('express');
const jwt = require('jsonwebtoken');
const Admin = require('../models/Admin');
const { auth } = require('../middleware/auth');

const router = express.Router();

// Admin Login
router.post('/login', async (req, res) => {
  try {
    // Check if MongoDB is connected
    if (!process.env.MONGODB_URI) {
      return res.status(503).json({ error: 'Database not configured. Please set up MongoDB connection.' });
    }

    const { email, password } = req.body;

    // Validate input
    if (!email || !password) {
      return res.status(400).json({ error: 'Email and password are required.' });
    }

    // Find admin by email
    const admin = await Admin.findOne({ email: email.toLowerCase() });
    if (!admin) {
      return res.status(401).json({ error: 'Invalid credentials.' });
    }

    // Check if admin is active
    if (!admin.isActive) {
      return res.status(401).json({ error: 'Account is deactivated.' });
    }

    // Verify password
    const isPasswordValid = await admin.comparePassword(password);
    if (!isPasswordValid) {
      return res.status(401).json({ error: 'Invalid credentials.' });
    }

    // Update last login
    admin.lastLogin = new Date();
    await admin.save();

    // Generate JWT token
    console.log('🔍 Login Debug: JWT_SECRET exists:', !!process.env.JWT_SECRET);
    const jwtSecret = process.env.JWT_SECRET || 'drexcape-super-secret-jwt-key-2024';
    const token = jwt.sign(
      { id: admin._id, role: admin.role },
      jwtSecret,
      { expiresIn: '24h' }
    );
    console.log('🔍 Login Debug: Token generated successfully');

    res.json({
      message: 'Login successful',
      token,
      admin: {
        id: admin._id,
        username: admin.username,
        email: admin.email,
        role: admin.role,
        lastLogin: admin.lastLogin
      }
    });
  } catch (error) {
    console.error('Login error:', error);
    res.status(500).json({ error: 'Server error.' });
  }
});

// Get admin profile
router.get('/profile', auth, async (req, res) => {
  try {
    res.json({ admin: req.admin });
  } catch (error) {
    console.error('Profile error:', error);
    res.status(500).json({ error: 'Server error.' });
  }
});

// Change password
router.put('/change-password', auth, async (req, res) => {
  try {
    const { currentPassword, newPassword } = req.body;

    if (!currentPassword || !newPassword) {
      return res.status(400).json({ error: 'Current and new password are required.' });
    }

    if (newPassword.length < 6) {
      return res.status(400).json({ error: 'New password must be at least 6 characters.' });
    }

    const admin = await Admin.findById(req.admin._id);
    
    // Verify current password
    const isCurrentPasswordValid = await admin.comparePassword(currentPassword);
    if (!isCurrentPasswordValid) {
      return res.status(401).json({ error: 'Current password is incorrect.' });
    }

    // Update password
    admin.password = newPassword;
    await admin.save();

    res.json({ message: 'Password updated successfully.' });
  } catch (error) {
    console.error('Change password error:', error);
    res.status(500).json({ error: 'Server error.' });
  }
});

// Logout (client-side token removal)
router.post('/logout', auth, (req, res) => {
  res.json({ message: 'Logged out successfully.' });
});

module.exports = router; 