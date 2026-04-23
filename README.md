# ⛓ VoteChain — Blockchain Voting System

A full-stack decentralized voting application built with:

| Layer | Tech |
|---|---|
| Smart Contract | Solidity + Hardhat (local) |
| Backend | Node.js + Express + MongoDB Atlas |
| Frontend | React + ethers.js |
| Blockchain | Hardhat local node (port 8545) |

---

## 🗂 Project Structure

```
voting-blockchain/
├── blockchain/          ← Solidity contract + Hardhat config
│   ├── contracts/VotingSystem.sol
│   ├── scripts/deploy.js
│   └── test/VotingSystem.test.js
├── backend/             ← Express REST API
│   └── src/
│       ├── server.js
│       ├── models/      ← MongoDB schemas
│       ├── controllers/ ← Business logic
│       ├── routes/      ← API endpoints
│       └── utils/       ← blockchain.service.js
└── frontend/            ← React SPA
    └── src/
        ├── pages/       ← Full page components
        ├── components/  ← Reusable UI
        ├── context/     ← Auth state
        └── utils/       ← API client + helpers
```

---

## 🚀 Quick Start (4 Terminals)

### Terminal 1 — Hardhat Blockchain Node
```bash
cd blockchain
npm install
npx hardhat node
```
> Keep this running. Note the 20 test accounts printed — copy Account #0 private key.

---

### Terminal 2 — Deploy Smart Contract
```bash
cd blockchain
npm run deploy
```
> Copy the **CONTRACT_ADDRESS** printed in the output.

---

### Terminal 3 — Backend API
```bash
cd backend

# 1. Copy env file
cp .env.example .env

# 2. Edit .env — fill in:
#    MONGODB_URI = your MongoDB Atlas connection string
#    CONTRACT_ADDRESS = address from step above
#    ADMIN_PRIVATE_KEY = 0xac0974bec39a17e36ba4a6b4d238ff944bacb478cbed5efcae784d7bf4f2ff80

npm install
npm run seed     # Create admin user + sample elections
npm run dev      # Start API on port 5000
```

---

### Terminal 4 — React Frontend
```bash
cd frontend
npm install
npm start        # Opens http://localhost:3000
```

---

## 🔑 Default Credentials

| Role | Email | Password |
|---|---|---|
| Admin | admin@votechain.io | Admin@1234 |
| Voter | alice@example.com | Voter@1234 |
| Voter | bob@example.com | Voter@1234 |

### Hardhat Account #0 (Admin private key)
```
0xac0974bec39a17e36ba4a6b4d238ff944bacb478cbed5efcae784d7bf4f2ff80
```

---

## 📡 API Endpoints

### Auth
```
POST   /api/auth/register
POST   /api/auth/login
GET    /api/auth/profile
PUT    /api/auth/profile
```

### Elections
```
GET    /api/elections               List all elections
GET    /api/elections/:id           Get single election
GET    /api/elections/:id/results   Get results + vote counts
POST   /api/elections               Create election (admin)
POST   /api/elections/:id/candidates  Add candidate (admin)
```

### Votes
```
POST   /api/votes/register          Register for election
POST   /api/votes/cast              Cast vote (requires private key)
GET    /api/votes/history           My vote history
GET    /api/votes/status/:electionId  My status in an election
```

### Admin
```
GET    /api/admin/dashboard         Stats + recent activity
GET    /api/admin/users             All users
PATCH  /api/admin/users/:id/toggle  Enable/disable user
POST   /api/admin/elections/:id/finalize  Finalize election
POST   /api/admin/register-voter    Register voter (admin)
```

### Blockchain
```
GET    /api/blockchain/stats        Chain ID, block number, contract info
```

---

## ⛓ Smart Contract Functions

```solidity
// Admin
createElection(title, description, startTime, endTime)
addCandidate(electionId, name, party, imageHash)
registerVoter(electionId, voterAddress)
finalizeElection(electionId)
toggleElectionStatus(electionId)

// Voter
castVote(electionId, candidateId)

// View
getElection(electionId)
getAllElections()
getElectionCandidates(electionId)
getVoterStatus(electionId, voterAddress)
getBlockchainStats()
```

---

## 🔐 Security Model

- **One vote per wallet** — enforced by Solidity `require(!voter.hasVoted)`
- **Time-locked voting** — `block.timestamp` gates on-chain
- **Admin-only registration** — voters must be registered before voting
- **Double-vote prevention** — also enforced in MongoDB with compound unique index
- **Private key signing** — votes are signed by voter's wallet (never stored server-side)
- **JWT auth** — all API routes protected with 7-day tokens

---

## 🧪 Running Tests

```bash
cd blockchain
npx hardhat test
```

---

## 🏗 Architecture

```
Browser (React :3000)
    │ REST API
    ▼
Express Server (:5000)
    │── MongoDB Atlas (user/election/vote data)
    │── ethers.js
    ▼
Hardhat Node (:8545)
    └── VotingSystem.sol
```

---

## 📋 Environment Variables

```env
# Backend .env
PORT=5000
MONGODB_URI=mongodb+srv://...
JWT_SECRET=your_secret_here
BLOCKCHAIN_RPC_URL=http://127.0.0.1:8545
CONTRACT_ADDRESS=0x...           # From deploy script
ADMIN_PRIVATE_KEY=0x...          # Hardhat Account #0
FRONTEND_URL=http://localhost:3000
```
