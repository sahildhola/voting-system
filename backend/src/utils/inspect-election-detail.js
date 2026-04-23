require("dotenv").config();
const mongoose = require("mongoose");
const Election = require("../models/Election.model");
const User = require("../models/User.model");
const Vote = require("../models/Vote.model");

(async () => {
  await mongoose.connect(process.env.MONGODB_URI);
  const id = "69e96f5f87b250df4a3f81bb";
  const e = await Election.findById(id).lean();
  if (!e) {
    console.log("Not found");
    await mongoose.disconnect();
    return;
  }
  console.log("Election:", e.title, "| bcId:", e.blockchainId, "| status:", e.status);
  console.log("Start:", e.startTime, "End:", e.endTime, "Now:", new Date());
  console.log("Candidates:");
  e.candidates.forEach((c) => console.log(`  - bcId=${c.blockchainId}  ${c.name} (${c.party})`));
  console.log("Registered voters:");
  e.registeredVoters.forEach((v) => console.log(`  - user=${v.userId}  wallet=${v.walletAddress}  tx=${v.txHash}`));
  console.log("Vote docs:");
  const votes = await Vote.find({ election: e._id }).lean();
  votes.forEach((v) => console.log(`  - voter=${v.voter}  candBcId=${v.candidateBlockchainId}  tx=${v.txHash}`));
  await mongoose.disconnect();
})();
