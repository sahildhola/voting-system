const { expect } = require("chai");
const { ethers } = require("hardhat");
const { time } = require("@nomicfoundation/hardhat-toolbox/network-helpers");

describe("VotingSystem", function () {
  let votingSystem;
  let admin;
  let voter1;
  let voter2;
  let voter3;
  let startTime;
  let endTime;

  beforeEach(async function () {
    [admin, voter1, voter2, voter3] = await ethers.getSigners();

    const VotingSystem = await ethers.getContractFactory("VotingSystem");
    votingSystem = await VotingSystem.deploy();
    await votingSystem.waitForDeployment();

    startTime = (await time.latest()) + 60; // 1 minute from now
    endTime = startTime + 3600; // 1 hour after start
  });

  describe("Deployment", function () {
    it("Should set the correct admin", async function () {
      expect(await votingSystem.getAdmin()).to.equal(admin.address);
    });

    it("Should start with zero elections", async function () {
      expect(await votingSystem.getElectionCount()).to.equal(0);
    });
  });

  describe("Election Management", function () {
    it("Should create an election", async function () {
      await expect(
        votingSystem.createElection("Test Election", "Test Description", startTime, endTime)
      )
        .to.emit(votingSystem, "ElectionCreated")
        .withArgs(1, "Test Election", startTime, endTime);

      const election = await votingSystem.getElection(1);
      expect(election.title).to.equal("Test Election");
      expect(election.active).to.be.true;
    });

    it("Should not allow non-admin to create election", async function () {
      await expect(
        votingSystem
          .connect(voter1)
          .createElection("Test", "Test", startTime, endTime)
      ).to.be.revertedWith("Only admin can perform this action");
    });

    it("Should add candidates to election", async function () {
      await votingSystem.createElection("Election 1", "Desc", startTime, endTime);
      await expect(
        votingSystem.addCandidate(1, "Alice", "Party A", "hash1")
      )
        .to.emit(votingSystem, "CandidateAdded")
        .withArgs(1, 1, "Alice", "Party A");
    });
  });

  describe("Voting", function () {
    beforeEach(async function () {
      await votingSystem.createElection("Election 1", "Desc", startTime, endTime);
      await votingSystem.addCandidate(1, "Alice", "Party A", "hash1");
      await votingSystem.addCandidate(1, "Bob", "Party B", "hash2");
      await votingSystem.registerVoter(1, voter1.address);
      await votingSystem.registerVoter(1, voter2.address);

      // Fast forward time to after election start
      await time.increaseTo(startTime + 10);
    });

    it("Should allow registered voter to cast vote", async function () {
      await expect(votingSystem.connect(voter1).castVote(1, 1))
        .to.emit(votingSystem, "VoteCast")
        .withArgs(1, 1, voter1.address);

      const candidate = await votingSystem.getCandidate(1);
      expect(candidate.voteCount).to.equal(1);
    });

    it("Should not allow double voting", async function () {
      await votingSystem.connect(voter1).castVote(1, 1);
      await expect(
        votingSystem.connect(voter1).castVote(1, 2)
      ).to.be.revertedWith("Voter has already voted");
    });

    it("Should not allow unregistered voter to vote", async function () {
      await expect(
        votingSystem.connect(voter3).castVote(1, 1)
      ).to.be.revertedWith("Voter is not registered for this election");
    });
  });

  describe("Election Finalization", function () {
    it("Should finalize election and find winner", async function () {
      await votingSystem.createElection("Election 1", "Desc", startTime, endTime);
      await votingSystem.addCandidate(1, "Alice", "Party A", "hash1");
      await votingSystem.addCandidate(1, "Bob", "Party B", "hash2");
      await votingSystem.registerVoter(1, voter1.address);
      await votingSystem.registerVoter(1, voter2.address);
      await votingSystem.registerVoter(1, voter3.address);

      await time.increaseTo(startTime + 10);

      await votingSystem.connect(voter1).castVote(1, 1);
      await votingSystem.connect(voter2).castVote(1, 1);
      await votingSystem.connect(voter3).castVote(1, 2);

      await expect(votingSystem.finalizeElection(1))
        .to.emit(votingSystem, "ElectionFinalized")
        .withArgs(1, 1, "Alice");
    });
  });
});
