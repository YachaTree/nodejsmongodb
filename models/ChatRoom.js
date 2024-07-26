const mongoose = require("mongoose");
const Schema = mongoose.Schema;

const chatRoomSchema = new Schema(
  {
    name: {
      type: String,
      required: true,
    },
    members: [
      {
        type: String,
        required: true,
      },
    ],
    createdAt: {
      type: Date,
      default: Date.now,
    },
  },
  {
    timestamps: true,
  }
);

module.exports = mongoose.model("chatrooms", chatRoomSchema);
