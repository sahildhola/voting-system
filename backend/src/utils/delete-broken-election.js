require("dotenv").config();
const mongoose = require("mongoose");
const Election = require("../models/Election.model");
const Vote = require("../models/Vote.model");

(async () => {
  await mongoose.connect(process.env.MONGODB_URI);
  const id = "69e96f5f87b250df4a3f81bb";
  const e = await Election.findById(id);
  if (!e) {
    console.log("Election not found (already deleted?)");
  } else {
    const votes = await Vote.deleteMany({ election: e._id });
    await e.deleteOne();
    console.log(`Deleted election "${e.title}" and ${votes.deletedCount} associated votes`);
  }
  await mongoose.disconnect();
})();
