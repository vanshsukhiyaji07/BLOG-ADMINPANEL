const express = require('express');
const router = express.Router();
const categoryController = require('../controllers/categoryController');
const Category = require('../models/category');
const multer = require('multer');
const path = require('path');

// Multer storage setup
const storage = multer.diskStorage({
    destination: function (req, file, cb) {
        cb(null, path.join(__dirname, '..', Category.catPath));
    },
    filename: function (req, file, cb) {
        const uniqueSuffix = Date.now() + '-' + Math.round(Math.random() * 1E9);
        cb(null, file.fieldname + '-' + uniqueSuffix);
    }
});

// Multer upload instance
const upload = multer({ storage: storage }).single('profileImage');

// Routes
router.get('/add-category', categoryController.add_category);
// Insert category (single canonical route)
router.post('/insert-category-data', upload, categoryController.insertCategoryData);
router.get('/view-category', categoryController.view_category);
router.get('/delete-category/:id', categoryController.deleteCategory);
router.get('/update-category/:id', categoryController.update_category);
router.post('/update-category-data', upload, categoryController.updateCategoryData);

module.exports = router;
