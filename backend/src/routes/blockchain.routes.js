const express = require("express");
const router = express.Router();
const { getBlockchainStats } = require("../utils/blockchain.service");

router.get("/stats", async (req, res) => {
  try {
    const stats = await getBlockchainStats();
    res.json({ success: true, stats });
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});

module.exports = router;
