const mongoose = require("mongoose");

const MessageSchema = new mongoose.Schema({
  username: { type: String, required: true, trim: true },
  message: { type: String, required: true, trim: true },
  createdAt: { type: Date, default: Date.now }
});

const Message = mongoose.model("Message", MessageSchema);


module.exports = Message