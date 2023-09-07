const mongoose = require("mongoose");
const { Schema } = mongoose;

const postSchema = new Schema({
  author: {
    type: mongoose.Schema.Types.ObjectId,
    ref: "User",
  },
  content: {
    type: String,
    required: true,
    maxlength: 1024,
  },
  image: {
    type: String,
  },
  like: {
    type: [String],
    default: [],
  },
  date: {
    type: Date,
    default: Date.now,
  },
  reply: [
    {
      user: {
        type: mongoose.Schema.Types.ObjectId,
        ref: "User",
      },
      content: {
        type: String,
        required: true,
        maxlength: 1024,
      },
      date: {
        type: Date,
        default: Date.now,
      },
      like: {
        type: [String],
        default: [],
      },
    },
  ],
});

module.exports = mongoose.model("Post", postSchema);
