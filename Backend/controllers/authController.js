const jwt = require('jsonwebtoken');
const User = require('../models/User');

// Register new user
exports.register = async (req, res, next) => {
  try {
    const { name, email, password } = req.body;

    console.log('📝 Registration attempt:', email);

    // Validation
    if (!name || !email || !password) {
      return res.status(400).json({ error: 'Please provide name, email and password' });
    }

    if (password.length < 6) {
      return res.status(400).json({ error: 'Password must be at least 6 characters' });
    }

    // Check if user already exists
    const existingUser = await User.findOne({ email });
    if (existingUser) {
      return res.status(400).json({ error: 'User already exists with this email' });
    }

    // Create new user
    const user = await User.create({
      name,
      email,
      password
    });

    // Generate JWT token
    const token = jwt.sign(
      { userId: user._id, email: user.email },
      process.env.JWT_SECRET,
      { expiresIn: '7d' }
    );

    console.log('✅ User registered successfully:', user.email);

    res.status(201).json({
      success: true,
      message: 'User registered successfully',
      token,
      user: {
        id: user._id,
        name: user.name,
        email: user.email
      }
    });
  } catch (err) {
    console.error('❌ Registration error:', err);
    next(err);
  }
};

// Login user
exports.login = async (req, res, next) => {
  try {
    const { email, password } = req.body;

    console.log('🔐 Login attempt:', email);

    // Validation
    if (!email || !password) {
      return res.status(400).json({ error: 'Please provide email and password' });
    }

    // Find user
    const user = await User.findOne({ email });
    if (!user) {
      return res.status(401).json({ error: 'Invalid email or password' });
    }

    // Check password
    const isPasswordValid = await user.comparePassword(password);
    if (!isPasswordValid) {
      return res.status(401).json({ error: 'Invalid email or password' });
    }

    // Generate JWT token
    const token = jwt.sign(
      { userId: user._id, email: user.email },
      process.env.JWT_SECRET,
      { expiresIn: '7d' }
    );

    console.log('✅ User logged in successfully:', user.email);

    res.json({
      success: true,
      message: 'Login successful',
      token,
      user: {
        id: user._id,
        name: user.name,
        email: user.email
      }
    });
  } catch (err) {
    console.error('❌ Login error:', err);
    next(err);
  }
};

// Get current user
exports.getMe = async (req, res, next) => {
  try {
    const user = await User.findById(req.auth.userId).select('-password');
    
    if (!user) {
      return res.status(404).json({ error: 'User not found' });
    }

    res.json({
      success: true,
      user: {
        id: user._id,
        name: user.name,
        email: user.email
      }
    });
  } catch (err) {
    console.error('❌ Get user error:', err);
    next(err);
  }
};
