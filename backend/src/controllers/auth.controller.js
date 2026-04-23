const User = require("../models/User.model");
const { generateToken } = require("../middleware/auth.middleware");
const { createWallet, fundWallet } = require("../utils/blockchain.service");

// Register voter
const register = async (req, res) => {
  try {
    const { name, email, password, nationalId } = req.body;

    const existingUser = await User.findOne({
      $or: [{ email }, ...(nationalId ? [{ nationalId }] : [])],
    });

    if (existingUser) {
      return res.status(400).json({
        error: "User with this email or national ID already exists",
      });
    }

    // Create blockchain wallet for voter
    const wallet = createWallet();

    // Fund wallet with test ETH (local Hardhat node)
    try {
      await fundWallet(wallet.address, "1.0");
    } catch (err) {
      console.warn("Could not fund wallet (blockchain may not be running):", err.message);
    }

    const user = new User({
      name,
      email,
      password,
      nationalId,
      walletAddress: wallet.address,
      role: "voter",
    });

    await user.save();

    const token = generateToken(user._id);

    res.status(201).json({
      success: true,
      message: "Registration successful",
      token,
      user: {
        id: user._id,
        name: user.name,
        email: user.email,
        role: user.role,
        walletAddress: user.walletAddress,
      },
      wallet: {
        address: wallet.address,
        privateKey: wallet.privateKey, // Store securely — shown only once
        warning: "Save your private key securely. It will not be shown again.",
      },
    });
  } catch (error) {
    console.error("Register error:", error);
    res.status(500).json({ error: error.message || "Registration failed" });
  }
};

// Login
const login = async (req, res) => {
  try {
    const { email, password } = req.body;

    // 1. Find the user
    const user = await User.findOne({ email }).select("+password");
    if (!user || !(await user.comparePassword(password))) {
      return res.status(401).json({ error: "Invalid email or password" });
    }

    if (!user.isActive) {
      return res.status(403).json({ error: "Account is disabled" });
    }

    // 2. FIX: Update ONLY the lastLogin field. 
    // This bypasses the validation error in the 'registeredElections' array.
    await User.findByIdAndUpdate(user._id, { $set: { lastLogin: new Date() } });

    // 3. Generate token
    const token = generateToken(user._id);

    res.json({
      success: true,
      token,
      user: {
        id: user._id,
        name: user.name,
        email: user.email,
        role: user.role,
        walletAddress: user.walletAddress,
        registeredElections: user.registeredElections,
      },
    });
  } catch (error) {
    console.error("Login Error:", error); // Log this so you can see it in your terminal
    res.status(500).json({ error: error.message || "Login failed" });
  }
};

// Get current user profile
const getProfile = async (req, res) => {
  try {
    const user = await User.findById(req.user._id)
      .populate("registeredElections.electionId")
      .lean();

    res.json({ success: true, user });
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
};

// Update profile
const updateProfile = async (req, res) => {
  try {
    const { name } = req.body;
    const user = await User.findByIdAndUpdate(
      req.user._id,
      { name },
      { new: true, runValidators: true }
    );
    res.json({ success: true, user });
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
};

module.exports = { register, login, getProfile, updateProfile };
