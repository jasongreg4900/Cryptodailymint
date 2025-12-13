const mongoose = require("mongoose")

const depositSchema = new mongoose.Schema({
  username: String,
  amount: Number,
  imageUrl: String,
  status: { type: String, enum: ["pending", "approved", "rejected"], default: "pending" },
  date: { type: Date, default: Date.now }
});

const Deposit = mongoose.model("Deposit", depositSchema);

module.exports = Deposit
