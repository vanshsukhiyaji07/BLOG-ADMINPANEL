const User = require("../models/User");
const bcrypt = require("bcrypt");
const Blog = require("../models/blog");

module.exports.registerPage = (req, res) => {
  return res.render("user/register");
};

module.exports.register = async (req, res) => {
  try {
    const { name, email, password, confirmPassword } = req.body;
    if (password !== confirmPassword) {
      req.flash("error", "Passwords do not match");
      return res.redirect("/user/register");
    }
    const existingUser = await User.findOne({ email });
    if (existingUser) {
      req.flash("error", "Email already registered");
      return res.redirect("/user/register");
    }
    const user = new User({ name, email, password });
    await user.save();
    req.flash("success", "Registration successful! Please log in.");
    return res.redirect("/user/login");
  } catch (err) {
    console.log(err);
    req.flash("error", "Registration failed");
    return res.redirect("/user/register");
  }
};

module.exports.loginPage = (req, res) => {
  return res.render("user/login");
};

module.exports.login = async (req, res) => {
  // Handled by passport local strategy
  return res.redirect("/user/profile");
};

module.exports.logout = (req, res) => {
  req.logout(function (err) {
    if (err) {
      console.log(err);
    }
    req.flash("success", "Logged out successfully");
    res.redirect("/user/login");
  });
};

module.exports.profile = async (req, res) => {
  if (!req.user) {
    return res.redirect("/user/login");
  }
  try {
    const blogs = await Blog.find({}).populate("author").populate("category");
    return res.render("user/profile", { user: req.user, blogs });
  } catch (err) {
    console.log(err);
    return res.render("user/profile", { user: req.user, blogs: [] });
  }
};

module.exports.userBlogs = async (req, res) => {
  try {
    const now = new Date();
    // Only show published blogs (or scheduled whose publishDate has passed)
    const blogs = await Blog.find({
      $or: [
        { status: 'published' },
        { status: 'scheduled', publishDate: { $lte: now } }
      ]
    }).sort({ createdAt: -1 }).populate("author").populate("category");
    return res.render("user/blogs", { blogs });
  } catch (err) {
    console.log(err);
    req.flash("error", "Could not fetch blogs");
    return res.redirect("/user/profile");
  }
};

module.exports.blogDetail = async (req, res) => {
  try {
    const blog = await Blog.findById(req.params.id)
      .populate("author")
      .populate("category");
    if (!blog) {
      req.flash("error", "Blog not found");
      return res.redirect("/user/blogs");
    }
    // Only allow viewing published or already-scheduled-and-released posts
    const now = new Date();
    if (!(blog.status === 'published' || (blog.status === 'scheduled' && blog.publishDate && blog.publishDate <= now))) {
      req.flash("error", "Blog is not published yet");
      return res.redirect("/user/blogs");
    }
    return res.render("user/blogDetail", { blog });
  } catch (err) {
    console.log(err);
    req.flash("error", "Could not fetch blog details");
    return res.redirect("/user/blogs");
  }
};
