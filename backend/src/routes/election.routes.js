const express = require("express");
const router = express.Router();
const {
  getAllElections,
  getElection,
  createElection,
  addCandidate,
  getElectionResults,
} = require("../controllers/election.controller");
const { protect, isAdmin } = require("../middleware/auth.middleware");

router.get("/", getAllElections);
router.get("/:id/results", getElectionResults);
router.get("/:id", protect, getElection);
router.post("/", protect, isAdmin, createElection);
router.post("/:id/candidates", protect, isAdmin, addCandidate);

module.exports = router;
