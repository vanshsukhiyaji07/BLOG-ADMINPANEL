const mongoose = require('mongoose');

const blogSchema = new mongoose.Schema({
    title: {
        type: String,
        required: true
    },
    content: {
        type: String,
        required: true
    },
    excerpt: {
        type: String,
        default: ''
    },
    blogImage: {
        type: String,
        required: false,
        default: ''
    },
    authorName: {
        type: String,
        required: true
    },
    author: {
        type: mongoose.Schema.Types.ObjectId,
        ref: 'Admin',
        required: true
    },
    category: {
        type: mongoose.Schema.Types.ObjectId,
        ref: 'Category',
        required: true
    },
    status: {
        type: String,
        enum: ['draft', 'published', 'scheduled'],
        default: 'draft'
    },
    publishDate: {
        type: Date
    },
    featured: {
        type: Boolean,
        default: false
    },
    tags: {
        type: [String],
        default: []
    }
}, { timestamps: true });

blogSchema.statics.blogPath = '/uploads/blogs';

const Blog = mongoose.model('Blog', blogSchema);

module.exports = Blog;