const express = require("express");
const router = express.Router();
const passport = require("passport");
const userController = require("../controllers/userController");

// Registration
router.get("/register", userController.registerPage);
router.post("/register", userController.register);

// Login
router.get("/login", userController.loginPage);
router.post(
  "/login",
  passport.authenticate("user-local", {
    failureRedirect: "/user/login",
    failureFlash: true,
  }),
  userController.login
);

// Logout
router.get("/logout", userController.logout);

// Profile (protected)
router.get(
  "/profile",
  passport.checkUserAuthentication,
  userController.profile
);

// View all blogs (public)
router.get("/blogs", userController.userBlogs);

// View single blog detail (public)
router.get("/blogs/:id", userController.blogDetail);

module.exports = router;
