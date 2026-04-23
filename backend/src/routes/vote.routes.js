const express = require("express");
const router = express.Router();
const {
  registerForElection,
  castVote,
  getVoterStatus,
  getVoteHistory,
} = require("../controllers/vote.controller");
const { protect } = require("../middleware/auth.middleware");

router.post("/register", protect, registerForElection);
router.post("/cast", protect, castVote);
router.get("/history", protect, getVoteHistory);
router.get("/status/:electionId", protect, getVoterStatus);

module.exports = router;
