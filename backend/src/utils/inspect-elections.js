require("dotenv").config();
const mongoose = require("mongoose");
const Election = require("../models/Election.model");

(async () => {
  await mongoose.connect(process.env.MONGODB_URI);
  const elections = await Election.find().lean();
  for (const e of elections) {
    const ids = (e.candidates || []).map((c) => c.blockchainId);
    const dup = ids.length !== new Set(ids).size;
    console.log(
      `• ${e._id}  bcId=${e.blockchainId}  "${e.title}"  candidateIds=[${ids.join(",")}]  duplicates=${dup}`
    );
  }
  await mongoose.disconnect();
})();
