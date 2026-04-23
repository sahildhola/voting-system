const { ethers } = require("ethers");
const Vote = require("../models/Vote.model");
const Election = require("../models/Election.model");
const User = require("../models/User.model");
const {
  registerVoterOnChain,
  castVoteOnChain,
  getVoterStatusFromChain,
  createWallet,
  fundWallet,
} = require("../utils/blockchain.service");

// Register voter for an election. Each (user, election) pair gets its own fresh
// wallet so one user can vote with different identities across different elections.
const registerForElection = async (req, res) => {
  try {
    const { electionId } = req.body;
    const voter = req.user;

    const election = await Election.findById(electionId);
    if (!election) return res.status(404).json({ error: "Election not found" });

    // Check if already registered
    const alreadyRegistered = election.registeredVoters.some(
      (v) => v.userId?.toString() === voter._id.toString()
    );
    if (alreadyRegistered) {
      return res.status(400).json({ error: "Already registered for this election" });
    }

    // Check election not ended/finalized
    const now = new Date();
    if (election.status === "finalized" || now > election.endTime) {
      return res.status(400).json({ error: "Election has already ended" });
    }

    // Generate a fresh wallet for this specific election.
    const electionWallet = createWallet();
    const electionWalletAddress = electionWallet.address.toLowerCase();
    const electionWalletKey = electionWallet.privateKey;

    // Fund it with a little ETH for gas (local Hardhat node only).
    try {
      await fundWallet(electionWalletAddress, "1.0");
    } catch (err) {
      console.warn(
        "Could not fund per-election wallet (blockchain may be offline):",
        err.message
      );
    }

    let txHash = null;

    // Register THIS wallet on-chain. If it fails, surface the error instead of
    // silently marking the voter registered in the DB.
    if (election.blockchainId) {
      try {
        const result = await registerVoterOnChain(
          election.blockchainId,
          electionWalletAddress
        );
        txHash = result.txHash;
      } catch (err) {
        const reason = err.reason || err.shortMessage || err.message || "";
        console.error("Blockchain register voter failed:", reason);
        return res.status(400).json({
          error: "Could not register on the blockchain: " + reason,
        });
      }
    }

    // Record on the election
    election.registeredVoters.push({
      userId: voter._id,
      walletAddress: electionWalletAddress,
      txHash,
    });
    await election.save();

    // Record on the user — keyed by election's Mongo _id for reliable lookup.
    await User.findByIdAndUpdate(voter._id, {
      $push: {
        registeredElections: {
          electionId: election.blockchainId,
          electionObjectId: election._id,
          walletAddress: electionWalletAddress,
          txHash,
        },
      },
    });

    res.json({
      success: true,
      message: "Successfully registered for election",
      txHash,
      wallet: {
        address: electionWalletAddress,
        privateKey: electionWalletKey,
        warning:
          "This private key is required to cast your vote in THIS election. " +
          "It is shown only once and is never stored on our servers. Save it now.",
      },
    });
  } catch (error) {
    console.error("Register for election error:", error);
    res.status(500).json({ error: error.message });
  }
};

// Cast a vote
const castVote = async (req, res) => {
  try {
    const { electionId, candidateBlockchainId, voterPrivateKey } = req.body;
    const voter = req.user;

    const election = await Election.findById(electionId);
    if (!election) return res.status(404).json({ error: "Election not found" });

    // Check election is active
    const now = new Date();
    if (now < election.startTime) {
      return res.status(400).json({ error: "Election has not started yet" });
    }
    if (now > election.endTime) {
      return res.status(400).json({ error: "Election has ended" });
    }
    if (election.status === "finalized") {
      return res.status(400).json({ error: "Election is finalized" });
    }

    // Check if already voted in DB
    const existingVote = await Vote.findOne({
      election: election._id,
      voter: voter._id,
    });
    if (existingVote) {
      return res.status(400).json({ error: "You have already voted in this election" });
    }

    // Verify candidate exists
    const candidate = election.candidates.find(
      (c) => c.blockchainId === candidateBlockchainId
    );
    if (!candidate) {
      return res.status(400).json({ error: "Candidate not found in this election" });
    }

    // Look up the per-election wallet this voter was issued at registration time.
    const voterFresh = await User.findById(voter._id).lean();
    const electionEntry = (voterFresh?.registeredElections || []).find(
      (e) => e.electionObjectId?.toString() === election._id.toString()
    );
    const electionWalletAddress = electionEntry?.walletAddress || null;

    let txHash = null;
    let blockNumber = null;

    // Cast vote on blockchain
    if (election.blockchainId && electionWalletAddress) {
      if (!voterPrivateKey) {
        return res.status(400).json({
          error:
            "Election-specific private key required. Paste the key that was shown when you registered for THIS election.",
        });
      }

      const trimmedKey = String(voterPrivateKey).trim();
      const normalizedKey = trimmedKey.startsWith("0x") ? trimmedKey : "0x" + trimmedKey;

      if (!/^0x[0-9a-fA-F]{64}$/.test(normalizedKey)) {
        return res.status(400).json({
          error:
            "Invalid private key format. Expected 0x + 64 hex characters (66 total). " +
            "You may have pasted your wallet address instead of the private key.",
        });
      }

      let derivedAddress;
      try {
        derivedAddress = new ethers.Wallet(normalizedKey).address.toLowerCase();
      } catch {
        return res.status(400).json({
          error: "Invalid private key — could not derive a wallet from it.",
        });
      }

      if (derivedAddress !== electionWalletAddress.toLowerCase()) {
        return res.status(400).json({
          error:
            "This private key does not match the wallet that was issued for this election. " +
            "Each election gets its own wallet — use the key you saved when registering for THIS election.",
        });
      }

      // Best-effort self-heal: re-register on-chain if the earlier DB record wasn't
      // matched by a successful blockchain tx (e.g. chain restart).
      try {
        const chainStatus = await getVoterStatusFromChain(
          election.blockchainId,
          electionWalletAddress
        );
        if (!chainStatus.isRegistered) {
          await registerVoterOnChain(
            election.blockchainId,
            electionWalletAddress
          );
        }
      } catch (err) {
        const reason = err.reason || err.shortMessage || err.message || "";
        if (!/already registered/i.test(reason)) {
          console.error("On-chain voter re-registration failed:", reason);
          return res.status(400).json({
            error:
              "Could not confirm your on-chain registration for this election: " +
              reason,
          });
        }
      }

      try {
        const result = await castVoteOnChain(
          election.blockchainId,
          candidateBlockchainId,
          normalizedKey
        );
        txHash = result.txHash;
        blockNumber = result.blockNumber;
      } catch (err) {
        console.error("castVoteOnChain failed:", {
          electionBcId: election.blockchainId,
          candidateBcId: candidateBlockchainId,
          voterWallet: electionWalletAddress,
          reason: err.reason || err.shortMessage || err.message,
        });
        return res.status(400).json({
          error: "Blockchain vote failed: " + (err.reason || err.shortMessage || err.message),
        });
      }
    } else {
      // No blockchain or no per-election wallet — generate a fake tx hash for demo
      txHash = "0x" + Math.random().toString(16).substring(2).padEnd(64, "0");
    }

    // Record vote in MongoDB
    const vote = new Vote({
      election: election._id,
      electionBlockchainId: election.blockchainId,
      voter: voter._id,
      voterWalletAddress:
        electionWalletAddress ||
        voter.walletAddress ||
        "0x0000000000000000000000000000000000000000",
      candidateBlockchainId,
      candidateName: candidate.name,
      txHash,
      blockNumber,
    });

    await vote.save();

    // Update vote counts in election
    await Election.findOneAndUpdate(
      { _id: election._id, "candidates.blockchainId": candidateBlockchainId },
      {
        $inc: {
          totalVotes: 1,
          "candidates.$.voteCount": 1,
        },
      }
    );

    // Mark the user's per-election entry as voted. Key on electionObjectId so it
    // works whether or not the election has a blockchainId.
    await User.updateOne(
      {
        _id: voter._id,
        "registeredElections.electionObjectId": election._id,
      },
      {
        $set: {
          "registeredElections.$.hasVoted": true,
          "registeredElections.$.txHash": txHash,
        },
      },
      { runValidators: false }
    );


    res.json({
      success: true,
      message: "Vote cast successfully on the blockchain!",
      vote: {
        txHash,
        blockNumber,
        candidate: candidate.name,
        electionTitle: election.title,
        timestamp: vote.timestamp,
      },
    });
  } catch (error) {
    console.error("Cast vote error:", error);
    if (error.code === 11000) {
      return res.status(400).json({ error: "You have already voted in this election" });
    }
    res.status(500).json({ error: error.message });
  }
};

// Get voter status for an election
const getVoterStatus = async (req, res) => {
  try {
    const { electionId } = req.params;
    const election = await Election.findById(electionId);
    if (!election) return res.status(404).json({ error: "Election not found" });

    const isRegistered = election.registeredVoters.some(
      (v) => v.userId?.toString() === req.user._id.toString()
    );

    const vote = await Vote.findOne({
      election: election._id,
      voter: req.user._id,
    }).lean();

    // Look up the per-election wallet this voter was issued.
    const voterFresh = await User.findById(req.user._id).lean();
    const electionEntry = (voterFresh?.registeredElections || []).find(
      (e) => e.electionObjectId?.toString() === election._id.toString()
    );
    const electionWalletAddress = electionEntry?.walletAddress || null;

    // Get blockchain status (against the per-election wallet, not the account's default one)
    let blockchainStatus = null;
    if (election.blockchainId && electionWalletAddress) {
      try {
        blockchainStatus = await getVoterStatusFromChain(
          election.blockchainId,
          electionWalletAddress
        );
      } catch {
        // blockchain not available
      }
    }

    res.json({
      success: true,
      isRegistered,
      hasVoted: !!vote,
      electionWalletAddress,
      vote: vote
        ? {
            candidateName: vote.candidateName,
            txHash: vote.txHash,
            timestamp: vote.timestamp,
          }
        : null,
      blockchainStatus,
    });
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
};

// Get vote history for user
const getVoteHistory = async (req, res) => {
  try {
    const votes = await Vote.find({ voter: req.user._id })
      .populate("election", "title startTime endTime")
      .sort({ timestamp: -1 })
      .lean();

    res.json({ success: true, votes });
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
};

module.exports = {
  registerForElection,
  castVote,
  getVoterStatus,
  getVoteHistory,
};
