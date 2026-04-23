const { ethers } = require("ethers");
const fs = require("fs");
const path = require("path");

let provider;
let adminWallet;
let contract;
let contractABI;
let contractAddress;

/**
 * Initialize the blockchain connection
 */
async function initBlockchain() {
  try {
    // Load deployment info
    const deploymentPath = path.join(__dirname, "deployment.json");

    if (!fs.existsSync(deploymentPath)) {
      console.warn(
        "⚠️  deployment.json not found. Run deploy script first."
      );
      return false;
    }

    const deployment = JSON.parse(fs.readFileSync(deploymentPath, "utf8"));
    contractABI = deployment.abi;
    contractAddress =
      process.env.CONTRACT_ADDRESS || deployment.contractAddress;

    // Connect to local Hardhat node
    provider = new ethers.JsonRpcProvider(
      process.env.BLOCKCHAIN_RPC_URL || "http://127.0.0.1:8545"
    );

    // Admin wallet from private key
    const adminPrivateKey = process.env.ADMIN_PRIVATE_KEY;
    if (!adminPrivateKey) {
      console.warn("⚠️  ADMIN_PRIVATE_KEY not set in .env");
      return false;
    }

    const baseWallet = new ethers.Wallet(adminPrivateKey, provider);
    // NonceManager queues nonces locally so back-to-back contract calls don't race.
    adminWallet = new ethers.NonceManager(baseWallet);
    contract = new ethers.Contract(contractAddress, contractABI, adminWallet);

    // Verify connection
    const network = await provider.getNetwork();
    console.log(
      `✅ Blockchain connected - Chain ID: ${network.chainId}, Contract: ${contractAddress}`
    );
    return true;
  } catch (error) {
    console.error("❌ Blockchain initialization failed:", error.message);
    return false;
  }
}

/**
 * Get contract instance for a specific signer
 */
function getContractForSigner(signerPrivateKey) {
  if (!provider || !contractABI || !contractAddress) {
    throw new Error("Blockchain not initialized");
  }
  const signer = new ethers.Wallet(signerPrivateKey, provider);
  return new ethers.Contract(contractAddress, contractABI, signer);
}

/**
 * Create a new election on the blockchain
 */
async function createElectionOnChain(title, description, startTime, endTime) {
  if (!contract) throw new Error("Blockchain not initialized");

  const startTimestamp = Math.floor(new Date(startTime).getTime() / 1000);
  const endTimestamp = Math.floor(new Date(endTime).getTime() / 1000);

  const tx = await contract.createElection(
    title,
    description,
    startTimestamp,
    endTimestamp
  );
  const receipt = await tx.wait();

  // Extract election ID from event (named access — positional is flaky with multiple indexed args)
  const event = receipt.logs
    .map((log) => {
      try {
        return contract.interface.parseLog(log);
      } catch {
        return null;
      }
    })
    .find((e) => e && e.name === "ElectionCreated");

  const electionId = event ? Number(event.args.electionId) : null;
  if (electionId == null) throw new Error("Could not parse ElectionCreated event");

  return {
    txHash: receipt.hash,
    blockNumber: receipt.blockNumber,
    electionId,
    gasUsed: receipt.gasUsed.toString(),
  };
}

/**
 * Add a candidate to an election on the blockchain
 */
async function addCandidateOnChain(electionId, name, party, imageHash = "") {
  if (!contract) throw new Error("Blockchain not initialized");

  const tx = await contract.addCandidate(electionId, name, party, imageHash);
  const receipt = await tx.wait();

  const event = receipt.logs
    .map((log) => {
      try {
        return contract.interface.parseLog(log);
      } catch {
        return null;
      }
    })
    .find((e) => e && e.name === "CandidateAdded");

  const candidateId = event ? Number(event.args.candidateId) : null;
  if (candidateId == null) throw new Error("Could not parse CandidateAdded event");

  return {
    txHash: receipt.hash,
    blockNumber: receipt.blockNumber,
    candidateId,
  };
}

/**
 * Register a voter on the blockchain
 */
async function registerVoterOnChain(electionId, voterAddress) {
  if (!contract) throw new Error("Blockchain not initialized");

  const tx = await contract.registerVoter(electionId, voterAddress);
  const receipt = await tx.wait();

  return {
    txHash: receipt.hash,
    blockNumber: receipt.blockNumber,
    gasUsed: receipt.gasUsed.toString(),
  };
}

/**
 * Cast a vote on the blockchain (using voter's wallet)
 */
async function castVoteOnChain(electionId, candidateId, voterPrivateKey) {
  if (!provider || !contractABI || !contractAddress) {
    throw new Error("Blockchain not initialized");
  }

  const voterContract = getContractForSigner(voterPrivateKey);
  const tx = await voterContract.castVote(electionId, candidateId);
  const receipt = await tx.wait();

  return {
    txHash: receipt.hash,
    blockNumber: receipt.blockNumber,
    gasUsed: receipt.gasUsed.toString(),
  };
}

/**
 * Cast vote using admin wallet (simulating voter - for demo without MetaMask)
 */
async function castVoteAsAdmin(electionId, candidateId, voterAddress) {
  if (!contract) throw new Error("Blockchain not initialized");

  // NOTE: In production, voter must sign their own transaction
  // This is for demo purposes only
  const tx = await contract.castVote(electionId, candidateId, {
    from: voterAddress,
  });
  const receipt = await tx.wait();

  return {
    txHash: receipt.hash,
    blockNumber: receipt.blockNumber,
    gasUsed: receipt.gasUsed.toString(),
  };
}

/**
 * Get election data from blockchain
 */
async function getElectionFromChain(electionId) {
  if (!contract) throw new Error("Blockchain not initialized");
  return await contract.getElection(electionId);
}

/**
 * Get all elections from blockchain
 */
async function getAllElectionsFromChain() {
  if (!contract) throw new Error("Blockchain not initialized");
  return await contract.getAllElections();
}

/**
 * Get election candidates from blockchain
 */
async function getElectionCandidatesFromChain(electionId) {
  if (!contract) throw new Error("Blockchain not initialized");
  return await contract.getElectionCandidates(electionId);
}

/**
 * Get voter status from blockchain
 */
async function getVoterStatusFromChain(electionId, voterAddress) {
  if (!contract) throw new Error("Blockchain not initialized");
  const [isRegistered, hasVoted, votedCandidateId] =
    await contract.getVoterStatus(electionId, voterAddress);
  return { isRegistered, hasVoted, votedCandidateId: Number(votedCandidateId) };
}

/**
 * Finalize election on the blockchain
 */
async function finalizeElectionOnChain(electionId) {
  if (!contract) throw new Error("Blockchain not initialized");

  const tx = await contract.finalizeElection(electionId);
  const receipt = await tx.wait();

  const event = receipt.logs
    .map((log) => {
      try {
        return contract.interface.parseLog(log);
      } catch {
        return null;
      }
    })
    .find((e) => e && e.name === "ElectionFinalized");

  const winnerId = event ? Number(event.args.winnerId) : null;
  const winnerName = event ? event.args.winnerName : null;

  return {
    txHash: receipt.hash,
    blockNumber: receipt.blockNumber,
    winnerId,
    winnerName,
  };
}

/**
 * Get blockchain stats
 */
async function getBlockchainStats() {
  if (!provider || !contract) return null;

  const [network, blockNumber, electionCount, candidateCount] =
    await Promise.all([
      provider.getNetwork(),
      provider.getBlockNumber(),
      contract.getElectionCount(),
      contract.getCandidateCount(),
    ]);

  return {
    chainId: Number(network.chainId),
    blockNumber,
    contractAddress,
    electionCount: Number(electionCount),
    candidateCount: Number(candidateCount),
    rpcUrl: process.env.BLOCKCHAIN_RPC_URL,
  };
}

/**
 * Create a new wallet (for voter)
 */
function createWallet() {
  const wallet = ethers.Wallet.createRandom();
  return {
    address: wallet.address,
    privateKey: wallet.privateKey,
    mnemonic: wallet.mnemonic?.phrase,
  };
}

/**
 * Send ETH from admin to voter (for gas fees in local testing)
 */
async function fundWallet(toAddress, amountEth = "1.0") {
  if (!adminWallet) throw new Error("Admin wallet not initialized");

  const tx = await adminWallet.sendTransaction({
    to: toAddress,
    value: ethers.parseEther(amountEth),
  });
  await tx.wait();
  return tx.hash;
}

module.exports = {
  initBlockchain,
  createElectionOnChain,
  addCandidateOnChain,
  registerVoterOnChain,
  castVoteOnChain,
  castVoteAsAdmin,
  getElectionFromChain,
  getAllElectionsFromChain,
  getElectionCandidatesFromChain,
  getVoterStatusFromChain,
  finalizeElectionOnChain,
  getBlockchainStats,
  createWallet,
  fundWallet,
  getContractForSigner,
};
