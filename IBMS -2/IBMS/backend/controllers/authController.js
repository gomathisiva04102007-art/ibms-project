const jwt = require('jsonwebtoken');
const User = require('../models/User');
const BusinessProfile = require('../models/BusinessProfile');

// Generate JWT Token
const generateToken = (id) => {
  return jwt.sign({ id }, process.env.JWT_SECRET || 'ibms_super_secret_jwt_key_2026_secure', {
    expiresIn: process.env.JWT_EXPIRES_IN || '7d',
  });
};

// @desc    Register a new user & create initial business profile
// @route   POST /api/auth/register
// @access  Public
const registerUser = async (req, res, next) => {
  try {
    const { name, email, password, confirmPassword, phone, businessName } = req.body;

    if (!name || !email || !password) {
      return res.status(400).json({
        success: false,
        message: 'Please provide full name, email, and password.',
      });
    }

    if (password.length < 6) {
      return res.status(400).json({
        success: false,
        message: 'Password must be at least 6 characters long.',
      });
    }

    if (confirmPassword && password !== confirmPassword) {
      return res.status(400).json({
        success: false,
        message: 'Passwords do not match.',
      });
    }

    const userExists = await User.findOne({ email: email.toLowerCase() });
    if (userExists) {
      return res.status(400).json({
        success: false,
        message: 'An account with this email address already exists. Please log in.',
      });
    }

    const user = await User.create({
      name,
      email: email.toLowerCase(),
      password,
      phone: phone || '',
      businessName: businessName || `${name}'s Business`,
    });

    // Create linked default BusinessProfile
    const profile = await BusinessProfile.create({
      user: user._id,
      businessName: businessName || `${name}'s Enterprises`,
      legalName: businessName || `${name}'s Enterprises`,
      email: user.email,
      phone: user.phone || '',
      address: '101, Commercial Hub, Sector 5',
      city: 'Mumbai',
      state: 'Maharashtra',
      postalCode: '400001',
      country: 'India',
      gstin: '27AABCB1234F1Z5',
      pan: 'AABCB1234F',
      currency: 'INR',
      currencySymbol: '₹',
      invoicePrefix: 'INV',
      invoiceNextNumber: 1001,
      defaultPaymentTerms: 'Payment due within 15 days of invoice date.',
      defaultNotes: 'Thank you for doing business with us! Cheques/NEFT should be in favour of the company.',
      bankDetails: {
        bankName: 'State Bank of India',
        accountHolder: name,
        accountNumber: '334455667788',
        ifscCode: 'SBIN0001234',
        branch: 'Nariman Point, Mumbai',
        upiId: `${email.split('@')[0]}@okhdfcbank`,
      },
    });

    const token = generateToken(user._id);

    res.status(201).json({
      success: true,
      message: 'Account created successfully.',
      token,
      user: {
        _id: user._id,
        name: user.name,
        email: user.email,
        phone: user.phone,
        businessName: user.businessName,
        role: user.role,
      },
      profile,
    });
  } catch (error) {
    next(error);
  }
};

// @desc    Authenticate user & get token
// @route   POST /api/auth/login
// @access  Public
const loginUser = async (req, res, next) => {
  try {
    const { email, password } = req.body;

    if (!email || !password) {
      return res.status(400).json({
        success: false,
        message: 'Please provide both email and password.',
      });
    }

    const user = await User.findOne({ email: email.toLowerCase() }).select('+password');

    if (!user || !(await user.matchPassword(password))) {
      return res.status(401).json({
        success: false,
        message: 'Invalid email address or password.',
      });
    }

    const token = generateToken(user._id);
    const profile = await BusinessProfile.findOne({ user: user._id });

    res.status(200).json({
      success: true,
      message: 'Logged in successfully.',
      token,
      user: {
        _id: user._id,
        name: user.name,
        email: user.email,
        phone: user.phone,
        businessName: user.businessName,
        role: user.role,
      },
      profile,
    });
  } catch (error) {
    next(error);
  }
};

// @desc    Get currently logged in user profile
// @route   GET /api/auth/me
// @access  Private
const getMe = async (req, res, next) => {
  try {
    const user = await User.findById(req.user._id);
    const profile = await BusinessProfile.findOne({ user: req.user._id });

    res.status(200).json({
      success: true,
      user: {
        _id: user._id,
        name: user.name,
        email: user.email,
        phone: user.phone,
        businessName: user.businessName,
        role: user.role,
      },
      profile,
    });
  } catch (error) {
    next(error);
  }
};

// @desc    Logout user
// @route   POST /api/auth/logout
// @access  Private
const logoutUser = async (req, res) => {
  res.status(200).json({
    success: true,
    message: 'Logged out successfully.',
  });
};

module.exports = {
  registerUser,
  loginUser,
  getMe,
  logoutUser,
};
