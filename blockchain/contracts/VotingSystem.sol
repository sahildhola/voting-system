// SPDX-License-Identifier: MIT
pragma solidity ^0.8.24;

/**
 * @title VotingSystem
 * @dev A decentralized voting system with election management
 */
contract VotingSystem {
    // ─── Structs ──────────────────────────────────────────────────────────────
    struct Candidate {
        uint256 id;
        string name;
        string party;
        string imageHash; // IPFS hash or description
        uint256 voteCount;
        bool active;
    }

    struct Election {
        uint256 id;
        string title;
        string description;
        uint256 startTime;
        uint256 endTime;
        bool active;
        bool finalized;
        uint256 totalVotes;
        uint256[] candidateIds;
    }

    struct Voter {
        bool isRegistered;
        bool hasVoted;
        uint256 votedCandidateId;
        uint256 votedElectionId;
        uint256 registrationTime;
    }

    // ─── State Variables ──────────────────────────────────────────────────────
    address public admin;
    uint256 private electionCounter;
    uint256 private candidateCounter;

    mapping(uint256 => Election) public elections;
    mapping(uint256 => Candidate) public candidates;
    // electionId => voterAddress => Voter
    mapping(uint256 => mapping(address => Voter)) public voters;
    // Track all election IDs
    uint256[] public electionIds;

    // ─── Events ───────────────────────────────────────────────────────────────
    event ElectionCreated(uint256 indexed electionId, string title, uint256 startTime, uint256 endTime);
    event CandidateAdded(uint256 indexed electionId, uint256 indexed candidateId, string name, string party);
    event VoterRegistered(uint256 indexed electionId, address indexed voter);
    event VoteCast(uint256 indexed electionId, uint256 indexed candidateId, address indexed voter);
    event ElectionFinalized(uint256 indexed electionId, uint256 winnerId, string winnerName);
    event ElectionStatusChanged(uint256 indexed electionId, bool active);

    // ─── Modifiers ────────────────────────────────────────────────────────────
    modifier onlyAdmin() {
        require(msg.sender == admin, "Only admin can perform this action");
        _;
    }

    modifier electionExists(uint256 _electionId) {
        require(_electionId > 0 && _electionId <= electionCounter, "Election does not exist");
        _;
    }

    modifier electionActive(uint256 _electionId) {
        require(elections[_electionId].active, "Election is not active");
        require(block.timestamp >= elections[_electionId].startTime, "Election has not started yet");
        require(block.timestamp <= elections[_electionId].endTime, "Election has ended");
        _;
    }

    // ─── Constructor ──────────────────────────────────────────────────────────
    constructor() {
        admin = msg.sender;
        electionCounter = 0;
        candidateCounter = 0;
    }

    // ─── Admin Functions ──────────────────────────────────────────────────────

    /**
     * @dev Create a new election
     */
    function createElection(
        string memory _title,
        string memory _description,
        uint256 _startTime,
        uint256 _endTime
    ) external onlyAdmin returns (uint256) {
        require(_startTime < _endTime, "Start time must be before end time");
        require(_endTime > block.timestamp, "End time must be in the future");

        electionCounter++;
        uint256 electionId = electionCounter;

        elections[electionId] = Election({
            id: electionId,
            title: _title,
            description: _description,
            startTime: _startTime,
            endTime: _endTime,
            active: true,
            finalized: false,
            totalVotes: 0,
            candidateIds: new uint256[](0)
        });

        electionIds.push(electionId);

        emit ElectionCreated(electionId, _title, _startTime, _endTime);
        return electionId;
    }

    /**
     * @dev Add a candidate to an election
     */
    function addCandidate(
        uint256 _electionId,
        string memory _name,
        string memory _party,
        string memory _imageHash
    ) external onlyAdmin electionExists(_electionId) returns (uint256) {
        require(!elections[_electionId].finalized, "Election is finalized");

        candidateCounter++;
        uint256 candidateId = candidateCounter;

        candidates[candidateId] = Candidate({
            id: candidateId,
            name: _name,
            party: _party,
            imageHash: _imageHash,
            voteCount: 0,
            active: true
        });

        elections[_electionId].candidateIds.push(candidateId);

        emit CandidateAdded(_electionId, candidateId, _name, _party);
        return candidateId;
    }

    /**
     * @dev Register a voter for an election
     */
    function registerVoter(uint256 _electionId, address _voterAddress)
        external
        onlyAdmin
        electionExists(_electionId)
    {
        require(!voters[_electionId][_voterAddress].isRegistered, "Voter already registered");
        require(!elections[_electionId].finalized, "Election is finalized");

        voters[_electionId][_voterAddress] = Voter({
            isRegistered: true,
            hasVoted: false,
            votedCandidateId: 0,
            votedElectionId: _electionId,
            registrationTime: block.timestamp
        });

        emit VoterRegistered(_electionId, _voterAddress);
    }

    /**
     * @dev Toggle election active status
     */
    function toggleElectionStatus(uint256 _electionId)
        external
        onlyAdmin
        electionExists(_electionId)
    {
        elections[_electionId].active = !elections[_electionId].active;
        emit ElectionStatusChanged(_electionId, elections[_electionId].active);
    }

    /**
     * @dev Finalize election and declare winner
     */
    function finalizeElection(uint256 _electionId)
        external
        onlyAdmin
        electionExists(_electionId)
        returns (uint256 winnerId, string memory winnerName)
    {
        require(!elections[_electionId].finalized, "Election already finalized");

        elections[_electionId].finalized = true;
        elections[_electionId].active = false;

        uint256[] memory candIds = elections[_electionId].candidateIds;
        uint256 maxVotes = 0;
        uint256 winnerCandidateId = 0;

        for (uint256 i = 0; i < candIds.length; i++) {
            if (candidates[candIds[i]].voteCount > maxVotes) {
                maxVotes = candidates[candIds[i]].voteCount;
                winnerCandidateId = candIds[i];
            }
        }

        winnerId = winnerCandidateId;
        winnerName = winnerCandidateId > 0 ? candidates[winnerCandidateId].name : "No winner";

        emit ElectionFinalized(_electionId, winnerId, winnerName);
        return (winnerId, winnerName);
    }

    // ─── Voter Functions ──────────────────────────────────────────────────────

    /**
     * @dev Cast a vote
     */
    function castVote(uint256 _electionId, uint256 _candidateId)
        external
        electionExists(_electionId)
        electionActive(_electionId)
    {
        Voter storage voter = voters[_electionId][msg.sender];
        require(voter.isRegistered, "Voter is not registered for this election");
        require(!voter.hasVoted, "Voter has already voted");

        // Check candidate belongs to this election
        bool candidateValid = false;
        uint256[] memory candIds = elections[_electionId].candidateIds;
        for (uint256 i = 0; i < candIds.length; i++) {
            if (candIds[i] == _candidateId) {
                candidateValid = true;
                break;
            }
        }
        require(candidateValid, "Candidate does not belong to this election");
        require(candidates[_candidateId].active, "Candidate is not active");

        voter.hasVoted = true;
        voter.votedCandidateId = _candidateId;

        candidates[_candidateId].voteCount++;
        elections[_electionId].totalVotes++;

        emit VoteCast(_electionId, _candidateId, msg.sender);
    }

    // ─── View Functions ───────────────────────────────────────────────────────

    function getElection(uint256 _electionId)
        external
        view
        electionExists(_electionId)
        returns (Election memory)
    {
        return elections[_electionId];
    }

    function getAllElections() external view returns (Election[] memory) {
        Election[] memory allElections = new Election[](electionIds.length);
        for (uint256 i = 0; i < electionIds.length; i++) {
            allElections[i] = elections[electionIds[i]];
        }
        return allElections;
    }

    function getElectionCandidates(uint256 _electionId)
        external
        view
        electionExists(_electionId)
        returns (Candidate[] memory)
    {
        uint256[] memory candIds = elections[_electionId].candidateIds;
        Candidate[] memory electionCandidates = new Candidate[](candIds.length);
        for (uint256 i = 0; i < candIds.length; i++) {
            electionCandidates[i] = candidates[candIds[i]];
        }
        return electionCandidates;
    }

    function getVoterStatus(uint256 _electionId, address _voterAddress)
        external
        view
        returns (bool isRegistered, bool hasVoted, uint256 votedCandidateId)
    {
        Voter storage voter = voters[_electionId][_voterAddress];
        return (voter.isRegistered, voter.hasVoted, voter.votedCandidateId);
    }

    function getCandidate(uint256 _candidateId)
        external
        view
        returns (Candidate memory)
    {
        require(_candidateId > 0 && _candidateId <= candidateCounter, "Candidate does not exist");
        return candidates[_candidateId];
    }

    function getAdmin() external view returns (address) {
        return admin;
    }

    function getElectionCount() external view returns (uint256) {
        return electionCounter;
    }

    function getCandidateCount() external view returns (uint256) {
        return candidateCounter;
    }
}
