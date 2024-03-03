const router = require("express").Router();
const uploadImage = require("../models/imgurUpload");
const postValidation = require("../validation").postValidation;
const replyValidation = require("../validation").replyValidation;
const multer = require("multer");
const upload = multer();

const postModel = require("../models").postModel;

router.use((req, res, next) => {
  console.log("post route is requset");
  next();
});

//新貼文
router.post("/tweet-post", upload.array("image"), async (req, res, next) => {
  let imageURL;
  if (req.files != "") {
    try {
      imageURL = await uploadImage(req.files[0]);
      if (typeof imageURL == "string") {
        return res.status(500).send(imageURL);
      } else {
        imageURL = imageURL.link;
      }
    } catch (error) {
      res.status(500).send(error.message);
    }
  } else {
    imageURL = req.body.URL_image;
  }
  //若 imgur 回傳圖片上傳失敗，請稍後再試 就 return
  let { title, content, tag } = req.body;
  try {
    let newPost = new postModel({
      author: req.user._id,
      title,
      image: imageURL,
      content,
      tag,
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

//編輯文章
router.patch(
  "/tweet-edit/:_id",
  upload.array("image"),
  async (req, res, next) => {
    let imageURL;
    //文章ID
    let { _id } = req.params;
    let checkPost = await postModel.findOne({ _id });
    if (checkPost.author._id.toString() != req.user._id.toString()) {
      res.send("非樓主");
      return;
    }
    if (req.files != "") {
      try {
        imageURL = await uploadImage(req.files[0]);
        if (typeof imageURL == "string") {
          return res.status(500).send(imageURL);
        } else {
          imageURL = imageURL.link;
        }
      } catch (error) {
        res.status(500).send(error.message);
      }
    } else {
      imageURL = req.body.URL_image;
    }
    //若 imgur 回傳圖片上傳失敗，請稍後再試 就 return
    let { title, content, tag } = req.body;
    try {
      let newPost = await postModel.findOneAndUpdate(
        { _id: _id },
        { title: title, image: imageURL, content: content, tag: tag },
        { new: true }
      );
      res.send(newPost);
    } catch (e) {
      console.log(e);
      res.status(500).send("無法編輯");
    }
  }
);

//刪除文章
router.delete("/tweet-delete/:_id", async (req, res) => {
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

//送出留言
router.patch("/tweet-reply/:_id", async (req, res) => {
  let { _id } = req.params;
  let { reply } = req.body;
  try {
    let postFound = await postModel
      .findOne({ _id })
      .populate("author", ["username", "photo"])
      .populate("reply.user", ["username", "photo"]);
    if (!postFound) {
      return res.status(500).send("查無貼文");
    }
    postFound.reply.push({ user: req.user._id, content: reply });
    await postFound.save();
    res.send(postFound);
  } catch (e) {
    res.status(500).send("無法送出留言");
  }
});

// 編輯留言
router.patch("/reply-edit/:_post_id/:_id", async (req, res) => {
  let { _post_id } = req.params; //文章ID
  let { _id } = req.params; //留言ID
  let { reply } = req.body; //留言內容
  console.log(_post_id);
  try {
    let findPost = await postModel
      .findOne({ _id: _post_id })
      .populate("author", ["username", "photo"])
      .populate("reply.user", ["username", "photo"])
      .exec();
    if (!findPost) return res.send("查無文章");
    let index = findPost.reply.findIndex((r) => {
      //查該留言在 reply array 的哪個 index
      return r._id == _id;
    });

    if (findPost.reply[index].user._id.toString() == req.user._id.toString()) {
      findPost.reply[index].content = reply;
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

//喜歡文章
router.patch("/tweet-like/:_id", async (req, res) => {
  // 文章ID
  let { _id } = req.params;
  let action = req.query;
  let update;
  console.log(req.query);
  if (action.action == "add") {
    update = { $addToSet: { like: req.user._id } };
  } else if (action.action == "remove") {
    update = { $pull: { like: req.user._id } };
  } else {
    return res.status(400).send("無效的操作");
  }
  try {
    let newPostLike = await postModel
      .findOneAndUpdate({ _id }, update, { new: true })
      .populate("author", ["username", "photo"])
      .populate("reply.user", ["username", "photo"]);
    if (!newPostLike) return res.send("沒有找到文章");
    res.send(newPostLike);
  } catch (err) {
    console.log(err);
  }
});

// //喜歡留言
router.patch("/:_id/replylike/:_replyid", async (req, res) => {
  let { _id } = req.params; //貼文ID
  let { _replyid } = req.params; //貼文內的留言ID
  let action = req.query;
  if (action.action == "add") {
    update = { $addToSet: { "reply.$.like": req.user._id } };
  } else if (action.action == "remove") {
    update = { $pull: { "reply.$.like": req.user._id } };
  } else {
    return res.status(400).send("無效的操作");
  }

  try {
    let foundPost = await postModel
      .findOneAndUpdate(
        { _id, reply: { $elemMatch: { _id: _replyid } } },
        update,
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

module.exports = router;
