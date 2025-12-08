const mongoose = require("mongoose")

const transactionSchema = new mongoose.Schema({
  type: { type: String, enum: ["earn", "transfer"], required: true },
  sender: { type: String, },
  receiver: { type: String, },
  amount: { type: Number, },
  date: { type: Date, default: Date.now },
  senderAddress: { type: String },
  receiverAddress: { type: String },

});

const Transaction = mongoose.model("transactions", transactionSchema);

module.exports = Transaction;