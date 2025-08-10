const express = require("express");
const path = require("path");
const mongoose = require("mongoose");
const session = require("express-session");
const passport = require("passport");
const passportLocal = require("./config/passport-local");
const passportUser = require("./config/passport-user");
const flash = require("connect-flash");
const fs = require("fs");

const app = express();
const port = 8000;

// Create uploads directories if they don't exist
const uploadsDirs = ["admins", "categories", "blogs"];
uploadsDirs.forEach((dir) => {
  const dirPath = path.join(__dirname, "uploads", dir);
  if (!fs.existsSync(dirPath)) {
    fs.mkdirSync(dirPath, { recursive: true });
  }
});

// Database connection
mongoose
  .connect("mongodb://127.0.0.1/blog-admin-db")
  .then(() => console.log("DB connected"))
  .catch((err) => console.log("DB connection error:", err));

// View engine setup
app.set("view engine", "ejs");
app.set("views", path.join(__dirname, "views"));

app.use(express.urlencoded({ extended: true }));
app.use(express.json());
app.use(express.static(path.join(__dirname, "public")));
app.use("/assets", express.static(path.join(__dirname, "public/assets")));
app.use("/uploads", express.static(path.join(__dirname, "uploads")));

// Session setup
app.use(
  session({
    name: "blog-admin",
    secret: "your-secret-key",
    resave: false,
    saveUninitialized: false,
    cookie: {
      maxAge: 1000 * 60 * 100,
    },
  })
);

// Passport setup - only one instance
app.use(passport.initialize());
app.use(passport.session());
app.use(passport.setAuthenticatedUser);

// Flash messages setup
app.use(flash());
app.use((req, res, next) => {
  res.locals.flash = {
    success: req.flash("success"),
    error: req.flash("error"),
  };
  next();
});

// Import routes
const mainRouter = require("./routes");
const userRoutes = require("./routes/userRoutes");

// Use the main router
app.use("/", mainRouter);
app.use("/user", userRoutes);

app.listen(port, (err) => {
  if (err) console.log("Server error");
  console.log(`Server is running on port: ${port}`);
});
