const mongoose = require("mongoose");

const voteSchema = new mongoose.Schema(
  {
    election: {
      type: mongoose.Schema.Types.ObjectId,
      ref: "Election",
      required: true,
    },
    electionBlockchainId: {
      type: Number,
      required: false,
    },
    voter: {
      type: mongoose.Schema.Types.ObjectId,
      ref: "User",
      required: true,
    },
    voterWalletAddress: {
      type: String,
      required: true,
      lowercase: true,
    },
    candidateBlockchainId: {
      type: Number,
      required: true,
    },
    candidateName: {
      type: String,
      required: true,
    },
    txHash: {
      type: String,
      required: true,
      unique: true,
    },
    blockNumber: {
      type: Number,
    },
    gasUsed: {
      type: String,
    },
    timestamp: {
      type: Date,
      default: Date.now,
    },
  },
  {
    timestamps: true,
  }
);

// Compound index: one vote per voter per election
voteSchema.index({ election: 1, voter: 1 }, { unique: true });
voteSchema.index({ txHash: 1 }, { unique: true });

module.exports = mongoose.model("Vote", voteSchema);
