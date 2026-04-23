const User = require("../models/User.model");
const Election = require("../models/Election.model");
const Vote = require("../models/Vote.model");
const {
  finalizeElectionOnChain,
  getBlockchainStats,
  registerVoterOnChain,
} = require("../utils/blockchain.service");

// Get all users (admin)
const getAllUsers = async (req, res) => {
  try {
    const { page = 1, limit = 20, role, search } = req.query;
    const query = {};
    if (role) query.role = role;
    if (search) {
      query.$or = [
        { name: { $regex: search, $options: "i" } },
        { email: { $regex: search, $options: "i" } },
      ];
    }

    const users = await User.find(query)
      .sort({ createdAt: -1 })
      .skip((page - 1) * limit)
      .limit(Number(limit))
      .lean();

    const total = await User.countDocuments(query);

    res.json({ success: true, users, pagination: { total, page: Number(page), pages: Math.ceil(total / limit) } });
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
};

// Toggle user active status
const toggleUserStatus = async (req, res) => {
  try {
    const user = await User.findById(req.params.id);
    if (!user) return res.status(404).json({ error: "User not found" });

    user.isActive = !user.isActive;
    await user.save();

    res.json({ success: true, message: `User ${user.isActive ? "activated" : "deactivated"}`, user });
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
};

// Finalize an election
const finalizeElection = async (req, res) => {
  try {
    const election = await Election.findById(req.params.id);
    if (!election) return res.status(404).json({ error: "Election not found" });
    if (election.status === "finalized") {
      return res.status(400).json({ error: "Election already finalized" });
    }

    let winnerId = null;
    let winnerName = null;
    let txHash = null;

    // Finalize on blockchain
    if (election.blockchainId) {
      try {
        const result = await finalizeElectionOnChain(election.blockchainId);
        winnerId = result.winnerId;
        winnerName = result.winnerName;
        txHash = result.txHash;
      } catch (err) {
        console.warn("Blockchain finalize failed:", err.message);
      }
    }

    // Find winner from MongoDB data
    if (!winnerId) {
      const sortedCandidates = [...election.candidates].sort(
        (a, b) => b.voteCount - a.voteCount
      );
      if (sortedCandidates[0]?.voteCount > 0) {
        winnerId = sortedCandidates[0].blockchainId;
        winnerName = sortedCandidates[0].name;
      }
    }

    election.status = "finalized";
    election.winnerId = winnerId;
    election.winnerName = winnerName;
    if (txHash) election.txHash = txHash;
    await election.save();

    res.json({
      success: true,
      message: "Election finalized",
      winner: { id: winnerId, name: winnerName },
      txHash,
    });
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
};

// Register a voter for an election (admin action)
const adminRegisterVoter = async (req, res) => {
  try {
    const { userId, electionId } = req.body;

    const [user, election] = await Promise.all([
      User.findById(userId),
      Election.findById(electionId),
    ]);

    if (!user) return res.status(404).json({ error: "User not found" });
    if (!election) return res.status(404).json({ error: "Election not found" });

    const alreadyRegistered = election.registeredVoters.some(
      (v) => v.userId?.toString() === userId
    );
    if (alreadyRegistered) {
      return res.status(400).json({ error: "Voter already registered" });
    }

    let txHash = null;
    if (election.blockchainId && user.walletAddress) {
      try {
        const result = await registerVoterOnChain(election.blockchainId, user.walletAddress);
        txHash = result.txHash;
      } catch (err) {
        console.warn("Blockchain registration failed:", err.message);
      }
    }

    election.registeredVoters.push({ userId: user._id, walletAddress: user.walletAddress, txHash });
    await election.save();

    res.json({ success: true, message: "Voter registered successfully", txHash });
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
};

// Get dashboard stats
const getDashboardStats = async (req, res) => {
  try {
    const now = new Date();

    const [
      totalUsers,
      totalVoters,
      totalElections,
      activeElections,
      totalVotes,
      blockchainStats,
    ] = await Promise.all([
      User.countDocuments(),
      User.countDocuments({ role: "voter" }),
      Election.countDocuments(),
      Election.countDocuments({ startTime: { $lte: now }, endTime: { $gte: now }, status: { $ne: "finalized" } }),
      Vote.countDocuments(),
      getBlockchainStats().catch(() => null),
    ]);

    const recentElections = await Election.find()
      .sort({ createdAt: -1 })
      .limit(5)
      .lean();

    const recentVotes = await Vote.find()
      .sort({ timestamp: -1 })
      .limit(5)
      .populate("voter", "name email")
      .populate("election", "title")
      .lean();

    res.json({
      success: true,
      stats: {
        totalUsers,
        totalVoters,
        totalElections,
        activeElections,
        totalVotes,
      },
      blockchain: blockchainStats,
      recentElections,
      recentVotes,
    });
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
};

module.exports = {
  getAllUsers,
  toggleUserStatus,
  finalizeElection,
  adminRegisterVoter,
  getDashboardStats,
};
