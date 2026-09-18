const express = require('express');
const router = express.Router();
const bcrypt = require('bcryptjs');
const jwt = require('jsonwebtoken');
const { v4: uuidv4 } = require('uuid');
const User = require('../models/User');
const { auth } = require('../middleware/auth');

// Register with college email
router.post('/register', async (req, res) => {
  try {
    const { email, password, name, college } = req.body;

    // Check if college email
    const collegeDomains = ['.edu', '.ac.in', '.edu.in'];
    const isCollegeEmail = collegeDomains.some(domain => 
      email.toLowerCase().endsWith(domain)
    );

    if (!isCollegeEmail) {
      return res.status(400).json({ 
        error: 'Please use your college email address' 
      });
    }

    // Check existing user
    const existingUser = await User.findOne({ email });
    if (existingUser) {
      return res.status(400).json({ error: 'Email already registered' });
    }

    // Hash password
    const hashedPassword = await bcrypt.hash(password, 10);

    // Create verification token
    const verificationToken = uuidv4();

    // Create user
    const user = new User({
      email,
      password: hashedPassword,
      name,
      college,
      verificationToken
    });

    await user.save();

    // Generate token
    const token = jwt.sign(
      { userId: user._id }, 
      process.env.JWT_SECRET,
      { expiresIn: '7d' }
    );

    res.status(201).json({
      message: 'Registration successful. Please verify your email.',
      token,
      user: {
        id: user._id,
        email: user.email,
        name: user.name,
        college: user.college,
        isVerified: user.isVerified
      }
    });
  } catch (error) {
    res.status(500).json({ error: 'Server error' });
  }
});

// Login
router.post('/login', async (req, res) => {
  try {
    const { email, password } = req.body;

    const user = await User.findOne({ email });
    if (!user) {
      return res.status(400).json({ error: 'Invalid credentials' });
    }

    const isMatch = await bcrypt.compare(password, user.password);
    if (!isMatch) {
      return res.status(400).json({ error: 'Invalid credentials' });
    }

    const token = jwt.sign(
      { userId: user._id }, 
      process.env.JWT_SECRET,
      { expiresIn: '7d' }
    );

    res.json({
      token,
      user: {
        id: user._id,
        email: user.email,
        name: user.name,
        college: user.college,
        isVerified: user.isVerified
      }
    });
  } catch (error) {
    res.status(500).json({ error: 'Server error' });
  }
});

// Get current user profile
router.get('/me', auth, async (req, res) => {
  try {
    const user = await User.findById(req.user._id)
      .select('-password -verificationToken');
    res.json(user);
  } catch (error) {
    res.status(500).json({ error: 'Server error' });
  }
});

// Update profile
router.put('/profile', auth, async (req, res) => {
  try {
    const updates = req.body;
    const allowedUpdates = [
      'name', 'bio', 'skills', 'interests', 
      'lookingFor', 'avatar', 'department', 'year'
    ];
    
    const updatesFiltered = Object.keys(updates)
      .filter(key => allowedUpdates.includes(key))
      .reduce((obj, key) => {
        obj[key] = updates[key];
        return obj;
      }, {});

    const user = await User.findByIdAndUpdate(
      req.user._id,
      { $set: updatesFiltered },
      { new: true, runValidators: true }
    ).select('-password');

    res.json(user);
  } catch (error) {
    res.status(500).json({ error: 'Server error' });
  }
});

// Update location
router.put('/location', auth, async (req, res) => {
  try {
    const { longitude, latitude } = req.body;

    const user = await User.findByIdAndUpdate(
      req.user._id,
      {
        location: {
          type: 'Point',
          coordinates: [longitude, latitude]
        }
      },
      { new: true }
    ).select('-password');

    res.json(user);
  } catch (error) {
    res.status(500).json({ error: 'Server error' });
  }
});

// Add hackathon history
router.post('/hackathon-history', auth, async (req, res) => {
  try {
    const { name, date, role, achievement, projectLink } = req.body;

    const user = await User.findById(req.user._id);
    user.hackathonHistory.push({
      name, date, role, achievement, projectLink
    });
    await user.save();

    res.json(user);
  } catch (error) {
    res.status(500).json({ error: 'Server error' });
  }
});

module.exports = router;
