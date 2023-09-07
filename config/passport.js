const passport = require("passport");

let JwtStrategy = require("passport-jwt").Strategy;
let ExtractJwt = require("passport-jwt").ExtractJwt;

const User = require("../models").userModel;

module.exports = (passport) => {
  let opts = {};
  opts.jwtFromRequest = ExtractJwt.fromAuthHeaderWithScheme("jwt");
  opts.secretOrKey = process.env.PASSPORT_SECRET;

  passport.use(
    new JwtStrategy(opts, async function (jwt_payload, done) {
      //jwt  /routes/auth.js   jwt>token
      //   console.log(jwt_payload);
      let foundUser = await User.findOne({ _id: jwt_payload._id }).exec();
      try {
        if (foundUser) {
          return done(null, foundUser);
        } else {
          return done(null, false);
        }
      } catch (e) {
        return done(e, false);
      }
    })
  );
};
