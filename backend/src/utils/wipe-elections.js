require("dotenv").config();
const mongoose = require("mongoose");
const Election = require("../models/Election.model");
const Vote = require("../models/Vote.model");
const User = require("../models/User.model");

(async () => {
  await mongoose.connect(process.env.MONGODB_URI);
  const e = await Election.deleteMany({});
  const v = await Vote.deleteMany({});
  const u = await User.updateMany({}, { $set: { registeredElections: [] } });
  console.log(`Wiped: ${e.deletedCount} elections, ${v.deletedCount} votes, cleared registeredElections on ${u.modifiedCount} users`);
  await mongoose.disconnect();
})();
