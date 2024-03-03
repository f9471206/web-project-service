const router = require("express").Router();
const registerValidation = require("../validation").registerValidation;
const loginValidation = require("../validation").loginValidation;
const User = require("../models").userModel;
const PostModel = require("../models").postModel;
const jwt = require("jsonwebtoken");
const { use } = require("passport");

router.use((req, res, next) => {
  console.log("A requsert is coming in to auth.js");
  next();
});

router.get("/testApi", (req, res) => {
  res.send("success auth Router");
});

//註冊
router.post("/register", async (req, res) => {
  // console.log(registerValidation(req.body).error.details[0].message);
  //確認輸入資料是否符合規範 (Joi)
  let { error } = registerValidation(req.body);
  if (error) return res.status(400).send(error.details[0].message);

  const emailExist = await User.findOne({ email: req.body.email });
  if (emailExist) return res.status(400).send("信箱已被註冊");

  let { username, email, password } = req.body;
  let newUser = new User({ username, email, password });
  try {
    let savedUser = await newUser.save();
    return res.send({
      mag: "完成註冊",
      savedUser,
    });
  } catch (e) {
    return res.status(500).send("無法儲存");
  }
});

//登入
router.post("/login", async (req, res) => {
  let { error } = loginValidation(req.body);
  const foundUser = await User.findOne({ email: req.body.email });
  if (!foundUser) {
    return res.status(401).send("帳號或密碼錯誤");
  }
  foundUser.comparePassword(req.body.password, (err, isMath) => {
    if (err) {
      //使用 user-medel.js 的 comparePassword (err , isMath)=> cb()
      return res.status(400).send(err);
    }
    if (isMath) {
      //if isMath == turn   mk jwtobject
      let jwtObject = { _id: foundUser._id, email: foundUser.email };
      let token = jwt.sign(jwtObject, process.env.PASSPORT_SECRET);
      return res.send({
        message: "success",
        token: "JWT " + token,
        user: foundUser,
      });
    } else {
      return res.status(401).send("帳號或密碼錯誤");
    }
  });
});

//取得帳號個人資料
router.get("/:_id", async (req, res) => {
  let { _id } = req.params;
  try {
    let foundUser = await User.findOne(
      { _id },
      {
        date: true,
        email: true,
        photo: true,
        username: true,
        about: true,
        bg: true,
      }
    );
    res.send(foundUser);
  } catch (err) {
    console.log(err);
    res.status(401).send("查無用戶");
  }
});

//取得帳號發文紀錄
router.get("/tweet/:_id", async (req, res) => {
  let { _id } = req.params;
  let { count } = req.query;
  let skip = count * 5;
  try {
    let foundPost = await PostModel.find({ author: _id })
      .limit(5)
      .skip(skip)
      .populate("author", ["photo", "username"]);
    res.send(foundPost);
  } catch (err) {
    console.log(err);
  }
});

//取的帳號留言紀錄
router.get("/tweet-replys/:_id", async (req, res) => {
  let { _id } = req.params;

  try {
    const foundReplys = await PostModel.find({ "reply.user": _id }).populate(
      "reply.user",
      ["photo", "username"]
    );
    res.send(foundReplys);
  } catch (err) {
    console.log(err);
  }
});

module.exports = router;
