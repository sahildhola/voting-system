require("dotenv").config();
const mongoose = require("mongoose");
const User = require("../models/User.model");
const Election = require("../models/Election.model");

const seed = async () => {
  await mongoose.connect(process.env.MONGODB_URI);
  console.log("✅ Connected to MongoDB");

  // Clear existing data
  await User.deleteMany({});
  await Election.deleteMany({});
  console.log("🗑️  Cleared existing data");

  // Create admin user
  const admin = await User.create({
    name: "System Admin",
    email: "admin@votechain.io",
    password: "Admin@1234",
    role: "admin",
    walletAddress: "0xf39Fd6e51aad88F6F4ce6aB8827279cffFb92266", // Hardhat account #0
  });
  console.log("👤 Admin created:", admin.email);

  // Create sample voters
  const voters = await User.insertMany([
    {
      name: "Alice Johnson",
      email: "alice@example.com",
      password: "Voter@1234",
      walletAddress: "0x70997970C51812dc3A010C7d01b50e0d17dc79C8",
      nationalId: "ID001",
    },
    {
      name: "Bob Smith",
      email: "bob@example.com",
      password: "Voter@1234",
      walletAddress: "0x3C44CdDdB6a900fa2b585dd299e03d12FA4293BC",
      nationalId: "ID002",
    },
  ]);
  console.log(`👥 ${voters.length} voters created`);

  // Create one running election
  const now = new Date();
  const elections = await Election.insertMany([
    {
      blockchainId: null, // Will be set after deploy
      title: "2024 City Council Election",
      description: "Vote for your city council representative for the 2024 term.",
      startTime: new Date(now.getTime() - 60 * 60 * 1000), // Started 1hr ago
      endTime: new Date(now.getTime() + 24 * 60 * 60 * 1000), // Ends in 24hrs
      createdBy: admin._id,
      candidates: [
        { blockchainId: 1, name: "Sarah Connor", party: "Progressive Party", description: "Focused on sustainable development", voteCount: 0 },
        { blockchainId: 2, name: "James Wilson", party: "Conservative Alliance", description: "Building a stronger economy", voteCount: 0 },
        { blockchainId: 3, name: "Maria Garcia", party: "Green Future", description: "Championing environmental policy", voteCount: 0 },
      ],
    },
  ]);
  console.log(`🗳️  ${elections.length} election created`);

  console.log("\n✅ Seed complete!");
  console.log("━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━");
  console.log("Admin login: admin@votechain.io / Admin@1234");
  console.log("Voter login: alice@example.com / Voter@1234");
  console.log("━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━");
  process.exit(0);
};

seed().catch((err) => {
  console.error("Seed failed:", err);
  process.exit(1);
});
