const Blog = require('../models/blog');
const Category = require('../models/category');
const fs = require('fs');
const path = require('path');

module.exports.add_blog = async (req, res) => {
    try {
        let categories = await Category.find({});
        return res.render('blog/add-blog', {
            categories,
            admin: req.user,
            title: 'Add Blog'
        });
    } catch (err) {
        console.log(err);
        return res.redirect('back');
    }
};

module.exports.insertBlogData = async (req, res) => {
    try {
        let imagePath = '';
        if (req.file) {
            imagePath = Blog.blogPath + '/' + req.file.filename;
        }
        req.body.blogImage = imagePath;
        // Normalize fields
        req.body.authorName = req.body.authorName || (req.user ? `${req.user.firstName} ${req.user.lastName}` : 'Admin');
        req.body.author = req.user._id; // Assuming admin is logged in
        // Handle featured checkbox
        req.body.featured = req.body.featured ? true : false;
        // Handle tags comma-separated
        if (typeof req.body.tags === 'string') {
            req.body.tags = req.body.tags.split(',').map(t => t.trim()).filter(Boolean);
        }
        // Handle scheduled publish date
        if (req.body.status === 'scheduled' && req.body.publishDate) {
            req.body.publishDate = new Date(req.body.publishDate);
        } else if (req.body.status === 'published' && !req.body.publishDate) {
            req.body.publishDate = new Date();
        }
        let blog = await Blog.create(req.body);
        if (blog) {
            req.flash('success', 'Blog post added successfully');
        } else {
            req.flash('error', 'Failed to add blog post');
        }
        return res.redirect('/blog/add-blog');
    } catch (err) {
        console.log(err);
        req.flash('error', 'An error occurred');
        return res.redirect('back');
    }
};

module.exports.view_blog = async (req, res) => {
    try {
        let blogs = await Blog.find({}).populate('author').populate('category');
        return res.render('blog/view-blog', {
            blogs,
            title: 'View Blogs'
        });
    } catch (err) {
        console.log(err);
        return res.redirect('back');
    }
};

module.exports.deleteBlog = async (req, res) => {
    try {
        let blog = await Blog.findById(req.params.id);
        if (blog.blogImage) {
            fs.unlinkSync(path.join(__dirname, '..', blog.blogImage));
        }
        await Blog.findByIdAndDelete(req.params.id);
        req.flash('success', 'Blog post deleted successfully');
        return res.redirect('back');
    } catch (err) {
        console.log(err);
        req.flash('error', 'An error occurred');
        return res.redirect('back');
    }
};

module.exports.update_blog = async (req, res) => {
    try {
        let blog = await Blog.findById(req.params.id);
        let categories = await Category.find({});
        return res.render('blog/update-blog', {
            blog,
            categories,
            title: 'Update Blog'
        });
    } catch (err) {
        console.log(err);
        return res.redirect('back');
    }
};

module.exports.updateBlogData = async (req, res) => {
    try {
        if (req.file) {
            let oldBlog = await Blog.findById(req.body.id);
            if (oldBlog.blogImage) {
                fs.unlinkSync(path.join(__dirname, '..', oldBlog.blogImage));
            }
            req.body.blogImage = Blog.blogPath + '/' + req.file.filename;
        }
        // Normalize featured and tags on update
        req.body.featured = req.body.featured ? true : false;
        if (typeof req.body.tags === 'string') {
            req.body.tags = req.body.tags.split(',').map(t => t.trim()).filter(Boolean);
        }
        if (req.body.status === 'scheduled' && req.body.publishDate) {
            req.body.publishDate = new Date(req.body.publishDate);
        } else if (req.body.status === 'published' && !req.body.publishDate) {
            req.body.publishDate = new Date();
        }
        await Blog.findByIdAndUpdate(req.body.id, req.body);
        req.flash('success', 'Blog post updated successfully');
        return res.redirect('/blog/view-blog');
    } catch (err) {
        console.log(err);
        req.flash('error', 'An error occurred');
        return res.redirect('back');
    }
};
