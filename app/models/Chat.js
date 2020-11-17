const mongoose = require('mongoose');

const chatScheme = new mongoose.Schema({
  jid: {
    type: String,
    required: true
  },
  msg: {
    type: String,
    required: true
  }
});
module.exports = mongoose.model("Chat", chatScheme);
