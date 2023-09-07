const router = require("express").Router();
const userModel = require("../models").userModel;

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

module.exports = router;
