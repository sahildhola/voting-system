require("dotenv").config();
const mongoose = require("mongoose");
const User = require("../models/User.model");

(async () => {
  await mongoose.connect(process.env.MONGODB_URI);
  const u = await User.findOne({ walletAddress: /0x1c1608fe74a2559a5352f9704ebd5b19d699bcd8/i }).lean();
  if (!u) {
    console.log("No user with that wallet");
  } else {
    console.log("User:", u.name, "|", u.email);
    console.log("walletAddress:", u.walletAddress);
    console.log("Has privateKey field?", !!u.privateKey);
    console.log("All keys:", Object.keys(u));
  }
  await mongoose.disconnect();
})();
