const express = require("express");
const app = express();
const mongoose = require("mongoose");
const dotenv = require("dotenv");
dotenv.config();
const { auth } = require("./routes");
const { postRoute } = require("./routes");
const { homeRoute } = require("./routes");
const { useredit } = require("./routes");
const passport = require("passport");
require("./config/passport")(passport);
const cors = require("cors");

mongoose
  .connect(process.env.DB_CONNECT)
  .then(() => {
    console.log("Connect to Mongo Altas");
  })
  .catch((e) => {
    console.log(e);
  });

app.use(express.json());
app.use(express.urlencoded({ extended: true }));
app.use(cors());

app.use("/api/home", homeRoute);
app.use("/api/user", auth);

//進入/api/post 的 middlewares
app.use(
  "/api/post",
  passport.authenticate("jwt", { session: false }), //passport.apthenticate ues config/passport.js
  postRoute
);

//user edit route
app.use(
  "/api/user/profile",
  passport.authenticate("jwt", { session: false }),
  useredit
);

app.listen(8080, () => {
  console.log("Service is running on port 8080");
});
