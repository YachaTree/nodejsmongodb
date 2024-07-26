const mongoose = require("mongoose");
const Schema = mongoose.Schema;

const chatSchema = new Schema(
  {
    message: {
      type: String,
      required: true,
    },
    sender: {
      type: String,
      required: true,
    },
    roomId: {
      type: mongoose.Schema.Types.ObjectId,
      ref: "chatrooms",
      required: true,
    },
  },
  {
    timestamps: true,
  }
);

let Chat = mongoose.model("thechats", chatSchema);

module.exports = Chat;
