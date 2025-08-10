const Category = require('../models/category');
const fs = require('fs');
const path = require('path');

module.exports.add_category = async (req, res) => {
    try {
        return res.render('category/add-category');
    } catch (err) {
        console.log(err);
        return res.redirect('back');
    }
};

module.exports.insertCategoryData = async (req, res) => {
    try {
        let imagePath = '';
        if (req.file) {
            imagePath = Category.catPath + '/' + req.file.filename;
        }
        req.body.profileImage = imagePath;
        // Ensure name is provided
        if (!req.body.name || !req.body.name.trim()) {
            req.flash('error', 'Category name is required');
            return res.redirect('/category/add-category');
        }
        let category = await Category.create(req.body);
        if (category) {
            req.flash('success', 'Category added successfully');
        } else {
            req.flash('error', 'Failed to add category');
        }
        return res.redirect('/category/add-category');
    } catch (err) {
        console.log(err);
        req.flash('error', 'An error occurred');
        return res.redirect('back');
    }
};

module.exports.view_category = async (req, res) => {
    try {
        let categories = await Category.find({});
        return res.render('category/view-category', {
            categories
        });
    } catch (err) {
        console.log(err);
        return res.redirect('back');
    }
};

module.exports.deleteCategory = async (req, res) => {
    try {
        let category = await Category.findById(req.params.id);
        if (category.profileImage) {
            fs.unlinkSync(path.join(__dirname, '..', category.profileImage));
        }
        await Category.findByIdAndDelete(req.params.id);
        req.flash('success', 'Category deleted successfully');
        return res.redirect('back');
    } catch (err) {
        console.log(err);
        req.flash('error', 'An error occurred');
        return res.redirect('back');
    }
};

module.exports.update_category = async (req, res) => {
    try {
        let category = await Category.findById(req.params.id);
        return res.render('category/update-category', {
            category
        });
    } catch (err) {
        console.log(err);
        return res.redirect('back');
    }
};

module.exports.updateCategoryData = async (req, res) => {
    try {
        if (req.file) {
            let oldCategory = await Category.findById(req.body.id);
            if (oldCategory.profileImage) {
                fs.unlinkSync(path.join(__dirname, '..', oldCategory.profileImage));
            }
            req.body.profileImage = Category.catPath + '/' + req.file.filename;
        }
        await Category.findByIdAndUpdate(req.body.id, req.body);
        req.flash('success', 'Category updated successfully');
        return res.redirect('/category/view-category');
    } catch (err) {
        console.log(err);
        req.flash('error', 'An error occurred');
        return res.redirect('back');
    }
};
