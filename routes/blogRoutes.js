const express = require('express');
const router = express.Router();
const blogController = require('../controllers/blogController');
const Blog = require('../models/blog');
const multer = require('multer');
const path = require('path');

// Multer storage setup
const storage = multer.diskStorage({
    destination: function (req, file, cb) {
        cb(null, path.join(__dirname, '..', 'uploads/blogs'));
    },
    filename: function (req, file, cb) {
        const uniqueSuffix = Date.now() + '-' + Math.round(Math.random() * 1E9);
        cb(null, file.fieldname + '-' + uniqueSuffix);
    }
});

// Multer upload instance
const upload = multer({ storage: storage }).single('blogImage');

// Routes for blog
router.get('/add-blog', blogController.add_blog);
// Insert blog (single canonical route)
router.post('/insert-blog-data', upload, blogController.insertBlogData);
router.get('/view-blog', blogController.view_blog);
router.get('/delete-blog/:id', blogController.deleteBlog);
router.get('/update-blog/:id', blogController.update_blog);
router.post('/update-blog-data', upload, blogController.updateBlogData);

module.exports = router;
