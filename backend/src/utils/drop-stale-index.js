require("dotenv").config();
const mongoose = require("mongoose");

(async () => {
  await mongoose.connect(process.env.MONGODB_URI);
  const coll = mongoose.connection.db.collection("elections");
  const before = await coll.indexes();
  console.log("Indexes before:", before.map((i) => i.name));
  try {
    await coll.dropIndex("blockchainId_1");
    console.log("✅ Dropped blockchainId_1");
  } catch (e) {
    console.log("ℹ️ blockchainId_1 not present:", e.message);
  }
  const after = await coll.indexes();
  console.log("Indexes after:", after.map((i) => i.name));
  await mongoose.disconnect();
})();
