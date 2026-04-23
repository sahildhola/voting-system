const Election = require("../models/Election.model");
const User = require("../models/User.model");
const Vote = require("../models/Vote.model");
const {
  createElectionOnChain,
  addCandidateOnChain,
  getElectionCandidatesFromChain,
  getVoterStatusFromChain,
} = require("../utils/blockchain.service");

// Get all elections
const getAllElections = async (req, res) => {
  try {
    const { status, page = 1, limit = 10 } = req.query;
    const query = {};

    // Auto-compute status for filtering
    const now = new Date();
    if (status === "active") {
      query.startTime = { $lte: now };
      query.endTime = { $gte: now };
      query.status = { $ne: "finalized" };
    } else if (status === "pending") {
      query.startTime = { $gt: now };
    } else if (status === "ended") {
      query.endTime = { $lt: now };
    } else if (status === "finalized") {
      query.status = "finalized";
    }

    const elections = await Election.find(query)
      .sort({ createdAt: -1 })
      .skip((page - 1) * limit)
      .limit(Number(limit))
      .populate("createdBy", "name email")
      .lean();

    // Attach computed status
    const enriched = elections.map((e) => ({
      ...e,
      computedStatus: computeStatus(e),
      voterCount: e.registeredVoters?.length || 0,
    }));

    const total = await Election.countDocuments(query);

    res.json({
      success: true,
      elections: enriched,
      pagination: {
        total,
        page: Number(page),
        pages: Math.ceil(total / limit),
      },
    });
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
};

// Get single election
const getElection = async (req, res) => {
  try {
    const election = await Election.findById(req.params.id)
      .populate("createdBy", "name email")
      .lean();

    if (!election) {
      return res.status(404).json({ error: "Election not found" });
    }

    // Check voter status if logged in
    let voterStatus = null;
    if (req.user && req.user.walletAddress && election.blockchainId) {
      try {
        voterStatus = await getVoterStatusFromChain(
          election.blockchainId,
          req.user.walletAddress
        );
      } catch {
        // blockchain not available
      }
    }

    res.json({
      success: true,
      election: {
        ...election,
        computedStatus: computeStatus(election),
        voterCount: election.registeredVoters?.length || 0,
        voterStatus,
      },
    });
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
};

// Create election (admin)
const createElection = async (req, res) => {
  try {
    const { title, description, startTime, endTime, candidates } = req.body;

    // 1. Blockchain Election Creation
    let blockchainId = null;
    let txHash = null;
    try {
      const result = await createElectionOnChain(title, description, startTime, endTime);
      blockchainId = result.electionId;
      txHash = result.txHash;
    } catch (err) {
      console.warn("⚠️ Blockchain offline:", err.message);
    }

    // 2. Prepare Candidates Array BEFORE saving
    // If the election is on-chain, every candidate MUST also go on-chain — otherwise we'd store
    // fake fallback ids that don't match the contract, and voting would silently fail later.
    const processedCandidates = [];
    if (candidates && candidates.length > 0) {
      for (let i = 0; i < candidates.length; i++) {
        let blockchainCandidateId = null;

        if (blockchainId) {
          const candRes = await addCandidateOnChain(blockchainId, candidates[i].name, candidates[i].party, "");
          blockchainCandidateId = candRes.candidateId;
          if (blockchainCandidateId == null) {
            throw new Error(`Failed to add candidate "${candidates[i].name}" to blockchain`);
          }
        }

        processedCandidates.push({
          blockchainId: blockchainCandidateId || (i + 1),
          name: candidates[i].name,
          party: candidates[i].party,
          description: candidates[i].description || "",
          voteCount: 0,
        });
      }
    }

    // 3. Save EVERYTHING at once
    const election = new Election({
      blockchainId,
      title,
      description,
      startTime: new Date(startTime),
      endTime: new Date(endTime),
      txHash,
      createdBy: req.user?._id, // Added optional chaining for safety
      candidates: processedCandidates,
    });

    await election.save();

    res.status(201).json({ success: true, election });

  } catch (error) {
    console.error("CRITICAL ERROR:", error); // Check your VS Code Terminal for this!
    res.status(500).json({ error: error.message });
  }
};
// Add candidate to existing election
const addCandidate = async (req, res) => {
  try {
    const { name, party, description, imageUrl } = req.body;
    const election = await Election.findById(req.params.id);

    if (!election) return res.status(404).json({ error: "Election not found" });
    if (election.status === "finalized") {
      return res.status(400).json({ error: "Cannot add candidates to finalized election" });
    }

    let blockchainCandidateId = null;

    if (election.blockchainId) {
      try {
        const result = await addCandidateOnChain(
          election.blockchainId,
          name,
          party,
          imageUrl || ""
        );
        blockchainCandidateId = result.candidateId;
      } catch (err) {
        console.warn("Blockchain add candidate failed:", err.message);
      }
    }

    const candidate = {
      blockchainId: blockchainCandidateId || election.candidates.length + 1,
      name,
      party,
      description: description || "",
      imageUrl: imageUrl || "",
      voteCount: 0,
    };

    election.candidates.push(candidate);
    await election.save();

    res.json({ success: true, candidate, election });
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
};

// Get election results
const getElectionResults = async (req, res) => {
  try {
    const election = await Election.findById(req.params.id).lean();
    if (!election) return res.status(404).json({ error: "Election not found" });

    const votes = await Vote.find({ election: election._id }).lean();

    // Aggregate votes by candidate
    const candidateVotes = {};
    votes.forEach((v) => {
      if (!candidateVotes[v.candidateBlockchainId]) {
        candidateVotes[v.candidateBlockchainId] = 0;
      }
      candidateVotes[v.candidateBlockchainId]++;
    });

    const results = election.candidates.map((c) => ({
      ...c,
      voteCount: candidateVotes[c.blockchainId] || 0,
      percentage:
        votes.length > 0
          ? (((candidateVotes[c.blockchainId] || 0) / votes.length) * 100).toFixed(1)
          : "0.0",
    }));

    // Sort candidates by vote count descending
    results.sort((a, b) => b.voteCount - a.voteCount);

    // --- TIE DETECTION LOGIC START ---
    let winner = null;
    let isTie = false;

    if (results.length > 0 && results[0].voteCount > 0) {
      // Check if the second candidate has the exact same votes as the first
      if (results.length > 1 && results[0].voteCount === results[1].voteCount) {
        isTie = true;
        winner = null; // No clear leader
      } else {
        isTie = false;
        winner = results[0]; // Clear leader
      }
    }
    // --- TIE DETECTION LOGIC END ---

    res.json({
      success: true,
      election: {
        ...election,
        computedStatus: computeStatus(election),
      },
      results,
      totalVotes: votes.length,
      winner, // Will be null if it's a tie
      isTie,   // Send this flag to the frontend
    });
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
};

function computeStatus(election) {
  const now = new Date();
  if (election.status === "finalized") return "finalized";
  if (now < new Date(election.startTime)) return "pending";
  if (now >= new Date(election.startTime) && now <= new Date(election.endTime))
    return "active";
  return "ended";
}

module.exports = {
  getAllElections,
  getElection,
  createElection,
  addCandidate,
  getElectionResults,
};
