const router = require("express").Router();
const postModel = require("../models").postModel;

router.use((req, res, next) => {
  console.log("post route is requset");
  next();
});

//get all post
router.get("/", async (req, res) => {
  let getPost = await postModel
    .find({})
    .sort({ date: -1 })
    .populate("author", ["username", "photo"])
    .exec();
  res.send(getPost);
});

//user data
router.get("/userData/:_id", async (req, res) => {
  let { _id } = req.params;
  try {
    let data = await postModel.find({ author: _id }).populate("like").exec();
    res.send(data);
  } catch (e) {
    res.send(e);
  }
});

//search post
router.get("/:_id", async (req, res) => {
  let { _id } = req.params;
  try {
    let searchPost = await postModel
      .findOne({ _id })
      .populate("author", ["username", "photo", "_id"])
      .populate("reply.user", ["username", "photo"])
      .exec();
    res.send(searchPost);
  } catch (e) {
    res.send(e);
  }
});

module.exports = router;
