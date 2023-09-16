const router = require("express").Router();
const registerValidation = require("../validation").registerValidation;
const loginValidation = require("../validation").loginValidation;
const User = require("../models").userModel;
const jwt = require("jsonwebtoken");

router.use((req, res, next) => {
  console.log("A requsert is coming in to auth.js");
  next();
});

router.get("/testApi", (req, res) => {
  res.send("success auth Router");
});

router.post("/register", async (req, res) => {
  // console.log(registerValidation(req.body).error.details[0].message);
  //確認輸入資料是否符合規範 (Joi)
  let { error } = registerValidation(req.body);
  if (error) return res.status(400).send(error.details[0].message);

  const emailExist = await User.findOne({ email: req.body.email });
  if (emailExist) return res.status(400).send({ emailExist: true });

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

router.post("/login", async (req, res) => {
  let { error } = loginValidation(req.body);
  const foundUser = await User.findOne({ email: req.body.email });
  if (!foundUser) {
    return res.status(401).send({ email: false });
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
      return res.status(401).send({ password: false });
    }
  });
});

module.exports = router;
