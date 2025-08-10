const mongoose = require('mongoose');
const multer = require('multer'); // added multer library
const bcrypt = require('bcrypt');

const AdminSchema = new mongoose.Schema({
    firstName: {
        type: String,
        required: true
    },
    lastName: {
        type: String,
        required: true
    },
    email: {
        type: String,
        required: true,
        unique: true,
        lowercase: true,
        trim: true
    },
    password: {
        type: String,
        required: true
    },
    contactNumber: {
        type: String,
        required: true
    },
    gender: {
        type: String,
        required: true
    },
    hobby: {
        type: Array,
        required: true
    },
    description: {
        type: String,
        required: true
    },
    profileImage: {
        type: String, 
        required: true
    }
}, { 
    timestamps: true,
    toJSON: { virtuals: true },
    toObject: { virtuals: true }
});

// Virtual for full name
AdminSchema.virtual('name').get(function() {
    return `${this.firstName} ${this.lastName}`;
});

// Pre-save hook to hash password
AdminSchema.pre('save', async function(next) {
    // normalize email
    if (this.isModified('email') && this.email) {
        this.email = this.email.toLowerCase().trim();
    }
    if (!this.isModified('password')) {
        return next();
    }
    this.password = await bcrypt.hash(this.password, 10);
    next();
});

AdminSchema.statics.adPath = '/uploads/admins'; // added static path 'adPath'

const Admin = mongoose.model('Admin', AdminSchema);

module.exports = Admin;
