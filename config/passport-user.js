const passport = require("passport");
const LocalStrategy = require("passport-local").Strategy;
const User = require("../models/User");
const bcrypt = require("bcrypt");

// Local strategy for users
passport.use(
  "user-local",
  new LocalStrategy(
    { usernameField: "email" },
    async (email, password, done) => {
      try {
        const user = await User.findOne({ email });
        if (!user) {
          return done(null, false, { message: "Incorrect email." });
        }
        const isMatch = await bcrypt.compare(password, user.password);
        if (!isMatch) {
          return done(null, false, { message: "Incorrect password." });
        }
        return done(null, user);
      } catch (err) {
        return done(err);
      }
    }
  )
);

// Middleware to check user authentication
passport.checkUserAuthentication = (req, res, next) => {
  if (req.isAuthenticated() && req.user && req.user.name) {
    return next();
  }
  return res.redirect("/user/login");
};

module.exports = passport;
