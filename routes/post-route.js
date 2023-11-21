const router = require("express").Router();
const postValidation = require("../validation").postValidation;
const replyValidation = require("../validation").replyValidation;
const e = require("cors");

const postModel = require("../models").postModel;
const userModel = require("../models").userModel;

router.use((req, res, next) => {
  console.log("post route is requset");
  next();
});

//新貼文(只有文字的貼文)
router.post("/", async (req, res) => {
  console.log(req.body);

  let { error } = postValidation(req.body);
  if (error) return res.status(400).send(error.details[0].message);
  let { content } = req.body;
  //   console.log(req.user); retrun in passprot.js done()
  if (!req.user.isMember()) {
    return res.send("未登入或是還沒有認證");
  }
  try {
    let newPost = new postModel({
      author: req.user._id,
      content,
    });
    let savedPost = await newPost.save();
    res.send({
      message: "新貼文已送出",
      savedPost,
    });
  } catch (e) {
    res.status(500).send("無法張貼新貼文");
  }
});

//新貼文有文字及圖片
router.post("/postimage", async (req, res) => {
  //確認contemt資料是否符合規範
  let { image } = req.body;
  let { content } = req.body;
  // console.log(image);
  console.log(content);

  //確認是否登入
  if (!req.user.isMember()) {
    return res.send("未登入或是還沒有認證");
  }
  try {
    let newPost = new postModel({
      author: req.user._id,
      content,
      image,
    });
    let savedPost = await newPost.save();
    res.send({
      message: "新貼文已送出",
      savedPost,
    });
  } catch (e) {
    res.status(500).send("無法張貼新貼文");
  }
});

//編輯貼文( 新增圖片 或 更改圖片 )
router.post("/editpostchangeimage", async (req, res) => {
  //確認是否登入
  if (!req.user.isMember()) {
    return res.send("未登入或是還沒有認證");
  }
  let { image } = req.body;
  let { content } = req.body;
  let { _id } = req.body;
  try {
    let editData = await postModel
      .findOneAndUpdate({ _id }, { content, image }, { new: true })
      .populate("author", ["username", "photo"])
      .populate("reply.user", ["username", "photo"]);
    res.send(editData);
  } catch (err) {
    console.log(err);
  }
});

//編輯貼文(取消原本圖片)
router.post("/editepostdelimg/:_id", async (req, res) => {
  let _id = req.params;
  let { content } = req.body;
  try {
    let editData = await postModel
      .findOneAndUpdate({ _id }, { content, image: "" }, { new: true })
      .populate("author", ["username", "photo"])
      .populate("reply.user", ["username", "photo"]);
    res.send(editData);
  } catch (err) {
    console.log(err);
  }
});

//編輯貼文 (僅更改內容 不更改圖片)
router.post("/editepost/:_id", async (req, res) => {
  let _id = req.params;
  let { content } = req.body;
  try {
    let editData = await postModel
      .findOneAndUpdate({ _id }, { content }, { new: true })
      .populate("author", ["username", "photo"])
      .populate("reply.user", ["username", "photo"]);
    res.send(editData);
  } catch (err) {
    console.log(err);
  }
});

//留言
router.post("/:_id/reply", async (req, res) => {
  let { error } = replyValidation(req.body);
  if (error) return res.status(400).send(error.details[0].message);

  let { _id } = req.params;
  let { content } = req.body;
  try {
    let postFound = await postModel.findOne({ _id });
    if (!postFound) {
      return res.status(500).send("查無貼文");
    }
    postFound.reply.push({ user: req.user._id, content });
    await postFound.save();
    res.send(postFound.reply);
  } catch (e) {
    res.status(500).send("無法送出留言");
  }
});

//喜歡文章
router.post("/:_id/postlike", async (req, res) => {
  let { _id } = req.params;
  try {
    let newPostLike = await postModel
      .findOneAndUpdate(
        { _id },
        { $addToSet: { like: req.user._id } },
        { new: true }
      )
      .populate("author", ["username", "photo"])
      .populate("reply.user", ["username", "photo"]);
    if (!newPostLike) return res.send("沒有找到文章");
    res.send(newPostLike);
  } catch (err) {
    console.log(err);
  }
});

//編輯留言
router.patch("/editreply/:_id", async (req, res) => {
  let { _id } = req.params; //文章ID
  let { Reply_id } = req.body; //留言ID
  let { content } = req.body; //留言內容
  try {
    let findPost = await postModel
      .findOne({ _id })
      .populate("author", ["username", "photo"])
      .populate("reply.user", ["username", "photo"])
      .exec();
    if (!findPost) return res.send("查無文章");
    let index = findPost.reply.findIndex((r) => {
      //查該留言在 reply array 的哪個 index
      return r._id == Reply_id;
    });

    if (findPost.reply[index].user._id.toString() == req.user._id.toString()) {
      findPost.reply[index].content = content;
      await findPost.save();
      res.send(findPost);
    } else {
      console.log("非本人編輯");
      res.status(500).send({ message: "非本人" });
    }
  } catch (err) {
    console.log(err);
  }
});

//刪除留言
router.delete("/deletereply/:_id/:_replyid", async (req, res) => {
  let { _id } = req.params;
  let { _replyid } = req.params;

  try {
    let findPost = await postModel
      .findOne({ _id })
      .populate("author", ["username", "photo"])
      .populate("reply.user", ["username", "photo"])
      .exec();
    if (!findPost) return res.send("查無文章");
    let index = findPost.reply.findIndex((r) => {
      //查該留言在 reply array 的哪個 index
      return r._id == _replyid;
    });
    if (findPost.reply[index].user._id.toString() == req.user._id.toString()) {
      findPost.reply.splice(index, 1);
      await findPost.save();
      res.send(findPost);
    } else {
      console.log("非本人刪除");
      res.status(500).send({ message: "非本人" });
    }
  } catch (err) {
    console.log(err);
  }
});

//回收喜歡過的文章
router.post("/:_id/postCancelLike", async (req, res) => {
  let { _id } = req.params;
  try {
    let newPostLike = await postModel
      .findOneAndUpdate(
        { _id },
        { $pull: { like: req.user._id } },
        { new: true }
      )
      .populate("author", ["username", "photo"])
      .populate("reply.user", ["username", "photo"]);
    if (!newPostLike) return res.send("沒有找到文章");
    res.send(newPostLike);
  } catch (err) {
    console.log(err);
  }
});

//喜歡留言
router.post("/:_id/replylike/:_Replyid", async (req, res) => {
  let { _id } = req.params; //貼文ID
  let { _Replyid } = req.params; //貼文內的留言ID
  try {
    let foundPost = await postModel
      .findOneAndUpdate(
        { _id, reply: { $elemMatch: { _id: _Replyid } } },
        { $addToSet: { "reply.$.like": req.user._id } },
        { new: true }
      )
      .populate("author", ["username", "photo"])
      .populate("reply.user", ["username", "photo"]);
    if (!foundPost) return res.send("沒有找到文章");

    res.send(foundPost);
  } catch (err) {
    console.log(err);
  }
});

//留言取消喜歡
router.post("/:_id/replyCancelLike/:_Replyid", async (req, res) => {
  let { _id } = req.params; //貼文ID
  let { _Replyid } = req.params; //貼文內的留言ID
  try {
    let foundPost = await postModel
      .findOneAndUpdate(
        { _id, reply: { $elemMatch: { _id: _Replyid } } },
        { $pull: { "reply.$.like": req.user._id } },
        { new: true }
      )
      .populate("author", ["username", "photo"])
      .populate("reply.user", ["username", "photo"]);
    if (!foundPost) return res.send("沒有找到文章");

    res.send(foundPost);
  } catch (err) {
    console.log(err);
  }
});

//刪除貼文
router.delete("/:_id", async (req, res) => {
  let { _id } = req.params;
  try {
    let delPost = await postModel.findOne({ _id }).exec();
    if (!delPost) {
      return res.status(400).send("查無貼文");
    }

    if (delPost.author.equals(req.user._id)) {
      await postModel.deleteOne({ _id }).exec();
      res.send("貼文已被刪除");
    } else {
      res.send("只有author才能刪除");
    }
  } catch (e) {
    res.status(500).send(e);
  }
});

module.exports = router;
