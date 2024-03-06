const router = require("express").Router();
const postModel = require("../models").postModel;
const userModel = require("../models").userModel;

router.use((req, res, next) => {
  console.log("post route is requset");
  next();
});

//get all post
router.get("/:_tag?" || "/", async (req, res) => {
  let { _tag } = req.params;
  let tag;
  if (_tag == "code") tag = { tag: 1 };
  if (_tag == "anime") tag = { tag: 2 };
  if (_tag == "game") tag = { tag: 3 };
  if (_tag == "feel") tag = { tag: 4 };
  let { sort } = req.query;
  if (sort == "old") sort = { date: 1 };
  if (sort == "undefined") sort = { date: -1 };
  if (sort == "hot") sort = { reply: -1 };
  let { count } = req.query;
  let skip = count * 5;
  if (sort == "like") {
    if (_tag == "undefined") {
      try {
        let getPost = await postModel.aggregate([
          { $addFields: { likeCount: { $size: "$like" } } },
          { $sort: { likeCount: -1 } },
          { $skip: skip },
          { $limit: 5 },
          {
            $lookup: {
              from: "users",
              localField: "author",
              foreignField: "_id",
              as: "author",
            },
          },
          { $unwind: "$author" },
          { $project: { "author.password": 0 } },
        ]);
        res.send(getPost);
        return;
      } catch (err) {
        res.send(err);
      }
    }
    try {
      let getPost = await postModel.aggregate([
        { $match: tag },
        { $addFields: { likeCount: { $size: "$like" } } },
        { $sort: { likeCount: -1 } },
        { $skip: skip },
        { $limit: 5 },
        {
          $lookup: {
            from: "users",
            localField: "author",
            foreignField: "_id",
            as: "author",
          },
        },
        { $unwind: "$author" },
        { $project: { "author.password": 0 } },
      ]);
      res.send(getPost);
    } catch (err) {
      res.send(err);
    }
    return;
  }
  try {
    let getPost = await postModel
      .find(tag)
      .sort(sort)
      .populate("author", ["username", "photo"])
      .limit(5)
      .skip(skip)
      .exec();
    console.log(getPost);
    res.send(getPost);
  } catch (err) {
    res.send(err);
  }
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

//post
router.get("/tweet/:_id", async (req, res) => {
  let { _id } = req.params;
  try {
    let searchPost = await postModel
      .findOne({ _id })
      .populate("author", ["username", "photo", "_id", "date", "bg"])
      .populate("reply.user", ["username", "photo", "date", "bg"])
      .exec();
    res.send(searchPost);
  } catch (e) {
    res.send(e);
  }
});

//search
router.get("/search/:_data", async (req, res) => {
  let { _data } = req.params;
  console.log(_data);
  try {
    let searchPost = await postModel
      .find({ title: { $regex: new RegExp(_data, "i") } })
      .exec();
    let searchUser = await userModel
      .find(
        { username: { $regex: new RegExp(_data, "i") } },
        { username: 1, photo: 1 }
      )
      .exec();
    res.send({ post: searchPost, user: searchUser, _data });
  } catch (err) {
    res.send(err);
  }
});

module.exports = router;
