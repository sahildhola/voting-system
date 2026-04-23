const mongoose = require("mongoose");

const candidateSchema = new mongoose.Schema({
  blockchainId: { type: Number, required: true },
  name: { type: String, required: true, trim: true },
  party: { type: String, required: true, trim: true },
  description: { type: String, trim: true },
  imageUrl: { type: String },
  voteCount: { type: Number, default: 0 },
});

const electionSchema = new mongoose.Schema(
  {
    blockchainId: {
      type: Number,
      unique: false, // Not unique because we may have multiple elections with same blockchainId (e.g. testnet vs mainnet)
      default: null,
    },
    title: {
      type: String,
      required: [true, "Election title is required"],
      trim: true,
      maxlength: [200, "Title cannot exceed 200 characters"],
    },
    description: {
      type: String,
      trim: true,
      maxlength: [1000, "Description cannot exceed 1000 characters"],
    },
    startTime: {
      type: Date,
      required: [true, "Start time is required"],
    },
    endTime: {
      type: Date,
      required: [true, "End time is required"],
    },
    candidates: [candidateSchema],
    status: {
      type: String,
      enum: ["pending", "active", "ended", "finalized"],
      default: "pending",
    },
    totalVotes: { type: Number, default: 0 },
    winnerId: { type: Number },
    winnerName: { type: String },
    txHash: { type: String }, // Transaction hash from blockchain
    createdBy: {
      type: mongoose.Schema.Types.ObjectId,
      ref: "User",
      required: true,
    },
    registeredVoters: [
      {
        userId: { type: mongoose.Schema.Types.ObjectId, ref: "User" },
        walletAddress: String,
        registeredAt: { type: Date, default: Date.now },
        txHash: String,
      },
    ],
  },
  {
    timestamps: true,
  }
);

// Virtual for voter count
electionSchema.virtual("voterCount").get(function () {
  return this.registeredVoters.length;
});

// Auto-update status based on time
electionSchema.methods.computeStatus = function () {
  const now = new Date();
  if (this.status === "finalized") return "finalized";
  if (now < this.startTime) return "pending";
  if (now >= this.startTime && now <= this.endTime) return "active";
  return "ended";
};

electionSchema.set("toJSON", { virtuals: true });

module.exports = mongoose.model("Election", electionSchema);
