const mongoose = require("mongoose");
const { Schema } = mongoose;
const bcrypt = require("bcrypt");

const userSchema = new Schema({
  username: {
    type: String,
    required: true,
    minlength: 3,
    maxlength: 30,
  },
  email: {
    type: String,
    required: true,
    minlength: 5,
    maxlength: 50,
  },
  password: {
    type: String,
    required: true,
    minlength: 5,
    maxlength: 255,
  },
  role: {
    type: String,
    enum: ["member", "admin"],
    default: "member",
  },
  photo: {
    type: String,
    default: "https://i.imgur.com/PfH7vb3.png",
  },
  date: {
    type: Date,
    default: Date.now,
  },
  about: {
    type: String,
  },
  bg: {
    type: String,
  },
});

//instance methods
userSchema.methods.isMember = function () {
  return this.role == "member" || this.role == "admin";
};
userSchema.methods.isAdmin = function () {
  return this.role == "admin";
};

//** */
userSchema.methods.comparePassword = async function (password, cb) {
  let result;
  try {
    result = await bcrypt.compare(password, this.password);
    return cb(null, result);
  } catch (e) {
    return cb(e, result);
  }
};
//** */

//mongoose middlewares
userSchema.pre("save", async function (next) {
  //this is mongoDB document
  //isNew 新密碼    //isModified 編輯密碼
  if (this.isNew || this.isModified("password")) {
    const hashValue = await bcrypt.hash(this.password, 10);
    this.password = hashValue;
  }
  next();
});

module.exports = mongoose.model("User", userSchema);
