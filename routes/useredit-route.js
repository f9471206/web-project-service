const router = require("express").Router();
const userModel = require("../models").userModel;
const openModal = require("../models").postModel;

router.use((req, res, next) => {
  console.log("post route is requset");
  next();
});

//取得個人資料
router.get("/:_id", async (req, res) => {
  let _id = req.params;
  try {
    let foundUser = await userModel.find({ _id });
    if (!foundUser) return res.send("查無ID");
    res.send(foundUser);
  } catch (err) {
    console.log(err);
  }
});

//編輯個人資料  (僅編輯暱稱)
router.patch("/edit/:_id", async (req, res) => {
  let _id = req.params;
  await userModel
    .findOneAndUpdate({ _id }, { username: req.body.username })
    .then(() => {
      res.send({ message: "success" });
    })
    .catch((err) => {
      console.log(err);
    });
});

//編輯個人資料 (大頭貼跟暱稱)

router.post("/editAll/:_id", async (req, res) => {
  let _id = req.params;
  let { username } = req.body;
  let { photo } = req.body;
  await userModel
    .findOneAndUpdate(
      { _id },
      {
        username,
        photo,
      }
    )
    .then(() => {
      res.send({ message: "success" });
    })
    .catch((err) => {
      console.log(err);
    });
});

//刪除帳號
router.post("/deleteuser", async (req, res) => {
  let email = req.user.email;
  const foundUser = await userModel.findOne({ email });
  if (!foundUser) {
    return res.status(401).send({ email: false });
  }
  foundUser.comparePassword(req.body.password, async (err, isMath) => {
    if (err) {
      //使用 user-medel.js 的 comparePassword (err , isMath)=> cb()
      return res.status(400).send(err);
    }
    if (isMath) {
      await openModal.deleteMany({ author: req.user._id });
      await userModel.deleteOne({ email });
      res.send("已經刪除");
    } else {
      return res.status(401).send({ password: false });
    }
  });
});

//管理員查看會員
router.post("/emember", async (req, res) => {
  //驗證管理員
  if (req.user.role !== "admin") {
    return res.status(401).send({ role: false });
  }
  //確認帳號
  let email = req.user.email;
  const foundUser = await userModel.findOne({ email });
  if (!foundUser) {
    return res.status(401).send({ email: false });
  }
  let user = await userModel.find({});
  return res.send(user);
});

//管理員查看會員詳細資料
router.get("/manag-emember/:_id", async (req, res) => {
  let _id = req.params;
  //驗證管理員
  if (req.user.role !== "admin") {
    return res.status(401).send({ role: false });
  }
  //確認帳號
  let email = req.user.email;
  const foundUser = await userModel.findOne({ email });
  if (!foundUser) {
    return res.status(401).send({ email: false });
  }

  let content = await openModal.find({
    author: _id,
  });
  return res.send(content);
});

module.exports = router;
