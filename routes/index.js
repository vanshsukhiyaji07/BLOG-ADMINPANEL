const express = require("express");
const router = express.Router();
const passport = require("passport");
const adminController = require("../controllers/adminController");
const Category = require("../models/category");
const Admin = require("../models/Admin");
const Blog = require("../models/blog");

console.log("Main router loaded");

// Login routes
router.get("/login", adminController.loginpage);
router.post(
  "/login",
  passport.authenticate("admin-local", {
    failureRedirect: "/login",
    successRedirect: "/admin/dashboard",
  })
);

// Redirect the home page to the admin login page
router.get("/", (req, res) => {
  return res.redirect("/login");
});

// Modern Dashboard Route
router.get('/dashboard', (req, res) => {
    res.render('modern-dashboard');
});

// Use the specific routers for each section
router.use("/admin", passport.checkAuthentication, require("./adminRoutes"));
router.use(
  "/category",
  passport.checkAuthentication,
  require("./categoryRoutes")
);
router.use("/blog", passport.checkAuthentication, require("./blogRoutes"));

// API routes for admin panel
router.get('/api/categories', passport.checkAuthentication, async (req, res) => {
  try {
    const categories = await Category.find({}, { name: 1 });
    return res.json(categories);
  } catch (err) {
    console.error('Error fetching categories:', err);
    return res.status(500).json({ error: 'Failed to fetch categories' });
  }
});

router.get('/api/stats', passport.checkAuthentication, async (req, res) => {
  try {
    const [adminCount, categoryCount, blogCount] = await Promise.all([
      Admin.countDocuments({}),
      Category.countDocuments({}),
      Blog.countDocuments({ status: { $in: ['published', 'scheduled'] } })
    ]);
    // Simple totalViews placeholder (could be derived from analytics later)
    const totalViews = blogCount * 100; 
    return res.json({ adminCount, categoryCount, blogCount, totalViews });
  } catch (err) {
    console.error('Error fetching stats:', err);
    return res.status(500).json({ error: 'Failed to fetch stats' });
  }
});

// Blog performance (time series + category distribution)
router.get('/api/blog-performance', passport.checkAuthentication, async (req, res) => {
  try {
    const days = parseInt(req.query.days, 10) || 7;
    const now = new Date();
    const start = new Date(now);
    start.setDate(now.getDate() - (days - 1));
    start.setHours(0, 0, 0, 0);
    
    // Line data: published per day by publishDate (fallback to createdAt if missing)
    const lineAgg = await Blog.aggregate([
      {
        $match: {
          $or: [
            { status: 'published' },
            { status: 'scheduled', publishDate: { $lte: now } }
          ],
          $or: [
            { publishDate: { $gte: start, $lte: now } },
            { publishDate: null, createdAt: { $gte: start, $lte: now } }
          ]
        }
      },
      {
        $project: {
          day: {
            $dateToString: {
              format: '%Y-%m-%d',
              date: { $ifNull: ['$publishDate', '$createdAt'] }
            }
          }
        }
      },
      { $group: { _id: '$day', count: { $sum: 1 } } },
      { $sort: { _id: 1 } }
    ]);

    // Build labels for each day in range
    const labels = [];
    const countsMap = new Map(lineAgg.map(d => [d._id, d.count]));
    for (let i = 0; i < days; i++) {
      const d = new Date(start);
      d.setDate(start.getDate() + i);
      const y = d.getFullYear();
      const m = String(d.getMonth() + 1).padStart(2, '0');
      const day = String(d.getDate()).padStart(2, '0');
      const key = `${y}-${m}-${day}`;
      labels.push(key);
    }
    const lineData = labels.map(l => countsMap.get(l) || 0);

    // Pie data: count by category for visible posts
    const pieAgg = await Blog.aggregate([
      {
        $match: {
          $or: [
            { status: 'published' },
            { status: 'scheduled', publishDate: { $lte: now } }
          ]
        }
      },
      { $group: { _id: '$category', count: { $sum: 1 } } }
    ]);
    const categoryIds = pieAgg.map(p => p._id).filter(Boolean);
    const categories = await Category.find({ _id: { $in: categoryIds } }, { name: 1 });
    const idToName = new Map(categories.map(c => [String(c._id), c.name]));
    const pieLabels = pieAgg.map(p => idToName.get(String(p._id)) || 'Uncategorized');
    const pieData = pieAgg.map(p => p.count);

    return res.json({
      line: { labels, data: lineData },
      pie: { labels: pieLabels, data: pieData }
    });
  } catch (err) {
    console.error('Error fetching blog performance:', err);
    return res.status(500).json({ error: 'Failed to fetch blog performance' });
  }
});

module.exports = router;
