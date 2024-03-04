const router = require("express").Router();
const userModel = require("../models").userModel;
const openModal = require("../models").postModel;
const uploadImage = require("../models/imgurUpload");
const multer = require("multer");
const upload = multer();

router.use((req, res, next) => {
  console.log("post route is requset");
  next();
});

//編輯個人資料
router.patch("/edit", upload.array("image"), async (req, res, next) => {
  let _id = req.user._id;
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
  } else if (req.body.URL_image != "") {
    imageURL = req.body.URL_image;
  }
  let { name, about } = req.body;
  console.log(req.body);
  await userModel
    .findOneAndUpdate({ _id }, { username: name, about, photo: imageURL })
    .then((d) => {
      res.send("success");
    })
    .catch((e) => {
      console.log(e);
    });
});

//編輯背景圖
router.patch("/edit-bg", upload.array("image"), async (req, res, next) => {
  let _id = req.user._id;
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
  await userModel
    .findOneAndUpdate({ _id }, { bg: imageURL })
    .then(() => {
      res.send("success");
    })
    .catch((e) => {
      console.log(e);
    });
});

module.exports = router;
