const mongoose = require('mongoose');

const chatScheme = new mongoose.Schema(
  {
    jid: {
      type: String,
      required: true
    },
    msg: {
      type: String,
      required: true
    }
  },
  {
    strict: true,
    versionKey: false,
    timestamps: { createdAt: "createdAt", updatedAt: "updatedAt" },
  });
module.exports = mongoose.model("Chat", chatScheme);
