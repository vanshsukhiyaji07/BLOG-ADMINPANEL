const Admin = require('../models/Admin');
const path = require('path');
const fs = require('fs');
const bcrypt = require('bcrypt');

module.exports.loginpage = (req, res) => {
    return res.render('login');
};

module.exports.checkLogin = async (req, res) => {
    try {
        req.flash('success',"Login Successfully....");
        return res.redirect('/dashboard');
    } catch (err) {
        console.log(err);
        return res.render('admin/login');
    }   
};

module.exports.changePassword = async (req,res) => {
    try{
        if(req.user == undefined){
            return res.redirect('/');
        }
        let adminId = req.user._id;
        let adminData = await Admin.findById(adminId);
        if(adminData){
            let adminRecord = req.user;
            return res.render('admin/change-password', {
                adminRecord 
            });
        }

    }catch(err){
        console.log(err);
        return res.render('admin/login');
    }
}

module.exports.checkChangePassword = async (req,res) => {
    try{
        let oldPassHash = req.user.password; // hashed password from DB
        let adminId = req.user._id;
        console.log(req.body);

        // Validate old password against hash
        const isOldCorrect = await bcrypt.compare(req.body.oldPassword, oldPassHash);
        if(!isOldCorrect){
            req.flash('error', 'Old password is incorrect.');
            console.log("Old Password not Match..");
            return res.redirect('/admin/change-password');
        }

        // Prevent reusing the same password
        if(req.body.oldPassword === req.body.newPassword){
            req.flash('error', 'New password must be different from old password.');
            return res.redirect('/admin/change-password');
        }

        // Confirm new passwords match
        if(req.body.newPassword !== req.body.confirmPassword){
            req.flash('error', 'New password and confirm password do not match.');
            return res.redirect('/admin/change-password');
        }

        // Hash and update the new password
        const newHashed = await bcrypt.hash(req.body.newPassword, 10);
        let adminData = await Admin.findByIdAndUpdate(adminId, { password: newHashed });
        if(adminData){
            req.flash('success', 'Password changed successfully. Please log in again.');
            return res.redirect('/admin/logout');
        }

    }catch(err){
        console.log(err);
        req.flash('error', 'Something went wrong while changing password.');
        return res.redirect('/admin/change-password');
    }
}

module.exports.logout = async (req,res) => {
    try{
        req.session.destroy(function(err) {
            if(err){
                console.log(err);
                return false;
            }
            return res.redirect('/');
        })          
    }catch(err){
        console.log(err);
        return res.redirect('/');
    }
}

module.exports.adminpage = async (req, res) => {
    try{
        return res.render('modern-dashboard');
    }catch(err){
        console.log(err);        
        return res.redirect('/'); 
    }
};

module.exports.add_admin = async (req, res) => {
    try{
        // This page is now public to allow creating the first admin.
        // The view should handle cases where adminRecord is not present.
        let adminRecord = null;
        if (req.user) {
            adminRecord = await Admin.findById(req.user._id);
        }
        return res.render('admin/add-admin', {
            adminRecord: adminRecord
        });
    }catch(err){
        console.log(err);
        req.flash('error', 'Error loading the page');
        return res.redirect(req.get('Referrer') || '/');
    }
};

module.exports.deleteAdmin = async (req, res) => {
    try {
        let adminId = req.params.adId;
        let adminData = await Admin.findById(adminId);
        
        if (adminData) {
            if (adminData.profileImage) {
                let imgPath = path.join(__dirname, "..", adminData.profileImage);
                try {
                    fs.unlinkSync(imgPath);
                    console.log("Profile image file deleted successfully");
                } catch (err) {
                    console.log("Error while deleting profile image:", err);
                }
            }
            
            let deleteAdminData = await Admin.findByIdAndDelete(adminId);
            
            if (deleteAdminData) {
                console.log("Admin Record Deleted Successfully");
                req.flash('success',"Admin Record Deleted Successfully....");
                return res.redirect('/admin/view-admin');
            } else {
                console.log("Error While Deleting Admin Record...");
                req.flash('success',"Error While Deleting Admin Record....");
                return res.redirect('/admin/view-admin');
            }
        } else {
            console.log("Admin Record Not Found");
            return res.redirect('/admin/view-admin');
        }

    } catch (err) {
        console.log(err);
        return res.redirect('/admin/view-admin');
    }
}

module.exports.update_admin = async (req, res) => {
    try{
        let adminId = req.query.adminId;
        let oldAdminData = await Admin.findById(adminId);
        if(oldAdminData){
            return res.render('admin/update-admin', {
                admin: oldAdminData,
                oldAdminData: oldAdminData
            });
        }
        else{
            console.log("Record not Found...");
            return res.redirect('/admin/view-admin')
        }

    }catch(err){
        console.log(err);
    }
}

module.exports.updateAdminData = async (req, res) => {
    try {
        let adminId = req.body.adminId;
        let adminData = await Admin.findById(adminId);

        if (adminData) {
            let updatedData = {
                ...req.body
            };

            if (req.file) {
                if (adminData.profileImage) {
                    let imgPath = path.join(__dirname, "..", adminData.profileImage);
                    try {
                        fs.unlinkSync(imgPath);
                    } catch (err) {
                        console.log("Error while deleting old profile image:", err);
                    }
                }
                updatedData.profileImage = Admin.adPath + '/' + req.file.filename;
            }

            await Admin.findByIdAndUpdate(adminId, updatedData);
            req.flash('success', 'Admin record updated successfully');
            return res.redirect('/admin/view-admin');
        } else {
            req.flash('error', 'Admin record not found');
            return res.redirect('/admin/view-admin');
        }
    } catch (err) {
        console.log(err);
        req.flash('error', 'An error occurred while updating the admin record');
        return res.redirect('/admin/view-admin');
    }
};

module.exports.view_admin = async (req, res) => {
    try{
        let adminRecord = await Admin.find({});
        // console.log(adminRecord);
        if(adminRecord){
            return res.render('admin/view-admin', {
                admins: adminRecord
            });
        }else{
            return res.render('admin/view-admin');
        } 
    }catch(err){
        console.log(err);        
    }    
};

module.exports.insertAdminData = async (req, res) => {
    try {
        let imagePath = '';
        if (req.file) {
            imagePath = Admin.adPath + '/' + req.file.filename;
        } else {
            req.flash('error', 'Profile image is required.');
            return res.redirect(req.get('Referrer') || '/');
        }

        const adminExists = await Admin.findOne({ email: req.body.email });

        if (adminExists) {
            fs.unlinkSync(path.join(__dirname, '..', imagePath));
            req.flash('error', 'Admin with this email already exists.');
            return res.redirect(req.get('Referrer') || '/');
        }

        const newAdmin = new Admin({
            firstName: req.body.firstName,
            lastName: req.body.lastName,
            email: req.body.email,
            password: req.body.password,
            contactNumber: req.body.contactNumber,
            gender: req.body.gender,
            hobby: Array.isArray(req.body.hobby) ? req.body.hobby : (req.body.hobby ? [req.body.hobby] : []),
            description: req.body.description,
            profileImage: imagePath
        });

        await newAdmin.save();

        req.flash('success', 'Admin added successfully!');
        return res.redirect('/admin/view-admin');

    } catch (err) {
        console.log('Error in insertAdminData:', err);
        req.flash('error', 'Error in adding admin.');
        return res.redirect(req.get('Referrer') || '/');
    }
}
