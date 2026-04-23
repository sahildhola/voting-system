const { ethers } = require("hardhat");
const fs = require("fs");
const path = require("path");

async function main() {
  console.log("🚀 Deploying VotingSystem contract...\n");

  const [deployer] = await ethers.getSigners();
  console.log("📝 Deploying with account:", deployer.address);
  console.log(
    "💰 Account balance:",
    ethers.formatEther(await ethers.provider.getBalance(deployer.address)),
    "ETH\n"
  );

  // Deploy the contract
  const VotingSystem = await ethers.getContractFactory("VotingSystem");
  const votingSystem = await VotingSystem.deploy();
  await votingSystem.waitForDeployment();

  const contractAddress = await votingSystem.getAddress();
  console.log("✅ VotingSystem deployed to:", contractAddress);
  console.log("🔑 Admin address:", deployer.address);

  // Save deployment info to a JSON file for the backend
  const deploymentInfo = {
    contractAddress,
    adminAddress: deployer.address,
    network: "localhost",
    chainId: 31337,
    deployedAt: new Date().toISOString(),
    abi: JSON.parse(
      fs.readFileSync(
        path.join(
          __dirname,
          "../artifacts/contracts/VotingSystem.sol/VotingSystem.json"
        )
      )
    ).abi,
  };

  // Save to blockchain directory
  const deploymentPath = path.join(__dirname, "../deployment.json");
  fs.writeFileSync(deploymentPath, JSON.stringify(deploymentInfo, null, 2));
  console.log("\n📄 Deployment info saved to:", deploymentPath);

  // Also save to backend directory if it exists
  const backendDeployPath = path.join(
    __dirname,
    "../../backend/src/utils/deployment.json"
  );
  if (fs.existsSync(path.dirname(backendDeployPath))) {
    fs.writeFileSync(backendDeployPath, JSON.stringify(deploymentInfo, null, 2));
    console.log("📄 Deployment info also saved to backend:", backendDeployPath);
  }

  // Also save to frontend directory if it exists
  const frontendDeployPath = path.join(
    __dirname,
    "../../frontend/src/utils/deployment.json"
  );
  if (fs.existsSync(path.dirname(frontendDeployPath))) {
    fs.writeFileSync(
      frontendDeployPath,
      JSON.stringify(deploymentInfo, null, 2)
    );
    console.log(
      "📄 Deployment info also saved to frontend:",
      frontendDeployPath
    );
  }

  console.log("\n🎉 Deployment complete!");
  console.log("━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━");
  console.log("Contract Address:", contractAddress);
  console.log("Network: Hardhat Local (http://127.0.0.1:8545)");
  console.log("Chain ID: 31337");
  console.log("━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━");
  console.log(
    "\n📋 Next steps:"
  );
  console.log(
    "1. Copy the contract address to your backend .env: CONTRACT_ADDRESS=" +
      contractAddress
  );
  console.log(
    "2. Copy the admin private key to your backend .env (first Hardhat account)"
  );
  console.log("3. Start the backend: cd backend && npm run dev");
  console.log("4. Start the frontend: cd frontend && npm start");
}

main()
  .then(() => process.exit(0))
  .catch((error) => {
    console.error("❌ Deployment failed:", error);
    process.exit(1);
  });
