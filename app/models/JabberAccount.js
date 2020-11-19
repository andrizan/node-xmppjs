const mongoose = require('mongoose');

const Scheme = new mongoose.Schema(
  {
    jid: {
      type: String,
      required: true,
      trim: true,
    },
    username: {
      type: String,
      required: true,
      trim: true,
    },
    password: {
      type: String,
      required: true,
      trim: true,
    },
    host: {
      type: String,
      required: true,
      trim: true,
    },
    port: {
      type: Number,
      required: true,
      trim: true,
    },
    status: {
      type: String,
      required: true,
      trim: true,
      enum: [
        'active',
        'nonactive'
      ],
      default: 'nonactive',
    }
  },
  {
    strict: true,
    versionKey: false,
    timestamps: { createdAt: "createdAt", updatedAt: "updatedAt" },
  });
module.exports = mongoose.model("jabber_account", Scheme);
