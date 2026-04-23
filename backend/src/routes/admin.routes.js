const express = require("express");
const router = express.Router();
const {
  getAllUsers,
  toggleUserStatus,
  finalizeElection,
  adminRegisterVoter,
  getDashboardStats,
} = require("../controllers/admin.controller");
const { protect, isAdmin } = require("../middleware/auth.middleware");

router.use(protect, isAdmin);

router.get("/dashboard", getDashboardStats);
router.get("/users", getAllUsers);
router.patch("/users/:id/toggle", toggleUserStatus);
router.post("/elections/:id/finalize", finalizeElection);
router.post("/register-voter", adminRegisterVoter);

module.exports = router;
